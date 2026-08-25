from sqlalchemy import Column, String, DateTime
from sqlalchemy import Column, String, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.base import Base
from cryptography.fernet import Fernet
from app.config import settings

fernet = Fernet(settings.encryption_key.encode())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    api_key = Column(String, nullable=True) # Gemini API Key
    push_token = Column(String, nullable=True) # Expo Push Token
    budget_amount = Column(Float, nullable=True)
    budget_period = Column(String, nullable=True, default="monthly") # 'weekly' or 'monthly'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")

    def get_decrypted_api_key(self) -> str | None:
        if not self.api_key:
            return None
        try:
            return fernet.decrypt(self.api_key.encode()).decode()
        except Exception:
            # Fallback for old unencrypted keys during transition
            return self.api_key

    def set_encrypted_api_key(self, raw_key: str | None):
        if not raw_key:
            self.api_key = None
        else:
            self.api_key = fernet.encrypt(raw_key.encode()).decode()
