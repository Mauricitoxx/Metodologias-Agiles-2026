from pydantic import BaseModel, ConfigDict, Field


class CategoriaMangaComicBase(BaseModel):
    nombre: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Nombre de la categoría",
    )

    descripcion: str = Field(
        ...,
        description="Descripción de la categoría",
    )


class CategoriaMangaComicCreate(CategoriaMangaComicBase):
    pass


class CategoriaMangaComicUpdate(BaseModel):
    nombre: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    descripcion: str | None = None


class CategoriaMangaComicRead(CategoriaMangaComicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mangas_comics_count: int = 0