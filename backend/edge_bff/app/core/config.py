import os
from functools import lru_cache
from pydantic import BaseModel
from dotenv import load_dotenv


load_dotenv()


class Settings(BaseModel):
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    PORT: int = int(os.getenv("PORT", "8000"))
    COMMERCE_BASE_URL: str = os.getenv("COMMERCE_BASE_URL", "http://localhost:8001")
    OPS_BASE_URL: str = os.getenv("OPS_BASE_URL", "http://localhost:8002")
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "10"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
