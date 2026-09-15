from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from optimus_thy.config.settings import get_settings
from optimus_thy.modules.auth.api.router import router as auth_router
from optimus_thy.shared.database.session import dispose_database_connections
from optimus_thy.shared.health.router import router as health_router
from optimus_thy.shared.http.request_id import request_id_middleware


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    yield
    await dispose_database_connections()


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
    )
    application.middleware("http")(request_id_middleware)
    application.include_router(health_router)
    application.include_router(auth_router)
    return application


app = create_app()
