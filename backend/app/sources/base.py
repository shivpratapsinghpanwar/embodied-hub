from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Protocol

import httpx
from dateutil import parser as dateparser

from ..models import Source


@dataclass
class RawItem:
    """Source-agnostic record produced by a fetcher, before tagging and scoring."""

    source: Source
    external_id: str
    kind: str
    title: str
    url: str
    published_at: datetime
    updated_at: datetime
    summary: str = ""
    authors: str = ""
    tags: list[str] = field(default_factory=list)  # seed tags from the query that found it
    keywords: list[str] = field(default_factory=list)  # source labels (topics, categories); feed inference only
    stars: int = 0
    downloads: int = 0
    language: str = ""


class Fetcher(Protocol):
    name: str

    async def fetch(self, client: httpx.AsyncClient, since: datetime) -> list[RawItem]: ...


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def parse_dt(value: str | datetime | None, default: datetime | None = None) -> datetime:
    """Parse an ISO-8601 string into an aware UTC datetime."""
    if value is None:
        return default or utcnow()
    dt = value if isinstance(value, datetime) else dateparser.isoparse(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def squash(text: str | None) -> str:
    return " ".join((text or "").split())
