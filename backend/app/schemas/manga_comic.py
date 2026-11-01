from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.categoria_manga_comic import CategoriaMangaComicRead


class MangaComicBase(BaseModel):
    type: Literal["manga", "comic"]
    title: str = Field(min_length=1, max_length=200)
    categoria_manga_comic_id: int = Field(gt=0)
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


class MangaComicCreate(MangaComicBase):
    pass


class MangaComicUpdate(MangaComicBase):
    pass


class MangaComicResponse(MangaComicBase):
    id: int
    is_active: bool
    categoria: CategoriaMangaComicRead

    model_config = ConfigDict(from_attributes=True)