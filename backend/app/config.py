from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_api_key: str
    database_url: str = "sqlite:///./data/ledgr.db"
    upload_dir: str = "./data/uploads"

    class Config:
        env_file = ".env"


settings = Settings()