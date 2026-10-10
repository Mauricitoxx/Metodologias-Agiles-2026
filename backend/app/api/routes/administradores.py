from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.routes.auth import get_current_admin
from app.db.session import get_db
from app.models.administrador import Administrador
from app.schemas.administrador import AdministradorCreate, AdministradorRead, AdministradorUpdate
from app.services import administrador as admin_service

router = APIRouter(prefix="/administradores", tags=["administradores"])


@router.get("", response_model=list[AdministradorRead])
def listar_administradores(
    db: Session = Depends(get_db),
    _admin: Administrador = Depends(get_current_admin),
):
    """Lista todos los administradores registrados."""
    return admin_service.listar_administradores(db)


@router.post("", response_model=AdministradorRead, status_code=status.HTTP_201_CREATED)
def crear_administrador(
    datos: AdministradorCreate,
    db: Session = Depends(get_db),
    _admin: Administrador = Depends(get_current_admin),
):
    """Crea un nuevo administrador en el sistema con su contraseña."""
    return admin_service.crear_administrador(db, datos)


@router.get("/{admin_id}", response_model=AdministradorRead)
def obtener_administrador(
    admin_id: int,
    db: Session = Depends(get_db),
    _admin: Administrador = Depends(get_current_admin),
):
    """Obtiene el detalle de un administrador por ID."""
    return admin_service.obtener_administrador(db, admin_id)


@router.put("/{admin_id}", response_model=AdministradorRead)
def actualizar_administrador(
    admin_id: int,
    datos: AdministradorUpdate,
    db: Session = Depends(get_db),
    _admin: Administrador = Depends(get_current_admin),
):
    """Actualiza datos de un administrador."""
    return admin_service.actualizar_administrador(db, admin_id, datos)


@router.patch("/{admin_id}/desactivar", response_model=AdministradorRead)
def desactivar_administrador(
    admin_id: int,
    db: Session = Depends(get_db),
    admin: Administrador = Depends(get_current_admin),
):
    """Da de baja/desactiva a un administrador."""
    return admin_service.desactivar_administrador(db, admin_id, current_admin_id=admin.id)


@router.patch("/{admin_id}/activar", response_model=AdministradorRead)
def activar_administrador(
    admin_id: int,
    db: Session = Depends(get_db),
    _admin: Administrador = Depends(get_current_admin),
):
    """Reactiva a un administrador inactivo."""
    return admin_service.activar_administrador(db, admin_id)
