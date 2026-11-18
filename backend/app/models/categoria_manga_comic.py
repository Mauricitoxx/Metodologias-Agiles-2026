from typing import TYPE_CHECKING

from sqlalchemy import String, Text, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.db.base import Base
from app.models.manga_comic_categoria import MangaComicCategoria

if TYPE_CHECKING:
    from app.models.manga_comic import MangaComic


class CategoriaMangaComic(Base):
    __tablename__ = "categorias_manga_comic"

    id: Mapped[int] = mapped_column(primary_key=True)

    nombre: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    descripcion: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Sin carga automática: cada tomo trae sus categorías, y cargar acá los tomos de cada categoría
    # dispararía consultas en cascada solo para contarlos
    mangas_comics: Mapped[list["MangaComic"]] = relationship(
        secondary="manga_comic_categorias",
        back_populates="categorias",
    )

    # Se cuenta en SQL dentro de la misma consulta que trae la categoría
    mangas_comics_count: Mapped[int] = column_property(
        select(func.count())
        .where(MangaComicCategoria.categoria_id == id)
        .correlate_except(MangaComicCategoria)
        .scalar_subquery()
    )
