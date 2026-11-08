from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlmodel import Session, col, select

from ..db import get_session
from ..models import Item
from ..schemas import ItemOut, ItemPage

router = APIRouter(prefix="/api/items", tags=["items"])

SORTS = {
    "score": (col(Item.score).desc(),),
    "newest": (col(Item.published_at).desc(),),
    "stars": (col(Item.stars).desc(), col(Item.score).desc()),
    "updated": (col(Item.updated_at).desc(),),
}


def _csv(value: str | None) -> list[str]:
    return [v.strip() for v in (value or "").split(",") if v.strip()]


def _tag_clause(tag: str):
    t = col(Item.tags)
    return or_(t == tag, t.like(f"{tag},%"), t.like(f"%,{tag}"), t.like(f"%,{tag},%"))


@router.get("", response_model=ItemPage)
def list_items(
    session: Session = Depends(get_session),
    q: str | None = Query(None, description="Free-text search over title, summary, authors and tags"),
    source: str | None = Query(None, description="Comma-separated: github,huggingface,arxiv"),
    kind: str | None = Query(None, description="Comma-separated: repo,model,dataset,space,paper"),
    tag: str | None = Query(None, description="Comma-separated tags; an item must carry all of them"),
    days: int | None = Query(None, ge=1, le=3650, description="Only items published in the last N days"),
    sort: str = Query("score", pattern="^(score|newest|stars|updated)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
) -> ItemPage:
    stmt = select(Item)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                col(Item.title).ilike(like),
                col(Item.summary).ilike(like),
                col(Item.authors).ilike(like),
                col(Item.tags).ilike(like),
            )
        )
    if sources := _csv(source):
        stmt = stmt.where(col(Item.source).in_(sources))
    if kinds := _csv(kind):
        stmt = stmt.where(col(Item.kind).in_(kinds))
    for t in _csv(tag):
        stmt = stmt.where(_tag_clause(t))
    if days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = stmt.where(col(Item.published_at) >= cutoff)

    total = session.exec(select(func.count()).select_from(stmt.subquery())).one()
    stmt = stmt.order_by(*SORTS[sort], col(Item.id).desc()).offset((page - 1) * page_size).limit(page_size)
    rows = session.exec(stmt).all()
    return ItemPage(items=[ItemOut.from_item(r) for r in rows], total=total, page=page, page_size=page_size)


@router.get("/{item_id}", response_model=ItemOut)
def get_item(item_id: int, session: Session = Depends(get_session)) -> ItemOut:
    item = session.get(Item, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="item not found")
    return ItemOut.from_item(item)
