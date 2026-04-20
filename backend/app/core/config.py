from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "Digital Footprint Analyzer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "digital_footprint")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production-abc123xyz789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    ML_MODEL_NAME: str = "blanchefort/rubert-base-cased-sentiment"
    
    ROLE_CODES: dict = {
        "admin": "NEURO2024",
        "psychologist": "PSYCH2024",
        "curator": "CURAT2024",
    }
    
    STRESS_WEIGHTS: dict = {
        "activity_change": 1.8,
        "sentiment": 2.8,
        "social_interactions": 2.2,
        "time_patterns": 1.5,
        "geolocation": 1.2,
        "academic_mentions": 2.0,
        "social_feedback": 1.4,
    }
    SIGMOID_BIAS: float = -4.0
    
    class Config:
        case_sensitive = True


settings = Settings()
