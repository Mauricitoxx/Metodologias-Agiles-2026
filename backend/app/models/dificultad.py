from typing import TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.juego import Juego


class Dificultad(Base):
    __tablename__ = "dificultades"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    juegos: Mapped[list["Juego"]] = relationship(back_populates="dificultad")
