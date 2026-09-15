from fastapi import FastAPI

from optimus_thy.config.settings import get_settings
from optimus_thy.shared.health.router import router as health_router


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
    )
    application.include_router(health_router)
    return application


app = create_app()
