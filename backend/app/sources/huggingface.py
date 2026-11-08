"""Hugging Face Hub models, datasets and spaces.

Each query is run twice: once sorted by creation date (what is new) and once by
trending score (what people are picking up right now). Items are kept when they
were created inside the lookback window, or were updated inside it and already
have a meaningful number of likes.
"""
from __future__ import annotations

import logging
from datetime import datetime

import httpx

from ..config import settings
from ..models import Source
from .base import RawItem, parse_dt

log = logging.getLogger(__name__)

API = "https://huggingface.co/api"
TRENDING_MIN_LIKES = 20

# (endpoint kind, extra query params, seed tags)
QUERIES: list[tuple[str, dict[str, str], list[str]]] = [
    ("models", {"filter": "robotics"}, ["robotics"]),
    ("models", {"filter": "depth-estimation"}, ["computer-vision", "3d"]),
    ("models", {"filter": "image-segmentation"}, ["computer-vision", "segmentation"]),
    ("models", {"filter": "mask-generation"}, ["computer-vision", "segmentation"]),
    ("models", {"filter": "object-detection"}, ["computer-vision", "detection"]),
    ("models", {"filter": "zero-shot-object-detection"}, ["computer-vision", "detection", "foundation-model"]),
    ("models", {"filter": "keypoint-detection"}, ["computer-vision", "pose-tracking"]),
    ("models", {"filter": "image-to-3d"}, ["computer-vision", "3d"]),
    ("models", {"filter": "video-classification"}, ["computer-vision"]),
    ("models", {"search": "vla"}, ["embodied-ai"]),
    ("models", {"search": "embodied"}, ["embodied-ai"]),
    ("models", {"search": "lerobot"}, ["robotics", "imitation-learning"]),
    ("models", {"search": "world-model"}, ["world-model"]),
    ("datasets", {"filter": "task_categories:robotics"}, ["robotics", "dataset"]),
    ("datasets", {"search": "lerobot"}, ["robotics", "imitation-learning", "dataset"]),
    ("datasets", {"search": "manipulation"}, ["manipulation", "dataset"]),
    ("datasets", {"search": "embodied"}, ["embodied-ai", "dataset"]),
    ("datasets", {"filter": "task_categories:depth-estimation"}, ["computer-vision", "3d", "dataset"]),
    ("spaces", {"search": "robot"}, ["robotics"]),
    ("spaces", {"search": "depth"}, ["computer-vision", "3d"]),
    ("spaces", {"search": "segment"}, ["computer-vision", "segmentation"]),
    ("spaces", {"search": "3d"}, ["computer-vision", "3d"]),
]

KIND_BY_ENDPOINT = {"models": "model", "datasets": "dataset", "spaces": "space"}
URL_PREFIX = {"models": "", "datasets": "datasets/", "spaces": "spaces/"}
NOISY_TAG_PREFIXES = ("license:", "region:", "arxiv:", "doi:", "dataset:", "base_model:", "size_categories:")


class HuggingFaceFetcher:
    name = "huggingface"

    async def fetch(self, client: httpx.AsyncClient, since: datetime) -> list[RawItem]:
        headers = {}
        if settings.hf_token:
            headers["Authorization"] = f"Bearer {settings.hf_token}"

        items: dict[str, RawItem] = {}
        for endpoint, extra, seed in QUERIES:
            for sort in ("createdAt", "trendingScore"):
                params = {**extra, "sort": sort, "direction": "-1", "limit": str(settings.hf_per_query)}
                try:
                    resp = await client.get(f"{API}/{endpoint}", headers=headers, params=params)
                    resp.raise_for_status()
                except httpx.HTTPError as exc:
                    log.warning("huggingface: %s %s failed: %s", endpoint, extra, exc)
                    continue
                for entry in resp.json():
                    raw = self._to_item(endpoint, entry, seed)
                    if raw is None or not self._keep(raw, since):
                        continue
                    key = f"{raw.kind}:{raw.external_id}"
                    existing = items.get(key)
                    if existing:
                        for t in raw.tags:
                            if t not in existing.tags:
                                existing.tags.append(t)
                    else:
                        items[key] = raw
        log.info("huggingface: %d unique items", len(items))
        return list(items.values())

    @staticmethod
    def _keep(raw: RawItem, since: datetime) -> bool:
        if raw.published_at >= since:
            return True
        return raw.stars >= TRENDING_MIN_LIKES and raw.updated_at >= since

    @staticmethod
    def _to_item(endpoint: str, entry: dict, seed: list[str]) -> RawItem | None:
        hub_id = entry.get("id") or entry.get("modelId")
        if not hub_id:
            return None
        tags = [t for t in entry.get("tags") or [] if not t.startswith(NOISY_TAG_PREFIXES)]
        pipeline = entry.get("pipeline_tag") or ""
        library = entry.get("library_name") or entry.get("sdk") or ""
        summary_bits = [b for b in (pipeline, library, *tags[:12]) if b]
        updated = parse_dt(entry.get("lastModified"))
        created = parse_dt(entry.get("createdAt"), default=updated)
        kind = KIND_BY_ENDPOINT[endpoint]
        return RawItem(
            source=Source.huggingface,
            external_id=f"{kind}:{hub_id}",
            kind=kind,
            title=hub_id,
            summary=" · ".join(summary_bits),
            url=f"https://huggingface.co/{URL_PREFIX[endpoint]}{hub_id}",
            authors=hub_id.split("/")[0] if "/" in hub_id else "",
            tags=list(seed),
            keywords=[*([pipeline] if pipeline else []), *tags],
            stars=int(entry.get("likes") or 0),
            downloads=int(entry.get("downloads") or 0),
            language=library,
            published_at=created,
            updated_at=updated,
        )
