from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Administrador(Base):
    __tablename__ = "administradores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    activo: Mapped[bool] = mapped_column(default=True)


class SesionAdministrador(Base):
    __tablename__ = "sesiones_administradores"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    administrador_id: Mapped[int] = mapped_column(ForeignKey("administradores.id"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
