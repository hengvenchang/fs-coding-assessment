from functools import lru_cache
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30

    # Security / JWT
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Frontend / CORS
    FRONTEND_URL: str

    # Application settings
    APP_NAME: str = "Todo API"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Load .env file
    model_config = SettingsConfigDict(env_file=".env")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance.
    
    Returns:
        Settings instance
    """
    return Settings()
