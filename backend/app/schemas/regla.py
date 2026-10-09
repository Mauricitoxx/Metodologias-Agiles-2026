from pydantic import BaseModel, ConfigDict, Field


class ReglaBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=150, description="Título o sección de la regla")
    contenido: str = Field(..., min_length=1, description="Texto explicativo de la regla")
    orden: int = Field(default=1, ge=1, description="Orden de aparición de la regla en el juego")


class ReglaCreate(ReglaBase):
    juego_id: int | None = Field(default=None, description="ID del juego asociado (opcional si se infiere por ruta)")


class ReglaUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=150)
    contenido: str | None = Field(default=None, min_length=1)
    orden: int | None = Field(default=None, ge=1)


class ReglaRead(ReglaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    juego_id: int
