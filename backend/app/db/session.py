from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

if settings.database_url.startswith("sqlite"):
    # SQLite no permite por defecto usar una conexión desde otro hilo, y FastAPI atiende requests en varios.
    engine_options = {"connect_args": {"check_same_thread": False}}
else:
    # Sin pool_pre_ping: verificaba la conexión con una consulta extra en cada request, que contra una
    # base remota cuesta un viaje de ida y vuelta completo. En su lugar, los keepalives de TCP evitan
    # que el proxy corte las conexiones inactivas del pool, y pool_recycle las renueva antes de que
    # el servidor las cierre.
    engine_options = {
        "connect_args": {
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 3,
        },
        "pool_recycle": 300,
    }

engine = create_engine(settings.database_url, **engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: abre una sesión por request y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
