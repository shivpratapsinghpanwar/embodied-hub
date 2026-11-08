def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_list_all_items(client):
    body = client.get("/api/items").json()
    assert body["total"] == 3
    assert len(body["items"]) == 3
    # default sort is by score, highest first
    assert body["items"][0]["title"] == "acme/openvla-mini"
    assert body["items"][0]["tags"] == ["embodied-ai", "robotics", "manipulation", "vision-language"]
    assert body["items"][0]["published_at"].endswith("Z") or "+00:00" in body["items"][0]["published_at"]


def test_filter_by_tag_requires_exact_tag(client):
    body = client.get("/api/items", params={"tag": "robotics"}).json()
    assert body["total"] == 2
    body = client.get("/api/items", params={"tag": "3d"}).json()
    assert body["total"] == 1
    assert body["items"][0]["kind"] == "model"
    # a substring of a tag must not match
    assert client.get("/api/items", params={"tag": "robot"}).json()["total"] == 0


def test_filter_by_source_and_kind(client):
    assert client.get("/api/items", params={"source": "arxiv"}).json()["total"] == 1
    assert client.get("/api/items", params={"source": "arxiv,github"}).json()["total"] == 2
    assert client.get("/api/items", params={"kind": "model"}).json()["total"] == 1


def test_filter_by_days(client):
    assert client.get("/api/items", params={"days": 30}).json()["total"] == 2


def test_free_text_search(client):
    body = client.get("/api/items", params={"q": "quadruped"}).json()
    assert body["total"] == 1
    assert body["items"][0]["source"] == "arxiv"


def test_sort_newest(client):
    body = client.get("/api/items", params={"sort": "newest"}).json()
    assert body["items"][0]["title"] == "acme/openvla-mini"
    assert body["items"][-1]["kind"] == "paper"


def test_pagination(client):
    body = client.get("/api/items", params={"page_size": 2, "page": 2}).json()
    assert body["total"] == 3
    assert len(body["items"]) == 1


def test_get_item_and_404(client):
    first = client.get("/api/items").json()["items"][0]
    assert client.get(f"/api/items/{first['id']}").json()["title"] == first["title"]
    assert client.get("/api/items/999999").status_code == 404


def test_tags_endpoint(client):
    tags = {t["tag"]: t["count"] for t in client.get("/api/tags").json()}
    assert tags["robotics"] == 2
    assert tags["3d"] == 1
    recent = {t["tag"]: t["count"] for t in client.get("/api/tags", params={"days": 30}).json()}
    assert "locomotion" not in recent


def test_stats_endpoint(client):
    body = client.get("/api/stats").json()
    assert body["total"] == 3
    assert body["by_source"] == {"github": 1, "huggingface": 1, "arxiv": 1}
    assert body["by_kind"] == {"repo": 1, "model": 1, "paper": 1}
    assert body["is_running"] is False


def test_ingest_rejects_unknown_source(client):
    resp = client.post("/api/ingest", params={"source": "bogus"})
    assert resp.status_code == 400


def test_ingest_status(client):
    body = client.get("/api/ingest/status").json()
    assert body["running"] is False
    assert set(body["sources"]) == {"github", "huggingface", "arxiv"}
