from pydantic import BaseModel, ConfigDict, Field, field_validator

#
class MangaComicBase(BaseModel):
    #titulo* obligatorio
    title: str = Field(min_length=1, max_length=200)
    #numero de volumen* obligatorio, mayor a cero
    volume_number: int = Field(gt=0)
    pages: int = Field(gt=0)
    copies: int = Field(gt=0)
    #sinopsis opcional
    synopsis: str | None = None

    #reviso que el titulo no sea un espacio vacio
    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("El título no puede estar vacío.")

        return value

#valida los datos para dar de alta un registro
class MangaComicCreate(MangaComicBase):
    #por ahora solo hereda los campos y validaciones de la base
    pass

#valida los datos para actualizar un registro
class MangaComicUpdate(MangaComicBase):
    pass

#define que datos devuelve la API
class MangaComicResponse(MangaComicBase):
    id: int
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
