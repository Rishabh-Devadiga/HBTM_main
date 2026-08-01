"""Top-level API router that composes all endpoint modules."""

from __future__ import annotations

from importlib import import_module

from fastapi import APIRouter

from backend.api.routes import (
    chat,
    health,
    root,
)
from backend.framework.domains.loader import load_active_domain


api_router = APIRouter()
api_router.include_router(root.router)
api_router.include_router(health.router)
api_router.include_router(chat.router)

active_domain = load_active_domain()
for router_module_name in active_domain.api_router_modules:
    router_module = import_module(router_module_name)
    api_router.include_router(router_module.router)
