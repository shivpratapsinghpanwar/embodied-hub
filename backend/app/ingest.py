"""Run the fetchers, tag and score what they return, and upsert into the database."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx
from sqlmodel import Session, select

from .config import settings
from .db import engine
from .models import IngestRun, Item
from .scoring import compute_score
from .sources import ArxivFetcher, Fetcher, GitHubFetcher, HuggingFaceFetcher, RawItem
from .tagging import infer_tags

log = logging.getLogger(__name__)

FETCHERS: dict[str, Fetcher] = {
    "github": GitHubFetcher(),
    "huggingface": HuggingFaceFetcher(),
    "arxiv": ArxivFetcher(),
}

_lock = asyncio.Lock()
_background_tasks: set[asyncio.Task] = set()


def is_running() -> bool:
    return _lock.locked()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def upsert_items(raw_items: list[RawItem]) -> tuple[int, int]:
    """Insert new items and refresh existing ones. Returns (added, updated)."""
    now = _utcnow()
    added = updated = 0
    with Session(engine) as session:
        for raw in raw_items:
            text = f"{raw.title}\n{raw.summary}\n{' '.join(raw.keywords)}"
            tags = ",".join(infer_tags(text, raw.tags))
            score = compute_score(raw.stars, raw.downloads, raw.published_at, now)
            existing = session.exec(
                select(Item).where(Item.source == raw.source, Item.external_id == raw.external_id)
            ).first()
            if existing:
                existing.title = raw.title
                existing.summary = raw.summary
                existing.url = raw.url
                existing.authors = raw.authors
                existing.tags = tags
                existing.stars = raw.stars
                existing.downloads = raw.downloads
                existing.language = raw.language
                existing.updated_at = raw.updated_at
                existing.fetched_at = now
                existing.score = score
                session.add(existing)
                updated += 1
            else:
                session.add(
                    Item(
                        source=raw.source,
                        external_id=raw.external_id,
                        kind=raw.kind,
                        title=raw.title,
                        summary=raw.summary,
                        url=raw.url,
                        authors=raw.authors,
                        tags=tags,
                        stars=raw.stars,
                        downloads=raw.downloads,
                        language=raw.language,
                        published_at=raw.published_at,
                        updated_at=raw.updated_at,
                        fetched_at=now,
                        score=score,
                    )
                )
                added += 1
        session.commit()
    return added, updated


async def run_ingest(sources: list[str] | None = None) -> dict:
    """Fetch from the given sources (default: all). Only one run executes at a time."""
    if _lock.locked():
        return {"status": "already_running"}
    names = sources or list(FETCHERS)
    unknown = [n for n in names if n not in FETCHERS]
    if unknown:
        raise ValueError(f"unknown sources: {', '.join(unknown)}")

    async with _lock:
        since = _utcnow() - timedelta(days=settings.lookback_days)
        results: dict[str, dict] = {}
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(30.0),
            headers={"User-Agent": "embodied-hub/0.1 (local discovery app)"},
            follow_redirects=True,
        ) as client:
            for name in names:
                run = IngestRun(source=name, started_at=_utcnow())
                log.info("ingest: %s starting (since %s)", name, since.date())
                try:
                    raw = await FETCHERS[name].fetch(client, since)
                    run.fetched = len(raw)
                    run.added, run.updated = await asyncio.to_thread(upsert_items, raw)
                except Exception as exc:  # noqa: BLE001 - one bad source must not stop the others
                    log.exception("ingest: %s failed", name)
                    run.error = f"{type(exc).__name__}: {exc}"[:500]
                run.finished_at = _utcnow()
                with Session(engine) as session:
                    session.add(run)
                    session.commit()
                    session.refresh(run)
                results[name] = {
                    "fetched": run.fetched,
                    "added": run.added,
                    "updated": run.updated,
                    "error": run.error,
                }
                log.info("ingest: %s done: %s", name, results[name])
        return {"status": "completed", "results": results}


def start_background_ingest(sources: list[str] | None = None) -> None:
    task = asyncio.create_task(run_ingest(sources))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)
