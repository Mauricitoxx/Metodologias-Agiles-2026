from pydantic import BaseModel, ConfigDict, Field


class DificultadBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=50, description="Nombre de la dificultad (ej. Fácil, Media, Difícil)")


class DificultadCreate(DificultadBase):
    pass


class DificultadUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=50)


class DificultadRead(DificultadBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
