from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    google_api_key: str
    model_name: str = "gemini-3.6-flash"
    database_url: str = "sqlite:///./data/ledgr.db"
    upload_dir: str = "./data/uploads"
    secret_key: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    encryption_key: str = "ATxuj7Pl20OC3BIo_86KbUP3w5WpXFhWbK9Ie_FC1pI="

    class Config:
        env_file = ".env"
        protected_namespaces = ()


settings = Settings()