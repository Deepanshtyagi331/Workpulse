from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "WorkPulse"
    PROJECT_TAGLINE: str = "Internal Task & Management Dashboard"
    VERSION: str = "0.1.0"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "sqlite:///./workpulse.db"

    ALLOWED_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173"

    EXTERNAL_API_BASE_URL: str = "https://jsonplaceholder.typicode.com"
    EXTERNAL_API_TIMEOUT_SECONDS: int = 10

    # JWT Authentication
    JWT_SECRET_KEY: str = "workpulse-dev-secret-key-change-in-production-use-256-bit-random"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours default for local dev

    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
