from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.schemas.tipo_actividad import (
    TipoActividadCreate,
    TipoActividadRead,
    TipoActividadUpdate,
)
from app.services import activity_type as activity_type_service

router = APIRouter(prefix="/activity-types", tags=["activity types"])

ADMIN_ONLY = [Depends(require_admin)]


@router.get("", response_model=list[TipoActividadRead])
def list_activity_types(db: Session = Depends(get_db)):
    return activity_type_service.list_activity_types(db)


@router.post(
    "",
    response_model=TipoActividadRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=ADMIN_ONLY,
)
def create_activity_type(data: TipoActividadCreate, db: Session = Depends(get_db)):
    return activity_type_service.create_activity_type(db, data)


@router.put("/{type_id}", response_model=TipoActividadRead, dependencies=ADMIN_ONLY)
def update_activity_type(
    type_id: int, data: TipoActividadUpdate, db: Session = Depends(get_db)
):
    return activity_type_service.update_activity_type(db, type_id, data)


@router.delete("/{type_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=ADMIN_ONLY)
def delete_activity_type(type_id: int, db: Session = Depends(get_db)):
    activity_type_service.delete_activity_type(db, type_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
