from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.categoria_manga_comic import CategoriaMangaComic


class MangaComic(Base):
    __tablename__ = "manga_comics"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    categorias: Mapped[list["CategoriaMangaComic"]] = relationship(
        secondary="manga_comic_categorias",
        back_populates="mangas_comics",
        lazy="selectin",
    )

    author: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    volume_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    pages: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    copies: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    synopsis: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    image: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    __table_args__ = (
        CheckConstraint(
            "copies > 0",
            name="ck_manga_comics_copies_positive",
        ),
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