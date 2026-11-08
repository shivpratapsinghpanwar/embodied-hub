from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlmodel import Session, col, select

from ..db import get_session
from ..ingest import is_running
from ..models import IngestRun, Item
from ..schemas import Stats

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=Stats)
def get_stats(session: Session = Depends(get_session)) -> Stats:
    total = session.exec(select(func.count()).select_from(Item)).one()
    by_source = {
        (s.value if hasattr(s, "value") else str(s)): n
        for s, n in session.exec(select(Item.source, func.count()).group_by(Item.source)).all()
    }
    by_kind = dict(session.exec(select(Item.kind, func.count()).group_by(Item.kind)).all())
    last = session.exec(
        select(IngestRun.finished_at)
        .where(col(IngestRun.finished_at).is_not(None))
        .order_by(col(IngestRun.finished_at).desc())
        .limit(1)
    ).first()
    return Stats(
        total=total,
        by_source=by_source,
        by_kind=by_kind,
        last_ingest=last,
        is_running=is_running(),
    )
