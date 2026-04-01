# app/config.py
import logging
logger = logging.getLogger(__name__)
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DB_SERVER: str = ""
    DB_NAME: str = ""
    DB_USER: Optional[str] = ""
    DB_PASSWORD: Optional[str] = ""
    SECRET_KEY: str = "your-secret-key-for-local-dev-only"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # Refresh tokens last 7 days; access tokens last ACCESS_TOKEN_EXPIRE_MINUTES
    RESET_TOKEN_EXPIRE_MINUTES: int = 30
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = ""
    EMAILS_FROM_NAME: str = "Gym Management System"
    FRONTEND_URL: str = "http://localhost:3000"
    # Allowed CORS origins (comma-separated in env: "https://myapp.com,http://localhost:5173")
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Cloudinary — set via environment variables ONLY, no hardcoded defaults
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    @property
    def allowed_origins_list(self) -> list:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def corrected_db_name(self) -> str:
        if "database.windows.net" in self.DB_SERVER and "_" in self.DB_NAME:
            return self.DB_NAME.replace("_", "-")
        return self.DB_NAME

    @property
    def is_azure_sql(self) -> bool:
        return "database.windows.net" in self.DB_SERVER

    class Config:
        env_file = ".env"


settings = Settings()
