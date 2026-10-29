from typing import TYPE_CHECKING
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.juego import Juego


class CategoriaJuego(Base):
    __tablename__ = "categorias_juego"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)

    juegos: Mapped[list["Juego"]] = relationship(
        secondary="juegos_categorias",
        back_populates="categorias",
    )
