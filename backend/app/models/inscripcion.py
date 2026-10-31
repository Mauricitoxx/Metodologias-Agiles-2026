from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.actividad import Actividad


class Inscripcion(Base):
    """A client signed up for one occurrence of an activity."""

    __tablename__ = "inscripciones"
    # One sign-up per email and occurrence
    __table_args__ = (
        UniqueConstraint(
            "actividad_id", "fecha_hora", "email", name="uq_inscripciones_actividad_fecha_email"
        ),
        UniqueConstraint("token_hash", name="uq_inscripciones_token_hash"),
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
    # Null only in sign-ups made before these fields existed
    edad: Mapped[int | None]
    # SHA-256 of the secret token that lets the client cancel without an account (the token itself is
    # never stored)
    token_hash: Mapped[str | None] = mapped_column(String(64))
    creada_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    actividad: Mapped[Actividad] = relationship(back_populates="inscripciones")

    @property
    def cancelable(self) -> bool:
        """Until the activity starts. Once a recurring activity moves on, the old date is over."""
        activity = self.actividad
        start = activity.fecha_hora_postergada or activity.fecha_hora
        return self.fecha_hora == activity.fecha_hora and start > datetime.now()
