from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Inscripcion(Base):
    """A client signed up for one occurrence of an activity."""

    __tablename__ = "inscripciones"
    # One sign-up per email and occurrence
    __table_args__ = (
        UniqueConstraint(
            "actividad_id", "fecha_hora", "email", name="uq_inscripciones_actividad_fecha_email"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    actividad_id: Mapped[int] = mapped_column(
        ForeignKey("actividades.id", ondelete="CASCADE"), index=True
    )
    # Original date of the occurrence (`Actividad.fecha_hora`): a postponement keeps the sign-ups,
    # and when a recurring activity moves to its next date the count starts again
    fecha_hora: Mapped[datetime] = mapped_column(DateTime)
    nombre: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(254))
    creada_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
