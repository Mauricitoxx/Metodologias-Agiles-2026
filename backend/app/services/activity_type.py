from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.tipo_actividad import TipoActividad
from app.schemas.tipo_actividad import TipoActividadCreate
from app.services.errors import conflict


def list_activity_types(db: Session) -> list[TipoActividad]:
    return list(db.scalars(select(TipoActividad).order_by(TipoActividad.nombre)))


def create_activity_type(db: Session, data: TipoActividadCreate) -> TipoActividad:
    duplicate = db.scalar(
        select(TipoActividad).where(func.lower(TipoActividad.nombre) == data.nombre.lower())
    )
    if duplicate:
        raise conflict("El tipo de actividad ya existe")

    activity_type = TipoActividad(**data.model_dump())
    db.add(activity_type)
    db.commit()
    db.refresh(activity_type)
    return activity_type
