from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MangaComicCategoria(Base):
    __tablename__ = "manga_comic_categorias"

    manga_comic_id: Mapped[int] = mapped_column(
        ForeignKey("manga_comics.id", ondelete="CASCADE"),
        primary_key=True,
    )

    categoria_id: Mapped[int] = mapped_column(
        ForeignKey("categorias_manga_comic.id", ondelete="CASCADE"),
        primary_key=True,
    )