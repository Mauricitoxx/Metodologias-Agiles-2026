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

from app.db.base import Base


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
    )