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


STATUS_TRANSITIONS = {
    EstadoActividad.activa: (EstadoActividad.cancelada, EstadoActividad.inactiva),
    EstadoActividad.cancelada: (EstadoActividad.activa, EstadoActividad.postergada),
    EstadoActividad.inactiva: (
        EstadoActividad.activa,
        EstadoActividad.postergada,
        EstadoActividad.cancelada,
    ),
}

STATUS_CONFLICTS = {
    EstadoActividad.activa: "La actividad ya está visible para los clientes",
    EstadoActividad.cancelada: "Solo se puede cancelar una actividad activa o postergada",
    EstadoActividad.inactiva: "La actividad ya está inactiva",
}


def _visible_status(activity: Actividad) -> EstadoActividad:
    if activity.fecha_hora_postergada is not None:
        return EstadoActividad.postergada
    return EstadoActividad.activa


def _visible_or_current(activity: Actividad) -> EstadoActividad:
    """Status as the edit form sees it: a postponed activity is shown as "activa"."""
    if activity.estado == EstadoActividad.postergada:
        return EstadoActividad.activa
    return activity.estado


def _change_status(activity: Actividad, target: EstadoActividad) -> None:
    if activity.estado not in STATUS_TRANSITIONS[target]:
        raise conflict(STATUS_CONFLICTS[target])
    # Inactivating or cancelling keeps the postponed date, so reactivating restores it
    activity.estado = _visible_status(activity) if target == EstadoActividad.activa else target


def _reschedule(activity: Actividad, new_date: datetime, field: str) -> None:
    """Moves the activity to `new_date`, keeping the original date so clients see the change.

    Going back to the original date undoes the postponement. Inactive activities are not visible
    to clients, so their date is just replaced.
    """
    if new_date <= datetime.now():
        raise field_error(field, "La fecha y hora deben ser posteriores a la actual")

    if activity.estado == EstadoActividad.inactiva and activity.fecha_hora_postergada is None:
        activity.fecha_hora = new_date
        return

    if new_date == activity.fecha_hora:
        activity.fecha_hora_postergada = None
    else:
        activity.fecha_hora_postergada = new_date
    if activity.estado in (EstadoActividad.activa, EstadoActividad.postergada):
        activity.estado = _visible_status(activity)


def _save(db: Session, activity: Actividad) -> Actividad:
    db.commit()
    db.refresh(activity)
    return activity


def update_activity(db: Session, activity_id: int, data: ActividadUpdate) -> Actividad:
    activity = get_activity(db, activity_id)
    _ensure_type_exists(db, data.tipo_id)

    if data.estado is not None and data.estado != _visible_or_current(activity):
        _change_status(activity, data.estado)

    current_date = activity.fecha_hora_postergada or activity.fecha_hora
    if data.fecha_hora != current_date:
        _reschedule(activity, data.fecha_hora, "fecha_hora")

    for field, value in data.model_dump(exclude={"estado", "fecha_hora"}).items():
        setattr(activity, field, value)
    return _save(db, activity)


def cancel_activity(db: Session, activity_id: int) -> Actividad:
    activity = get_activity(db, activity_id)
    _change_status(activity, EstadoActividad.cancelada)
    return _save(db, activity)


def deactivate_activity(db: Session, activity_id: int) -> Actividad:
    """Hides the activity from clients (RN-01) without deleting it."""
    activity = get_activity(db, activity_id)
    _change_status(activity, EstadoActividad.inactiva)
    return _save(db, activity)


def activate_activity(db: Session, activity_id: int) -> Actividad:
    """Makes an inactive or cancelled activity visible again, keeping its postponed date."""
    activity = get_activity(db, activity_id)
    _change_status(activity, EstadoActividad.activa)
    return _save(db, activity)


def postpone_activity(db: Session, activity_id: int, data: ActividadPostpone) -> Actividad:
    activity = get_activity(db, activity_id)
    if activity.estado not in (EstadoActividad.activa, EstadoActividad.postergada):
        raise conflict(f"No se puede postergar una actividad {activity.estado.value}")
    if data.fecha_hora_postergada == activity.fecha_hora:
        raise field_error(
            "fecha_hora_postergada", "La nueva fecha debe ser distinta a la fecha original"
        )

    _reschedule(activity, data.fecha_hora_postergada, "fecha_hora_postergada")
    return _save(db, activity)


def undo_postpone_activity(db: Session, activity_id: int) -> Actividad:
    """Moves a postponed activity back to its original date."""
    activity = get_activity(db, activity_id)
    if activity.estado != EstadoActividad.postergada:
        raise conflict("La actividad no está postergada")
    if activity.fecha_hora <= datetime.now():
        raise conflict("La fecha original ya pasó: elegí una nueva fecha")

    activity.fecha_hora_postergada = None
    activity.estado = EstadoActividad.activa
    return _save(db, activity)


def delete_activity(db: Session, activity_id: int) -> None:
    """Physical delete, as required by HU-16."""
    activity = get_activity(db, activity_id)
    db.delete(activity)
    db.commit()
