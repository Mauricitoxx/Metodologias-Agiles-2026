from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.juego import Juego


class Regla(Base):
    __tablename__ = "reglas"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    contenido: Mapped[str] = mapped_column(Text, nullable=False)
    orden: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    juego_id: Mapped[int] = mapped_column(
        ForeignKey("juegos.id", ondelete="CASCADE"),
        nullable=False,
    )
    juego: Mapped["Juego"] = relationship(back_populates="reglas")
