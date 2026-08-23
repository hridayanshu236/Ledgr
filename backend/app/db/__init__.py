from app.db.session import engine
from app.models import transaction, user

def init_db() -> None:
    from app.db.base import Base
    Base.metadata.create_all(bind=engine)
