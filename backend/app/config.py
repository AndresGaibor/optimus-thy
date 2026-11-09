"""Configuración de la aplicación cargada desde variables de entorno."""

from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_PII_ENCRYPTION_KEY = "cambiar-en-local-no-usar-fuera-de-desarrollo"
"""Clave de ejemplo: solo se acepta en desarrollo y pruebas."""

ENTORNOS_DE_DESARROLLO = frozenset({"local", "development", "test"})


class Settings(BaseSettings):
    """Configuración inmutable leída del entorno."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    database_url: str = Field(
        default="postgresql+psycopg://optimus:optimus@postgres:5432/optimus",
        alias="DATABASE_URL",
    )
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    environment: str = Field(default="local", alias="ENVIRONMENT")
    session_ttl_minutes: int = Field(default=480, alias="SESSION_TTL_MINUTES")
    session_inactividad_minutos: int = Field(
        default=30,
        alias="SESSION_INACTIVIDAD_MINUTOS",
        description="Minutos sin actividad tras los que la sesión caduca (HU-005).",
        ge=1,
        le=1440,
    )
    login_max_intentos: int = Field(
        default=5,
        alias="LOGIN_MAX_INTENTOS",
        description="Intentos fallidos seguidos que bloquean la cuenta (HU-004).",
        ge=1,
        le=50,
    )
    login_bloqueo_minutos: int = Field(
        default=15,
        alias="LOGIN_BLOQUEO_MINUTOS",
        description="Duración del bloqueo por intentos fallidos (HU-004).",
        ge=1,
        le=1440,
    )
    allowed_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173,http://testserver",
        alias="ALLOWED_ORIGINS",
        description="Orígenes permitidos para requests que cambian estado.",
    )
    session_cookie_name: str = Field(default="optimus_session", alias="SESSION_COOKIE_NAME")
    session_cookie_secure: bool = Field(default=False, alias="SESSION_COOKIE_SECURE")
    s3_endpoint: str = Field(default="http://storage:9000", alias="S3_ENDPOINT")
    s3_access_key: str = Field(default="cambiar-en-local", alias="S3_ACCESS_KEY")
    s3_secret_key: str = Field(default="cambiar-en-local", alias="S3_SECRET_KEY")
    s3_bucket: str = Field(default="optimus", alias="S3_BUCKET")
    s3_region: str = Field(default="us-east-1", alias="S3_REGION")
    s3_presigned_seconds: int = Field(
        default=3600,
        alias="S3_PRESIGNED_SECONDS",
        description="Vigencia de los enlaces firmados, en segundos (60 a 86400).",
        ge=60,
        le=86400,
    )
    pii_encryption_key: str = Field(
        default=DEV_PII_ENCRYPTION_KEY,
        alias="PII_ENCRYPTION_KEY",
        description="Clave de cifrado de datos personales; nunca se guarda en el repositorio.",
    )

    def model_post_init(self, __context: object) -> None:
        if "session_cookie_secure" not in self.model_fields_set:
            object.__setattr__(self, "session_cookie_secure", self.environment != "local")

    @model_validator(mode="after")
    def _exigir_clave_propia(self) -> "Settings":
        """Fuera de desarrollo la clave de ejemplo no es aceptable."""
        if (
            self.environment.lower() not in ENTORNOS_DE_DESARROLLO
            and self.pii_encryption_key == DEV_PII_ENCRYPTION_KEY
        ):
            raise ValueError(
                "PII_ENCRYPTION_KEY debe configurarse fuera del repositorio en este entorno"
            )
        return self

    @property
    def allowed_origins_set(self) -> frozenset[str]:
        """Devuelve un conjunto inmutable de orígenes permitidos normalizados."""
        return frozenset(
            origin.strip().rstrip("/")
            for origin in self.allowed_origins.split(",")
            if origin.strip()
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Devuelve la instancia singleton de configuración."""
    return Settings()
