from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, col, select

from ..db import get_session
from ..ingest import FETCHERS, is_running, start_background_ingest
from ..models import IngestRun
from ..schemas import IngestRunOut

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


@router.post("", status_code=202)
async def trigger_ingest(
    source: str | None = Query(None, description="Comma-separated subset of sources; default all"),
) -> dict:
    sources = [s.strip() for s in (source or "").split(",") if s.strip()] or None
    unknown = [s for s in sources or [] if s not in FETCHERS]
    if unknown:
        raise HTTPException(status_code=400, detail=f"unknown sources: {', '.join(unknown)}")
    if is_running():
        return {"status": "already_running"}
    start_background_ingest(sources)
    return {"status": "started", "sources": sources or list(FETCHERS)}


@router.get("/status")
def ingest_status() -> dict:
    return {"running": is_running(), "sources": list(FETCHERS)}


@router.get("/runs", response_model=list[IngestRunOut])
def list_runs(session: Session = Depends(get_session), limit: int = Query(20, ge=1, le=200)) -> list[IngestRunOut]:
    runs = session.exec(select(IngestRun).order_by(col(IngestRun.id).desc()).limit(limit)).all()
    return [IngestRunOut.from_run(r) for r in runs]
