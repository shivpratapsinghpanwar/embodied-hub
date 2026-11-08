"""arXiv Atom API: recent robotics, embodied-AI and 3D-vision papers.

arXiv asks clients to wait about three seconds between requests, so the
fetcher sleeps between queries.
"""
from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime
from urllib.parse import quote_plus, urlencode

import feedparser
import httpx

from ..config import settings
from ..models import Source
from .base import RawItem, parse_dt, squash

log = logging.getLogger(__name__)

API = "https://export.arxiv.org/api/query"
DELAY_SECONDS = 3.0
# arXiv throttles bursts hard (HTTP 429 or dropped connections); back off generously.
RETRY_DELAYS = (5.0, 15.0, 45.0)
REQUEST_TIMEOUT = 60.0

QUERIES: list[tuple[str, list[str]]] = [
    ("cat:cs.RO", ["robotics"]),
    (
        '(cat:cs.CV OR cat:cs.LG OR cat:cs.AI) AND '
        '(abs:embodied OR abs:"vision-language-action" OR abs:"robot manipulation" OR abs:"robot policy")',
        ["embodied-ai"],
    ),
    (
        'cat:cs.CV AND (abs:"3D reconstruction" OR abs:"gaussian splatting" OR abs:SLAM '
        'OR abs:"depth estimation" OR abs:"novel view synthesis")',
        ["computer-vision", "3d"],
    ),
    (
        "cat:cs.CV AND (abs:segmentation OR abs:detection OR abs:tracking) AND "
        '(abs:"open-vocabulary" OR abs:"foundation model" OR abs:"zero-shot")',
        ["computer-vision", "foundation-model"],
    ),
]

_VERSION_SUFFIX = re.compile(r"v\d+$")


class ArxivFetcher:
    name = "arxiv"

    async def fetch(self, client: httpx.AsyncClient, since: datetime) -> list[RawItem]:
        items: dict[str, RawItem] = {}
        for index, (query, seed) in enumerate(QUERIES):
            if index:
                await asyncio.sleep(DELAY_SECONDS)
            entries = await self._query(client, query)
            for entry in entries:
                raw = self._to_item(entry, seed)
                if raw is None:
                    continue
                if raw.published_at < since:
                    continue
                existing = items.get(raw.external_id)
                if existing:
                    for t in raw.tags:
                        if t not in existing.tags:
                            existing.tags.append(t)
                else:
                    items[raw.external_id] = raw
        log.info("arxiv: %d unique papers", len(items))
        return list(items.values())

    async def _query(self, client: httpx.AsyncClient, query: str) -> list:
        qs = urlencode(
            {
                "search_query": query,
                "sortBy": "submittedDate",
                "sortOrder": "descending",
                "max_results": settings.arxiv_per_query,
            },
            quote_via=quote_plus,
        )
        url = f"{API}?{qs}"
        for attempt, delay in enumerate(RETRY_DELAYS, start=1):
            try:
                resp = await client.get(url, timeout=REQUEST_TIMEOUT)
                resp.raise_for_status()
            except httpx.HTTPError as exc:
                log.warning(
                    "arxiv: request failed (attempt %d): %s: %s; retrying in %.0fs",
                    attempt, type(exc).__name__, exc, delay,
                )
                await asyncio.sleep(delay)
                continue
            feed = feedparser.parse(resp.text)
            if feed.entries:
                return feed.entries
            log.info("arxiv: empty feed (attempt %d); retrying in %.0fs", attempt, delay)
            await asyncio.sleep(delay)
        log.warning("arxiv: giving up on query after %d attempts: %s", len(RETRY_DELAYS), query)
        return []

    @staticmethod
    def _to_item(entry, seed: list[str]) -> RawItem | None:
        raw_id = (entry.get("id") or "").rsplit("/", 1)[-1]
        if not raw_id:
            return None
        arxiv_id = _VERSION_SUFFIX.sub("", raw_id)
        names = [a.get("name", "") for a in entry.get("authors", []) if a.get("name")]
        authors = ", ".join(names[:6]) + (" et al." if len(names) > 6 else "")
        categories = [t.get("term", "") for t in entry.get("tags", []) if t.get("term")]
        return RawItem(
            source=Source.arxiv,
            external_id=arxiv_id,
            kind="paper",
            title=squash(entry.get("title")),
            summary=squash(entry.get("summary")),
            url=f"https://arxiv.org/abs/{arxiv_id}",
            authors=authors,
            tags=list(seed),
            keywords=categories,
            published_at=parse_dt(entry.get("published")),
            updated_at=parse_dt(entry.get("updated") or entry.get("published")),
        )
