"""Helpers for loading externalized learning-domain prompt files."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path


PROMPTS_DIR = Path(__file__).resolve().parent


@lru_cache
def load_prompt_file(file_name: str) -> str:
    """Return the raw contents of one prompt file."""

    return (PROMPTS_DIR / file_name).read_text(encoding="utf-8")


@lru_cache
def load_prompt_block(file_name: str, block_name: str) -> str:
    """Return one tagged block from a prompt file."""

    text = load_prompt_file(file_name)
    start_marker = f"[{block_name}]"
    end_marker = f"[/{block_name}]"
    start = text.find(start_marker)
    if start == -1:
        raise ValueError(f"Prompt block {block_name!r} not found in {file_name}.")
    start += len(start_marker)
    if start < len(text) and text[start] == "\n":
        start += 1

    end = text.find(end_marker, start)
    if end == -1:
        raise ValueError(f"Prompt block {block_name!r} is not closed in {file_name}.")

    return text[start:end]
