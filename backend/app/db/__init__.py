from app.db.session import engine
from app.models import transaction  

def init_db() -> None:
    from app.models.transaction import Base
    Base.metadata.create_all(bind=engine)
