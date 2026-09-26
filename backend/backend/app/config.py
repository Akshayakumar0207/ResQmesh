from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration, loaded from environment variables / .env.

    DATABASE_URL:
      - Unset -> local SQLite file (zero config, works immediately).
      - Set to a Supabase Postgres connection string -> the app talks to
        Supabase instead, with no code changes required.
        e.g. postgresql+psycopg2://postgres:<password>@<host>:5432/postgres
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ResQMesh API"
    environment: str = "development"
    database_url: str = "sqlite:///./resqmesh.db"
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"
    demo_mode: bool = True

    # ── Auth ──────────────────────────────────────────────────────────
    jwt_secret_key: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    refresh_token_remember_days: int = 30
    reset_token_expire_minutes: int = 30

    # Google Sign-In: create a free OAuth 2.0 Client ID at
    # https://console.cloud.google.com/apis/credentials (no billing required
    # for basic Sign-In). Leave blank to disable the Google login option.
    google_client_id: str = ""

    # Optional SMTP for password-reset emails (e.g. a free Gmail app
    # password). If left blank, the reset link is returned directly in the
    # API response when demo_mode is true, so the flow is still testable
    # without any email provider configured.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@resqmesh.local"

    frontend_url: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()
