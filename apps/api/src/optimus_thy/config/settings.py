from functools import lru_cache
from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

REPOSITORY_ROOT = Path(__file__).resolve().parents[5]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=REPOSITORY_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "OPTIMUS-THY API"
    environment: str = "development"
    database_url: str | None = None
    pii_encryption_key_b64: SecretStr | None = None
    s3_endpoint: str | None = None
    s3_bucket: str | None = None
    s3_access_key: str | None = None
    s3_secret_key: SecretStr | None = None
    auth_cookie_name: str = "optimus_thy_session"
    auth_session_ttl_seconds: int = 8 * 60 * 60

    @property
    def auth_cookie_secure(self) -> bool:
        return self.environment != "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
