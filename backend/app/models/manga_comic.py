from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.categoria_manga_comic import CategoriaMangaComic

class MangaComic(Base):
    __tablename__ = "manga_comics"
    #CAMPOS
    #id
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )
    #titulo del manga o comic
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
        # tipo de publicación: manga o comic
    type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    # categoría del manga o comic
    categoria_manga_comic_id: Mapped[int] = mapped_column(
        ForeignKey("categorias_manga_comic.id"),
        nullable=False,
    )

    categoria: Mapped["CategoriaMangaComic"] = relationship(
        back_populates="mangas_comics",
        lazy="joined",
    )
    # autor o autora del manga o comic
    author: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    #numero de volumen del manga o comic
    volume_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    #cantidad de paginas del manga o comic
    pages: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    #cantidad de copias del manga o comic
    copies: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    #sinopsis del manga o comic
    synopsis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
     # portada del manga o cómic, codificada en Base64
    image: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    #indica si el manga o comic está activo o dado de baja
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    __table_args__ = (
        #impide guardar una cantidad de copias menor o igual a 0 en la bd
        CheckConstraint(
            "copies > 0",
            name="ck_manga_comics_copies_positive",
        ),
        #impide que haya dos mangas o comics con el mismo título y número de volumen activos al mismo tiempo
        Index(
            "uq_manga_comics_title_volume_active",
            "title",
            "volume_number",
            unique=True,
            postgresql_where=text("is_active IS TRUE"),
            sqlite_where=text("is_active = 1"),
        ),
                CheckConstraint(
            "type IN ('manga', 'comic')",
            name="ck_manga_comics_type_valid",
        ),
    )