from typing import TYPE_CHECKING
from sqlalchemy import String, Text, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.db.base import Base
from app.models.juego import juegos_categorias

if TYPE_CHECKING:
    from app.models.juego import Juego


class CategoriaJuego(Base):
    __tablename__ = "categorias_juego"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)

    # Sin carga automática: cada juego trae sus categorías, y cargar acá los juegos de cada categoría
    # dispararía consultas en cascada solo para contarlos
    juegos: Mapped[list["Juego"]] = relationship(
        secondary="juegos_categorias",
        back_populates="categorias",
    )

    # Se cuenta en SQL dentro de la misma consulta que trae la categoría
    juegos_count: Mapped[int] = column_property(
        select(func.count())
        .where(juegos_categorias.c.categoria_id == id)
        .correlate_except(juegos_categorias)
        .scalar_subquery()
    )
