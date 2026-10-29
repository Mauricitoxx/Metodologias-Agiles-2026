from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.categoria_juego import CategoriaJuego
    from app.models.dificultad import Dificultad
    from app.models.regla import Regla

# Tabla asociativa para la relación Muchos a Muchos entre Juego y CategoriaJuego
juegos_categorias = Table(
    "juegos_categorias",
    Base.metadata,
    Column("juego_id", ForeignKey("juegos.id", ondelete="CASCADE"), primary_key=True),
    Column("categoria_id", ForeignKey("categorias_juego.id", ondelete="CASCADE"), primary_key=True),
)


class Juego(Base):
    __tablename__ = "juegos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, default="", nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    disponibilidad: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    duracion_min: Mapped[int] = mapped_column(Integer, nullable=False)
    edad_recomendada: Mapped[int] = mapped_column(Integer, nullable=False)
    jugadores_min: Mapped[int] = mapped_column(Integer, nullable=False)
    jugadores_max: Mapped[int] = mapped_column(Integer, nullable=False)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Baja lógica
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relación 0..* a 1 con Dificultad
    dificultad_id: Mapped[int | None] = mapped_column(
        ForeignKey("dificultades.id", ondelete="SET NULL"),
        nullable=True,
    )
    dificultad: Mapped["Dificultad | None"] = relationship(back_populates="juegos")

    # Relación 0..* a 1..* con CategoriaJuego
    categorias: Mapped[list["CategoriaJuego"]] = relationship(
        secondary=juegos_categorias,
        back_populates="juegos",
    )

    # Relación 1 a 0..* con Regla
    reglas: Mapped[list["Regla"]] = relationship(
        back_populates="juego",
        cascade="all, delete-orphan",
        order_by="Regla.orden",
    )
