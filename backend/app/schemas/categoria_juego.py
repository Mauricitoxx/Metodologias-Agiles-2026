from pydantic import BaseModel, ConfigDict, Field


class CategoriaJuegoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100, description="Nombre de la categoría")
    descripcion: str = Field(..., description="Descripción de la categoría")


class CategoriaJuegoCreate(CategoriaJuegoBase):
    pass


class CategoriaJuegoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    descripcion: str | None = None


class CategoriaJuegoRead(CategoriaJuegoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    juegos_count: int = 0
