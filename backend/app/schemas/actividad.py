from datetime import datetime
from typing import Annotated

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    HttpUrl,
    TypeAdapter,
    ValidationError,
    field_validator,
)

from app.models.actividad import EstadoActividad, FrecuenciaActividad
from app.schemas.tipo_actividad import TipoActividadRead

CREATE_STATUSES = {EstadoActividad.activa, EstadoActividad.inactiva}
UPDATE_STATUSES = {EstadoActividad.activa, EstadoActividad.cancelada, EstadoActividad.inactiva}


def to_naive_local(value: datetime) -> datetime:
    """Dates are stored as naive local time; convert timezone-aware input to that format."""
    if value.tzinfo is not None:
        return value.astimezone().replace(tzinfo=None)
    return value


def ensure_future(value: datetime) -> datetime:
    if value <= datetime.now():
        raise ValueError("La fecha y hora deben ser posteriores a la actual")
    return value


_http_url = TypeAdapter(HttpUrl)


def ensure_web_url(value: str) -> str:
    """Validates the URL but keeps the original text (HttpUrl would normalize it, e.g. adding '/')."""
    try:
        _http_url.validate_python(value)
    except ValidationError:
        raise ValueError("Debe ingresar una URL web válida") from None
    return value


LocalDateTime = Annotated[datetime, AfterValidator(to_naive_local)]
FutureDateTime = Annotated[LocalDateTime, AfterValidator(ensure_future)]
NonEmptyStr = Annotated[str, Field(min_length=1)]
ImageUrl = Annotated[str, Field(min_length=1, max_length=500), AfterValidator(ensure_web_url)]


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


class ActividadCreate(ActividadBase):
    fecha_hora: FutureDateTime

    @field_validator("estado")
    @classmethod
    def ensure_create_status(cls, value: EstadoActividad) -> EstadoActividad:
        if value not in CREATE_STATUSES:
            raise ValueError("El estado solo puede ser 'activa' o 'inactiva'")
        return value


class ActividadUpdate(ActividadBase):
    """Full update (PUT).

    `fecha_hora` is the date the activity takes place (the postponed one if it exists): changing it
    postpones the activity. The future-date rule is applied by the service only when the date changes.
    """

    estado: EstadoActividad | None = None

    @field_validator("estado")
    @classmethod
    def ensure_update_status(cls, value: EstadoActividad | None) -> EstadoActividad | None:
        if value is not None and value not in UPDATE_STATUSES:
            raise ValueError("El estado solo puede ser 'activa', 'cancelada' o 'inactiva'")
        return value


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
