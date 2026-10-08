from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.schemas.tipo_actividad import TipoActividadCreate, TipoActividadRead
from app.services import activity_type as activity_type_service

router = APIRouter(prefix="/activity-types", tags=["activity types"])


@router.get("", response_model=list[TipoActividadRead])
def list_activity_types(db: Session = Depends(get_db)):
    return activity_type_service.list_activity_types(db)


@router.post(
    "",
    response_model=TipoActividadRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_activity_type(data: TipoActividadCreate, db: Session = Depends(get_db)):
    return activity_type_service.create_activity_type(db, data)
