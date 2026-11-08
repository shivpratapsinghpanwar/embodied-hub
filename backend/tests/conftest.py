"""Test fixtures. Environment is configured before the app is imported."""
from __future__ import annotations

import os
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

_TMP = Path(tempfile.mkdtemp(prefix="hub-test-"))
os.environ["HUB_DATABASE_URL"] = f"sqlite:///{(_TMP / 'test.db').as_posix()}"
os.environ["HUB_REFRESH_ON_STARTUP"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session  # noqa: E402

from app.db import engine, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Item, Source  # noqa: E402


def _seed() -> None:
    now = datetime.now(timezone.utc)
    rows = [
        Item(
            source=Source.github,
            external_id="acme/openvla-mini",
            kind="repo",
            title="acme/openvla-mini",
            summary="A compact vision-language-action model for robot manipulation",
            url="https://github.com/acme/openvla-mini",
            authors="acme",
            tags="embodied-ai,robotics,manipulation,vision-language",
            stars=1200,
            language="Python",
            published_at=now - timedelta(days=3),
            updated_at=now - timedelta(days=1),
            fetched_at=now,
            score=9.5,
        ),
        Item(
            source=Source.huggingface,
            external_id="model:acme/depth-anything-tiny",
            kind="model",
            title="acme/depth-anything-tiny",
            summary="depth-estimation · transformers",
            url="https://huggingface.co/acme/depth-anything-tiny",
            authors="acme",
            tags="computer-vision,3d",
            stars=80,
            downloads=5000,
            published_at=now - timedelta(days=10),
            updated_at=now - timedelta(days=2),
            fetched_at=now,
            score=4.2,
        ),
        Item(
            source=Source.arxiv,
            external_id="2510.00001",
            kind="paper",
            title="Learning Quadruped Locomotion From Video",
            summary="We train legged robots using reinforcement learning in simulation.",
            url="https://arxiv.org/abs/2510.00001",
            authors="A. Author, B. Author",
            tags="robotics,locomotion,reinforcement-learning,simulation",
            published_at=now - timedelta(days=60),
            updated_at=now - timedelta(days=60),
            fetched_at=now,
            score=0.8,
        ),
    ]
    with Session(engine) as session:
        session.add_all(rows)
        session.commit()


@pytest.fixture(scope="session")
def client():
    init_db()
    _seed()
    with TestClient(app) as c:
        yield c
