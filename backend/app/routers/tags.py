from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, col, select

from ..db import get_session
from ..models import Item
from ..schemas import TagCount

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=list[TagCount])
def list_tags(
    session: Session = Depends(get_session),
    days: int | None = Query(None, ge=1, le=3650),
    source: str | None = Query(None, description="Comma-separated sources"),
    limit: int = Query(60, ge=1, le=500),
) -> list[TagCount]:
    stmt = select(Item.tags)
    if days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = stmt.where(col(Item.published_at) >= cutoff)
    sources = [s.strip() for s in (source or "").split(",") if s.strip()]
    if sources:
        stmt = stmt.where(col(Item.source).in_(sources))
    counter: Counter[str] = Counter()
    for tags in session.exec(stmt).all():
        counter.update(t for t in tags.split(",") if t)
    return [TagCount(tag=t, count=c) for t, c in counter.most_common(limit)]
