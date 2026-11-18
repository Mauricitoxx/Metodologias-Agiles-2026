import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func, select
from sqlalchemy.orm import Mapped, mapped_column, object_session, relationship

from app.db.base import Base
from app.models.inscripcion import Inscripcion
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
    # Not serialized: the counts below query only the current occurrence
    inscripciones: Mapped[list[Inscripcion]] = relationship(
        back_populates="actividad", cascade="all, delete-orphan"
    )

    @property
    def inscriptos(self) -> int:
        """Sign-ups of the current occurrence (queried each time, so it never goes stale).

        Listings preload every count in one query (`prefetch_signup_counts`); the preloaded value is
        used only while the occurrence date it was counted for is still the current one.
        """
        prefetched = self.__dict__.get("_inscriptos_prefetch")
        if prefetched is not None and prefetched[0] == self.fecha_hora:
            return prefetched[1]
        session = object_session(self)
        if session is None:
            return 0
        return session.scalar(
            select(func.count(Inscripcion.id)).where(
                Inscripcion.actividad_id == self.id,
                Inscripcion.fecha_hora == self.fecha_hora,
            )
        )

    @property
    def cupos_disponibles(self) -> int:
        # The admin may lower the quota below the sign-ups already taken
        return max(self.cupo - self.inscriptos, 0)


def prefetch_signup_counts(session, activities: list[Actividad]) -> list[Actividad]:
    """Counts the sign-ups of every activity in one grouped query, instead of one query each."""
    if not activities:
        return activities
    rows = session.execute(
        select(Inscripcion.actividad_id, Inscripcion.fecha_hora, func.count(Inscripcion.id))
        .where(Inscripcion.actividad_id.in_([activity.id for activity in activities]))
        .group_by(Inscripcion.actividad_id, Inscripcion.fecha_hora)
    )
    counts = {(activity_id, date): total for activity_id, date, total in rows}
    for activity in activities:
        activity._inscriptos_prefetch = (
            activity.fecha_hora,
            counts.get((activity.id, activity.fecha_hora), 0),
        )
    return activities
