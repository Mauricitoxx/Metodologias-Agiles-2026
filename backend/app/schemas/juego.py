import base64
import binascii
import re
from typing import Annotated, Self

from pydantic import AfterValidator, BaseModel, BeforeValidator, ConfigDict, Field, model_validator

from app.schemas.actividad import ensure_web_url
from app.schemas.categoria_juego import CategoriaJuegoRead
from app.schemas.dificultad import DificultadRead
from app.schemas.regla import ReglaRead

# El formulario de juegos sube la portada como data URL (ya redimensionada a 600 px en el navegador).
# También se acepta una URL web, como en actividades y productos.
DATA_URL_IMAGEN = re.compile(r"data:image/(png|jpeg|webp);base64,(?P<datos>[A-Za-z0-9+/]+={0,2})")
IMAGEN_MAX_BYTES = 2 * 1024 * 1024
IMAGEN_URL_MAX_CARACTERES = 500


def validar_imagen(value: str) -> str:
    coincidencia = DATA_URL_IMAGEN.fullmatch(value)
    if coincidencia is None:
        if len(value) > IMAGEN_URL_MAX_CARACTERES:
            raise ValueError("La URL de la imagen no puede superar los 500 caracteres")
        return ensure_web_url(value)
    try:
        datos = base64.b64decode(coincidencia["datos"], validate=True)
    except binascii.Error:
        raise ValueError("La imagen no es válida") from None
    if len(datos) > IMAGEN_MAX_BYTES:
        raise ValueError("La imagen no puede superar los 2 MB")
    return value


# Vacía significa "sin portada"
ImagenJuego = Annotated[
    str | None,
    BeforeValidator(lambda value: (value.strip() or None) if isinstance(value, str) else value),
    AfterValidator(lambda value: None if value is None else validar_imagen(value)),
]


class JuegoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=150, description="Nombre del juego")
    descripcion: str = Field(default="", description="Descripción detallada del juego")
    cantidad: int = Field(default=1, ge=0, description="Cantidad de ejemplares disponibles en el local")
    disponibilidad: bool = Field(default=True, description="Indica si está disponible para uso de los clientes")
    duracion_min: int = Field(..., gt=0, description="Duración aproximada de la partida en minutos")
    edad_recomendada: int = Field(..., ge=0, description="Edad mínima sugerida para jugar")
    jugadores_min: int = Field(..., ge=1, description="Cantidad mínima de jugadores")
    jugadores_max: int = Field(..., ge=1, description="Cantidad máxima de jugadores")
    video_url: str | None = Field(default=None, max_length=500, description="URL opcional de video explicativo")
    dificultad_id: int | None = Field(default=None, description="ID del nivel de dificultad asociado")
    imagen: ImagenJuego = Field(default=None, description="Portada: data URL PNG/JPG/WebP o URL web")

    @model_validator(mode="after")
    def validate_jugadores(self) -> Self:
        if self.jugadores_min > self.jugadores_max:
            raise ValueError("jugadores_max debe ser mayor o igual que jugadores_min")
        return self


class JuegoCreate(JuegoBase):
    categoria_ids: list[int] = Field(default_factory=list, description="IDs de las categorías asociadas al juego")


class JuegoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=150)
    descripcion: str | None = None
    cantidad: int | None = Field(default=None, ge=0)
    disponibilidad: bool | None = None
    duracion_min: int | None = Field(default=None, gt=0)
    edad_recomendada: int | None = Field(default=None, ge=0)
    jugadores_min: int | None = Field(default=None, ge=1)
    jugadores_max: int | None = Field(default=None, ge=1)
    video_url: str | None = Field(default=None, max_length=500)
    activo: bool | None = None
    dificultad_id: int | None = None
    # Si no se envía se conserva; vacía o null quita la portada
    imagen: ImagenJuego = None
    categoria_ids: list[int] | None = None

    @model_validator(mode="after")
    def validate_jugadores(self) -> Self:
        if self.jugadores_min is not None and self.jugadores_max is not None:
            if self.jugadores_min > self.jugadores_max:
                raise ValueError("jugadores_max debe ser mayor o igual que jugadores_min")
        return self


class JuegoRead(JuegoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo: bool
    dificultad: DificultadRead | None = None
    categorias: list[CategoriaJuegoRead] = Field(default_factory=list)


class JuegoDetailRead(JuegoRead):
    reglas: list[ReglaRead] = Field(default_factory=list)
