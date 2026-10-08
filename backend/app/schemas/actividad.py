from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.models.actividad import EstadoActividad, FrecuenciaActividad
from app.schemas.tipo_actividad import TipoActividadRead

EDITABLE_STATUSES = {EstadoActividad.activa, EstadoActividad.inactiva}


def to_naive_local(value: datetime) -> datetime:
    """Dates are stored as naive local time; convert timezone-aware input to that format."""
    if value.tzinfo is not None:
        return value.astimezone().replace(tzinfo=None)
    return value


def ensure_future(value: datetime) -> datetime:
    if value <= datetime.now():
        raise ValueError("La fecha y hora deben ser posteriores a la actual")
    return value


LocalDateTime = Annotated[datetime, AfterValidator(to_naive_local)]
FutureDateTime = Annotated[LocalDateTime, AfterValidator(ensure_future)]
NonEmptyStr = Annotated[str, Field(min_length=1)]
ImageUrl = Annotated[HttpUrl, Field(max_length=500), AfterValidator(str)]


class ActividadBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: Annotated[NonEmptyStr, Field(max_length=100)]
    descripcion: NonEmptyStr
    fecha_hora: LocalDateTime
    duracion: Annotated[int, Field(gt=0)]  # minutes
    cupo: Annotated[int, Field(gt=0)]
    imagen: ImageUrl
    frecuencia: FrecuenciaActividad
    estado: EstadoActividad
    edad_minima: Annotated[int, Field(ge=0)]
    tipo_id: Annotated[int, Field(gt=0)]

    @field_validator("estado")
    @classmethod
    def ensure_editable_status(cls, value: EstadoActividad) -> EstadoActividad:
        if value not in EDITABLE_STATUSES:
            raise ValueError("El estado solo puede ser 'activa' o 'inactiva'")
        return value


class ActividadCreate(ActividadBase):
    fecha_hora: FutureDateTime


class ActividadUpdate(ActividadBase):
    """Full update (PUT). The future-date rule is applied by the service only when the date changes."""


class ActividadPostpone(BaseModel):
    fecha_hora_postergada: FutureDateTime


class ActividadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str
    fecha_hora: datetime
    fecha_hora_postergada: datetime | None
    duracion: int
    cupo: int
    imagen: str
    frecuencia: FrecuenciaActividad
    estado: EstadoActividad
    edad_minima: int
    tipo: TipoActividadRead
