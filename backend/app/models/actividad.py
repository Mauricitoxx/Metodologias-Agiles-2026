import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.tipo_actividad import TipoActividad


class FrecuenciaActividad(str, enum.Enum):
    unica = "unica"
    semanal = "semanal"
    quincenal = "quincenal"
    mensual = "mensual"


class EstadoActividad(str, enum.Enum):
    activa = "activa"
    cancelada = "cancelada"
    postergada = "postergada"
    inactiva = "inactiva"


class AlcanceCambio(str, enum.Enum):
    """Scope of a cancellation or postponement of a recurring activity."""

    fecha = "fecha"
    serie = "serie"


class Actividad(Base):
    __tablename__ = "actividades"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[str] = mapped_column(Text)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime, index=True)
    fecha_hora_postergada: Mapped[datetime | None] = mapped_column(DateTime)
    duracion: Mapped[int]  # minutes
    cupo: Mapped[int]
    imagen: Mapped[str] = mapped_column(String(500))  # image URL
    frecuencia: Mapped[FrecuenciaActividad] = mapped_column(
        Enum(FrecuenciaActividad, native_enum=False, length=20)
    )
    estado: Mapped[EstadoActividad] = mapped_column(
        Enum(EstadoActividad, native_enum=False, length=20),
        default=EstadoActividad.activa,
        index=True,
    )
    # Reason of the last cancellation or postponement, shown to clients
    motivo: Mapped[str | None] = mapped_column(String(200))
    alcance: Mapped[AlcanceCambio | None] = mapped_column(
        Enum(AlcanceCambio, native_enum=False, length=20)
    )
    edad_minima: Mapped[int]
    tipo_id: Mapped[int] = mapped_column(ForeignKey("tipos_actividad.id"), index=True)

    tipo: Mapped[TipoActividad] = relationship(lazy="joined")
