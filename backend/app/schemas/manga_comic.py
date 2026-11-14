from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.categoria_manga_comic import CategoriaMangaComicRead


class MangaComicBase(BaseModel):
    type: Literal["manga", "comic"]
    title: str = Field(min_length=1, max_length=200)
    categorias_ids: list[int] = Field(min_length=1)
    author: str | None = Field(default=None, max_length=200)
    volume_number: int = Field(gt=0)
    pages: int = Field(gt=0)
    copies: int = Field(gt=0)
    synopsis: str | None = None
    image: str | None = None

    @field_validator("title")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El campo no puede estar vacío.")
        return value

    @field_validator("categorias_ids")
    @classmethod
    def validate_categories(cls, value: list[int]) -> list[int]:
        if any(category_id <= 0 for category_id in value):
            raise ValueError("Los IDs de las categorías deben ser positivos.")

        if len(value) != len(set(value)):
            raise ValueError("No se puede repetir una categoría.")

        return value


class MangaComicCreate(MangaComicBase):
    pass


class MangaComicUpdate(MangaComicBase):
    pass


class MangaComicResponse(BaseModel):
    id: int
    type: Literal["manga", "comic"]
    title: str
    categorias: list[CategoriaMangaComicRead]
    author: str | None
    volume_number: int
    pages: int
    copies: int
    synopsis: str | None
    image: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)