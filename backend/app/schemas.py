from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel

from .models import IngestRun, Item


def _utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


class ItemOut(BaseModel):
    id: int
    source: str
    external_id: str
    kind: str
    title: str
    summary: str
    url: str
    authors: str
    tags: list[str]
    stars: int
    downloads: int
    language: str
    published_at: datetime
    updated_at: datetime
    score: float

    @classmethod
    def from_item(cls, item: Item) -> ItemOut:
        return cls(
            id=item.id or 0,
            source=item.source.value if hasattr(item.source, "value") else str(item.source),
            external_id=item.external_id,
            kind=item.kind,
            title=item.title,
            summary=item.summary,
            url=item.url,
            authors=item.authors,
            tags=item.tag_list,
            stars=item.stars,
            downloads=item.downloads,
            language=item.language,
            published_at=_utc(item.published_at),  # type: ignore[arg-type]
            updated_at=_utc(item.updated_at),  # type: ignore[arg-type]
            score=item.score,
        )


class ItemPage(BaseModel):
    items: list[ItemOut]
    total: int
    page: int
    page_size: int


class TagCount(BaseModel):
    tag: str
    count: int


class IngestRunOut(BaseModel):
    id: int
    source: str
    started_at: datetime
    finished_at: datetime | None
    fetched: int
    added: int
    updated: int
    error: str | None

    @classmethod
    def from_run(cls, run: IngestRun) -> IngestRunOut:
        return cls(
            id=run.id or 0,
            source=run.source,
            started_at=_utc(run.started_at),  # type: ignore[arg-type]
            finished_at=_utc(run.finished_at),
            fetched=run.fetched,
            added=run.added,
            updated=run.updated,
            error=run.error,
        )


class Stats(BaseModel):
    total: int
    by_source: dict[str, int]
    by_kind: dict[str, int]
    last_ingest: datetime | None
    is_running: bool
