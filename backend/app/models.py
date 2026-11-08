from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class Source(str, Enum):
    github = "github"
    huggingface = "huggingface"
    arxiv = "arxiv"


class Item(SQLModel, table=True):
    """One discovered thing: a repo, a model, a dataset, a space or a paper.

    Datetimes must be timezone-aware; SQLModel stores them as UTC and returns
    them as aware UTC values.
    """

    __table_args__ = (UniqueConstraint("source", "external_id", name="uq_source_external"),)

    id: int | None = Field(default=None, primary_key=True)
    source: Source = Field(index=True)
    external_id: str = Field(index=True)
    kind: str = Field(index=True)  # repo | model | dataset | space | paper
    title: str
    summary: str = ""
    url: str
    authors: str = ""  # owner login, org, or comma-joined author names
    tags: str = Field(default="", index=True)  # comma-joined, lowercase, kebab-case
    stars: int = 0  # GitHub stars or Hugging Face likes
    downloads: int = 0  # Hugging Face downloads (0 elsewhere)
    language: str = ""
    published_at: datetime = Field(index=True)
    updated_at: datetime
    fetched_at: datetime
    score: float = Field(default=0.0, index=True)

    @property
    def tag_list(self) -> list[str]:
        return [t for t in self.tags.split(",") if t]


class IngestRun(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    source: str = Field(index=True)
    started_at: datetime
    finished_at: datetime | None = None
    fetched: int = 0
    added: int = 0
    updated: int = 0
    error: str | None = None
