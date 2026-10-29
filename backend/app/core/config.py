from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "La Frikioteca API"
    environment: str = "development"
    database_url: str = "sqlite:///./frikioteca.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    auth_session_minutes: int = Field(default=480, ge=1, le=10080)

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
