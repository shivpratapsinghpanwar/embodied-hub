"""GitHub repository search.

For every query we run two searches against the search API:
* repositories *created* in the lookback window (brand new), sorted by stars;
* popular repositories *pushed* in the window (active and established), sorted by update.

The search API allows 10 requests/minute unauthenticated and 30/minute with a
token, so the fetcher reads the rate-limit headers and sleeps when exhausted.
"""
from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime

import httpx

from ..config import settings
from ..models import Source
from .base import RawItem, parse_dt, squash

log = logging.getLogger(__name__)

SEARCH_URL = "https://api.github.com/search/repositories"

# (search expression, seed tags)
QUERIES: list[tuple[str, list[str]]] = [
    ("topic:robotics", ["robotics"]),
    ("topic:computer-vision", ["computer-vision"]),
    ("topic:embodied-ai", ["embodied-ai"]),
    ("topic:robot-learning", ["robotics"]),
    ('"vision-language-action"', ["embodied-ai"]),
    ('"embodied AI"', ["embodied-ai"]),
    ('"diffusion policy" robot', ["robotics", "diffusion-policy"]),
    ("topic:slam", ["slam"]),
    ("topic:gaussian-splatting", ["3d"]),
    ("topic:nerf", ["3d"]),
    ("topic:3d-reconstruction", ["3d"]),
    ("topic:humanoid", ["humanoid", "robotics"]),
    ("topic:humanoid-robot", ["humanoid", "robotics"]),
    ("topic:imitation-learning", ["imitation-learning"]),
    ("topic:isaac-sim", ["simulation"]),
    ("topic:isaac-lab", ["simulation"]),
    ("topic:mujoco", ["simulation"]),
    ("lerobot in:name,description,readme", ["robotics", "imitation-learning"]),
]
# Note: GitHub's search API rejects (HTTP 422) expressions that combine OR with the date and
# star qualifiers added below, so every entry above must be a single topic or phrase.

TRENDING_MIN_STARS = 200
# Search allows 30 requests/minute with a token and 10 without; pacing below those limits also
# avoids the undocumented "secondary" abuse limit that triggers on bursts.
PACE_WITH_TOKEN = 2.2
PACE_WITHOUT_TOKEN = 6.5
MAX_ATTEMPTS = 4


class GitHubFetcher:
    name = "github"

    def __init__(self) -> None:
        self._pace = PACE_WITH_TOKEN
        self._last_request = 0.0

    async def fetch(self, client: httpx.AsyncClient, since: datetime) -> list[RawItem]:
        token = settings.resolve_github_token()
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
            self._pace = PACE_WITH_TOKEN
        else:
            log.warning("No GitHub token found; search is limited to 10 requests/minute")
            self._pace = PACE_WITHOUT_TOKEN

        date = since.date().isoformat()
        items: dict[str, RawItem] = {}
        for expression, seed in QUERIES:
            searches = (
                (f"{expression} created:>={date}", "stars"),
                (f"{expression} pushed:>={date} stars:>={TRENDING_MIN_STARS}", "updated"),
            )
            for q, sort in searches:
                for repo in await self._search(client, headers, q, sort):
                    raw = self._to_item(repo, seed)
                    existing = items.get(raw.external_id)
                    if existing:
                        for t in raw.tags:
                            if t not in existing.tags:
                                existing.tags.append(t)
                    else:
                        items[raw.external_id] = raw
        log.info("github: %d unique repositories", len(items))
        return list(items.values())

    async def _search(
        self, client: httpx.AsyncClient, headers: dict[str, str], q: str, sort: str
    ) -> list[dict]:
        params = {"q": q, "sort": sort, "order": "desc", "per_page": settings.github_per_query}
        for attempt in range(MAX_ATTEMPTS):
            await self._pace_requests()
            resp = await client.get(SEARCH_URL, headers=headers, params=params)
            if resp.status_code in (403, 429):
                await self._backoff(resp, attempt)
                continue
            if resp.status_code == 422:
                log.warning("github: query rejected: %s", q)
                return []
            resp.raise_for_status()
            data = resp.json()
            if resp.headers.get("X-RateLimit-Remaining") == "0":
                await self._backoff(resp, attempt, why="quota exhausted")
            return data.get("items", [])
        log.warning("github: giving up on query after %d attempts: %s", MAX_ATTEMPTS, q)
        return []

    async def _pace_requests(self) -> None:
        elapsed = time.monotonic() - self._last_request
        if elapsed < self._pace:
            await asyncio.sleep(self._pace - elapsed)
        self._last_request = time.monotonic()

    @staticmethod
    async def _backoff(resp: httpx.Response, attempt: int, why: str = "rate limited") -> None:
        """Wait as long as GitHub asks, or exponentially longer when it gives no hint.

        Secondary (abuse) limits send Retry-After; the primary quota sends X-RateLimit-Reset.
        """
        hinted = 0.0
        retry_after = resp.headers.get("Retry-After")
        if retry_after and retry_after.isdigit():
            hinted = float(retry_after)
        elif resp.headers.get("X-RateLimit-Remaining") == "0":
            hinted = int(resp.headers.get("X-RateLimit-Reset", "0") or 0) - time.time()
        wait = min(max(hinted, 10.0 * 2**attempt), 120.0)
        log.info("github: %s, sleeping %.0fs", why, wait)
        await asyncio.sleep(wait)

    @staticmethod
    def _to_item(repo: dict, seed: list[str]) -> RawItem:
        topics = [t for t in repo.get("topics") or []]
        return RawItem(
            source=Source.github,
            external_id=repo["full_name"],
            kind="repo",
            title=repo["full_name"],
            summary=squash(repo.get("description")),
            url=repo["html_url"],
            authors=(repo.get("owner") or {}).get("login", ""),
            tags=list(seed),
            keywords=topics,
            stars=int(repo.get("stargazers_count") or 0),
            language=repo.get("language") or "",
            published_at=parse_dt(repo.get("created_at")),
            updated_at=parse_dt(repo.get("pushed_at") or repo.get("updated_at")),
        )
