from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_api_key: str
    model_name: str = "gemini-3.6-flash"
    database_url: str = "sqlite:///./data/ledgr.db"
    upload_dir: str = "./data/uploads"

    class Config:
        env_file = ".env"
        protected_namespaces = ()


settings = Settings()