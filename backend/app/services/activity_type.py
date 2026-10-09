from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.actividad import Actividad
from app.models.tipo_actividad import TipoActividad
from app.schemas.tipo_actividad import TipoActividadCreate, TipoActividadUpdate
from app.services.errors import conflict, not_found


def list_activity_types(db: Session) -> list[TipoActividad]:
    return list(db.scalars(select(TipoActividad).order_by(TipoActividad.nombre)))


def _get_activity_type(db: Session, type_id: int) -> TipoActividad:
    activity_type = db.get(TipoActividad, type_id)
    if activity_type is None:
        raise not_found("El tipo de actividad no existe")
    return activity_type


def _ensure_unique_name(db: Session, nombre: str, exclude_id: int | None = None) -> None:
    query = select(TipoActividad).where(func.lower(TipoActividad.nombre) == nombre.lower())
    if exclude_id is not None:
        query = query.where(TipoActividad.id != exclude_id)
    if db.scalar(query):
        raise conflict("El tipo de actividad ya existe")


def create_activity_type(db: Session, data: TipoActividadCreate) -> TipoActividad:
    _ensure_unique_name(db, data.nombre)

    activity_type = TipoActividad(**data.model_dump())
    db.add(activity_type)
    db.commit()
    db.refresh(activity_type)
    return activity_type


def update_activity_type(db: Session, type_id: int, data: TipoActividadUpdate) -> TipoActividad:
    activity_type = _get_activity_type(db, type_id)
    _ensure_unique_name(db, data.nombre, exclude_id=type_id)

    activity_type.nombre = data.nombre
    db.commit()
    db.refresh(activity_type)
    return activity_type


def delete_activity_type(db: Session, type_id: int) -> None:
    """Only unused types can be deleted, so no activity is left without a type."""
    activity_type = _get_activity_type(db, type_id)
    in_use = db.scalar(select(func.count()).where(Actividad.tipo_id == type_id))
    if in_use:
        noun = "actividad" if in_use == 1 else "actividades"
        raise conflict(f"No se puede eliminar: el tipo está en uso por {in_use} {noun}")

    db.delete(activity_type)
    db.commit()
