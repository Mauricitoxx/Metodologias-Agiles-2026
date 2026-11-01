from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

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

    mangas_comics: Mapped[list["MangaComic"]] = relationship(
        back_populates="categoria",
        lazy="selectin",
    )

    @property
    def mangas_comics_count(self) -> int:
        return len(self.mangas_comics) if self.mangas_comics is not None else 0