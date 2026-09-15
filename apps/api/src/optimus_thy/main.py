from fastapi import FastAPI

from optimus_thy.config.settings import get_settings
from optimus_thy.shared.health.router import router as health_router
from optimus_thy.shared.http.request_id import request_id_middleware


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
    )
    application.middleware("http")(request_id_middleware)
    application.include_router(health_router)
    return application


app = create_app()
