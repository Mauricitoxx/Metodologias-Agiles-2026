from datetime import date

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.actividad import EstadoActividad
from app.schemas.actividad import (
    ActividadCancel,
    ActividadCreate,
    ActividadPostpone,
    ActividadRead,
    ActividadUpdate,
    InscripcionCreate,
    InscripcionCreated,
    InscripcionRead,
    InscriptoRead,
)
from app.services import activity as activity_service
from app.services.activity import SortOrder

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("/schedule", response_model=list[ActividadRead])
def list_schedule(
    search: str | None = Query(None, description="Search by name"),
    tipo_id: int | None = Query(None, description="Filter by activity type"),
    db: Session = Depends(get_db),
):
    return activity_service.list_schedule(db, search, tipo_id)


@router.get("/schedule/{activity_id}", response_model=ActividadRead)
def get_public_activity(activity_id: int, db: Session = Depends(get_db)):
    return activity_service.get_public_activity(db, activity_id)


@router.post(
    "/schedule/{activity_id}/registrations",
    response_model=InscripcionCreated,
    status_code=status.HTTP_201_CREATED,
)
def register_to_activity(
    activity_id: int, data: InscripcionCreate, db: Session = Depends(get_db)
):
    """Returns the activity with its updated remaining spots and the token to cancel the sign-up."""
    activity, token = activity_service.register_to_activity(db, activity_id, data)
    return {"token": token, "actividad": activity}


# The token is the only proof of the sign-up: clients don't have accounts
@router.get("/registrations/{token}", response_model=InscripcionRead)
def get_registration(token: str, db: Session = Depends(get_db)):
    return activity_service.get_registration(db, token)


@router.delete("/registrations/{token}", response_model=ActividadRead)
def cancel_registration(token: str, db: Session = Depends(get_db)):
    """Returns the activity with the freed spot."""
    return activity_service.cancel_registration(db, token)


# --- Admin endpoints (RN-02) ---
ADMIN_ONLY = [Depends(require_admin)]


@router.get("", response_model=list[ActividadRead], dependencies=ADMIN_ONLY)
def list_activities(
    search: str | None = Query(None, description="Search by name"),
    tipo_id: int | None = Query(None, description="Filter by activity type"),
    estado: EstadoActividad | None = Query(None, description="Filter by status"),
    order: SortOrder = Query("asc", description="Sort by date"),
    date_from: date | None = Query(None, description="First day of the range (inclusive)"),
    date_to: date | None = Query(None, description="Last day of the range (inclusive)"),
    db: Session = Depends(get_db),
):
    return activity_service.list_activities(
        db, search, tipo_id, estado, order, date_from, date_to
    )


@router.get("/{activity_id}", response_model=ActividadRead, dependencies=ADMIN_ONLY)
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    return activity_service.get_activity(db, activity_id)


@router.post(
    "",
    response_model=ActividadRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=ADMIN_ONLY,
)
def create_activity(data: ActividadCreate, db: Session = Depends(get_db)):
    return activity_service.create_activity(db, data)


@router.put("/{activity_id}", response_model=ActividadRead, dependencies=ADMIN_ONLY)
def update_activity(activity_id: int, data: ActividadUpdate, db: Session = Depends(get_db)):
    return activity_service.update_activity(db, activity_id, data)


@router.patch("/{activity_id}/cancel", response_model=ActividadRead, dependencies=ADMIN_ONLY)
def cancel_activity(
    activity_id: int, data: ActividadCancel | None = None, db: Session = Depends(get_db)
):
    return activity_service.cancel_activity(db, activity_id, data or ActividadCancel())


@router.patch("/{activity_id}/postpone", response_model=ActividadRead, dependencies=ADMIN_ONLY)
def postpone_activity(
    activity_id: int, data: ActividadPostpone, db: Session = Depends(get_db)
):
    return activity_service.postpone_activity(db, activity_id, data)


@router.patch(
    "/{activity_id}/undo-postpone", response_model=ActividadRead, dependencies=ADMIN_ONLY
)
def undo_postpone_activity(activity_id: int, db: Session = Depends(get_db)):
    return activity_service.undo_postpone_activity(db, activity_id)


@router.patch("/{activity_id}/deactivate", response_model=ActividadRead, dependencies=ADMIN_ONLY)
def deactivate_activity(activity_id: int, db: Session = Depends(get_db)):
    return activity_service.deactivate_activity(db, activity_id)


@router.patch("/{activity_id}/activate", response_model=ActividadRead, dependencies=ADMIN_ONLY)
def activate_activity(activity_id: int, db: Session = Depends(get_db)):
    return activity_service.activate_activity(db, activity_id)


@router.get(
    "/{activity_id}/registrations",
    response_model=list[InscriptoRead],
    dependencies=ADMIN_ONLY,
)
def list_registrations(activity_id: int, db: Session = Depends(get_db)):
    return activity_service.list_registrations(db, activity_id)


@router.delete(
    "/{activity_id}/registrations/{registration_id}",
    response_model=ActividadRead,
    dependencies=ADMIN_ONLY,
)
def delete_registration(activity_id: int, registration_id: int, db: Session = Depends(get_db)):
    """Returns the activity with the freed spot."""
    return activity_service.delete_registration(db, activity_id, registration_id)


@router.delete(
    "/{activity_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=ADMIN_ONLY
)
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    activity_service.delete_activity(db, activity_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

