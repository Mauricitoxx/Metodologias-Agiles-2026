from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class TipoActividadCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: Annotated[str, Field(min_length=1, max_length=50)]


class TipoActividadUpdate(TipoActividadCreate):
    pass


class TipoActividadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
