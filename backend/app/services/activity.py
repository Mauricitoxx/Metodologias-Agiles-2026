from datetime import datetime, timedelta
from typing import Literal

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.actividad import Actividad, EstadoActividad, FrecuenciaActividad
from app.models.tipo_actividad import TipoActividad
from app.schemas.actividad import ActividadCreate, ActividadPostpone, ActividadUpdate
from app.services.errors import conflict, field_error, not_found
from app.services.recurrence import next_occurrence

SortOrder = Literal["asc", "desc"]

# Date the activity actually takes place: the postponed one if it exists, otherwise the original
effective_date = func.coalesce(Actividad.fecha_hora_postergada, Actividad.fecha_hora)

# Statuses whose recurring series keeps generating dates (cancelled/inactive series stop)
RECURRING_STATUSES = (EstadoActividad.activa, EstadoActividad.postergada)


def _end_date(activity: Actividad) -> datetime:
    start = activity.fecha_hora_postergada or activity.fecha_hora
    return start + timedelta(minutes=activity.duracion)


def refresh_recurring_dates(db: Session) -> None:
    """Moves finished recurring activities to their next occurrence.

    Runs lazily before every read, so no background job is needed. A postponed occurrence
    only moves that date: the next one is computed from the original date and the activity
    goes back to "activa".
    """
    now = datetime.now()
    candidates = db.scalars(
        select(Actividad).where(
            Actividad.frecuencia != FrecuenciaActividad.unica,
            Actividad.estado.in_(RECURRING_STATUSES),
            effective_date < now,
        )
    )
    changed = False
    for activity in candidates:
        if _end_date(activity) > now:
            continue  # still in progress
        activity.fecha_hora = next_occurrence(
            activity.fecha_hora,
            activity.frecuencia,
            timedelta(minutes=activity.duracion),
            now,
        )
        activity.fecha_hora_postergada = None
        activity.estado = EstadoActividad.activa
        changed = True
    if changed:
        db.commit()


def _apply_filters(
    query: Select, search: str | None, tipo_id: int | None, estado: EstadoActividad | None
) -> Select:
    if search and search.strip():
        query = query.where(Actividad.nombre.icontains(search.strip(), autoescape=True))
    if tipo_id is not None:
        query = query.where(Actividad.tipo_id == tipo_id)
    if estado is not None:
        query = query.where(Actividad.estado == estado)
    return query


def _ensure_type_exists(db: Session, tipo_id: int) -> None:
    if db.get(TipoActividad, tipo_id) is None:
        raise field_error("tipo_id", "El tipo de actividad no existe")


def list_activities(
    db: Session,
    search: str | None = None,
    tipo_id: int | None = None,
    estado: EstadoActividad | None = None,
    order: SortOrder = "asc",
) -> list[Actividad]:
    """Admin panel: every activity, in any status."""
    refresh_recurring_dates(db)
    sort = effective_date.asc() if order == "asc" else effective_date.desc()
    query = _apply_filters(select(Actividad), search, tipo_id, estado).order_by(sort, Actividad.id)
    return list(db.scalars(query))


def list_schedule(
    db: Session, search: str | None = None, tipo_id: int | None = None
) -> list[Actividad]:
    """Public schedule: activities not finished yet, soonest first. Inactive ones are hidden (RN-01)."""
    refresh_recurring_dates(db)
    now = datetime.now()
    query = (
        _apply_filters(select(Actividad), search, tipo_id, None)
        .where(Actividad.estado != EstadoActividad.inactiva)
        .order_by(effective_date.asc(), Actividad.id)
    )
    # The end date needs the duration (date math differs per database), so it's filtered here.
    # Activities in progress are still shown.
    return [activity for activity in db.scalars(query) if _end_date(activity) > now]


def get_activity(db: Session, activity_id: int) -> Actividad:
    refresh_recurring_dates(db)
    activity = db.get(Actividad, activity_id)
    if activity is None:
        raise not_found("La actividad no existe")
    return activity


def get_public_activity(db: Session, activity_id: int) -> Actividad:
    activity = get_activity(db, activity_id)
    if activity.estado == EstadoActividad.inactiva:
        raise not_found("La actividad no existe")
    return activity


def create_activity(db: Session, data: ActividadCreate) -> Actividad:
    _ensure_type_exists(db, data.tipo_id)

    activity = Actividad(**data.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def update_activity(db: Session, activity_id: int, data: ActividadUpdate) -> Actividad:
    activity = get_activity(db, activity_id)
    _ensure_type_exists(db, data.tipo_id)

    if data.fecha_hora != activity.fecha_hora and data.fecha_hora <= datetime.now():
        raise field_error("fecha_hora", "La fecha y hora deben ser posteriores a la actual")

    changes = data.model_dump(exclude={"estado"})
    if data.estado is not None and data.estado != activity.estado:
        changes["estado"] = data.estado
        # Reactivating or disabling a postponed activity drops the postponed date
        changes["fecha_hora_postergada"] = None

    for field, value in changes.items():
        setattr(activity, field, value)
    db.commit()
    db.refresh(activity)
    return activity


def cancel_activity(db: Session, activity_id: int) -> Actividad:
    activity = get_activity(db, activity_id)
    if activity.estado == EstadoActividad.cancelada:
        raise conflict("La actividad ya está cancelada")
    if activity.estado == EstadoActividad.inactiva:
        raise conflict("No se puede cancelar una actividad inactiva")

    activity.estado = EstadoActividad.cancelada
    db.commit()
    db.refresh(activity)
    return activity


def postpone_activity(db: Session, activity_id: int, data: ActividadPostpone) -> Actividad:
    activity = get_activity(db, activity_id)
    if activity.estado in (EstadoActividad.cancelada, EstadoActividad.inactiva):
        raise conflict(f"No se puede postergar una actividad {activity.estado.value}")
    if data.fecha_hora_postergada <= activity.fecha_hora:
        raise field_error(
            "fecha_hora_postergada", "La nueva fecha debe ser posterior a la fecha original"
        )

    activity.fecha_hora_postergada = data.fecha_hora_postergada
    activity.estado = EstadoActividad.postergada
    db.commit()
    db.refresh(activity)
    return activity


def delete_activity(db: Session, activity_id: int) -> None:
    """Physical delete, as required by HU-16."""
    activity = get_activity(db, activity_id)
    db.delete(activity)
    db.commit()
