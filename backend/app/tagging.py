"""Keyword taxonomy that maps free text to a small, stable set of tags.

The tags are what the UI filters on, so keep the list short and the names
kebab-case. Patterns are case-insensitive regular expressions.
"""
from __future__ import annotations

import re
from collections.abc import Iterable

TAXONOMY: dict[str, list[str]] = {
    "robotics": [r"\brobot(s|ic|ics)?\b", r"\bros ?2?\b", r"\bmanipulator", r"\brobotic arm", r"\bend[- ]effector"],
    "computer-vision": [r"computer vision", r"\bcv\b", r"\bimage(s)?\b", r"\bvisual\b", r"\bvideo(s)?\b", r"\bcamera"],
    "embodied-ai": [r"embodied", r"\bvla(s)?\b", r"vision[- ]language[- ]action", r"\brobot (foundation|policy|learning)"],
    "vision-language": [r"vision[- ]language", r"\bvlm(s)?\b", r"multi[- ]?modal", r"\bclip\b", r"\bllava", r"\bqwen[- ]?vl"],
    "manipulation": [r"manipulat", r"\bgrasp", r"pick[- ]and[- ]place", r"dexterous", r"\bin-hand", r"\bbimanual"],
    "navigation": [r"\bnavigat", r"path planning", r"motion planning", r"\bexploration\b", r"\bwaypoint"],
    "locomotion": [r"locomotion", r"\bquadruped", r"\bbiped", r"\blegged", r"\bgait\b", r"\bwhole[- ]body control"],
    "humanoid": [r"humanoid"],
    "slam": [r"\bslam\b", r"visual[- ]inertial", r"\bodometry", r"\blocali[sz]ation", r"\bloop closure"],
    "3d": [r"\b3d\b", r"point ?cloud", r"\bmesh(es)?\b", r"\bnerf", r"gaussian splat", r"\bdepth\b", r"reconstruction", r"\bvoxel"],
    "segmentation": [r"segment"],
    "detection": [r"\bdetect", r"\byolo"],
    "pose-tracking": [r"\bpose\b", r"\btracking\b", r"\btracker", r"\bkeypoint"],
    "imitation-learning": [r"imitation", r"behavio(u)?r cloning", r"demonstration", r"\bteleop", r"\blerobot", r"\baloha\b"],
    "reinforcement-learning": [r"reinforcement", r"\brl\b", r"\bppo\b", r"\bsac\b", r"policy gradient", r"\breward"],
    "diffusion-policy": [r"diffusion polic", r"flow[- ]matching", r"action chunking", r"\bdiffusion transformer"],
    "world-model": [r"world model", r"\bdreamer", r"video prediction"],
    "foundation-model": [r"foundation model", r"\bpre-?train", r"\bgeneralist", r"zero[- ]shot", r"open[- ]vocab", r"\bgeneral[- ]purpose"],
    "simulation": [r"\bsimulat", r"\bisaac", r"\bmujoco", r"\bgazebo", r"\bpybullet", r"\bgenesis\b", r"\bsapien", r"\bhabitat", r"sim[- ]?(2|to)[- ]?real", r"\bdigital twin"],
    "dataset": [r"\bdataset", r"\bbenchmark", r"\bcorpus\b"],
    "hardware": [r"\bhardware", r"\bfirmware", r"\bactuator", r"\bsensor", r"\blidar", r"open[- ]source robot", r"\bso-?10[01]\b", r"\b3d[- ]print"],
    "drones": [r"\bdrone", r"\buav", r"\bquadrotor", r"\bquadcopter", r"\baerial"],
    "autonomous-driving": [r"autonomous driving", r"self[- ]driving", r"autonomous vehicle", r"\badas\b", r"\bnuscenes"],
    "tooling": [r"\btoolkit", r"\blibrary", r"\bframework", r"\bsdk\b", r"\bpipeline", r"\bplugin"],
    "llm-agents": [r"\bllm(s)?\b", r"large language model", r"\bagentic", r"\btool[- ]use", r"\bgpt-?\d"],
    "awesome-list": [r"\bawesome[- ]", r"curated list", r"\breading list", r"\bpaper list"],
}

_COMPILED: dict[str, list[re.Pattern[str]]] = {
    tag: [re.compile(p, re.IGNORECASE) for p in patterns] for tag, patterns in TAXONOMY.items()
}

ALL_TAGS: list[str] = list(TAXONOMY)


def normalize_tag(raw: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", raw.strip().lower()).strip("-")


def infer_tags(text: str, seed_tags: Iterable[str] = ()) -> list[str]:
    """Return seed tags (normalized) followed by every taxonomy tag that matches ``text``."""
    found: list[str] = []
    for raw in seed_tags:
        tag = normalize_tag(raw)
        if tag and tag not in found:
            found.append(tag)
    for tag, patterns in _COMPILED.items():
        if tag in found:
            continue
        if any(p.search(text) for p in patterns):
            found.append(tag)
    return found
