"""Embodied Hub API entry point.

Run locally with:  uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import init_db
from .ingest import run_ingest
from .routers import ingest, items, stats, tags

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)


async def _refresh_loop() -> None:
    while True:
        try:
            await run_ingest()
        except Exception:  # noqa: BLE001
            log.exception("scheduled ingest failed")
        if settings.refresh_hours <= 0:
            return
        await asyncio.sleep(settings.refresh_hours * 3600)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    task: asyncio.Task | None = None
    if settings.refresh_on_startup:
        task = asyncio.create_task(_refresh_loop())
    yield
    if task:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


app = FastAPI(
    title="Embodied Hub API",
    version="0.1.0",
    description="Newly launched repos, models, datasets and papers in robotics, computer vision and embodied AI.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(items.router)
app.include_router(tags.router)
app.include_router(stats.router)
app.include_router(ingest.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
