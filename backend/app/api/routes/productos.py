from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.routes.auth import get_current_admin
from app.db.session import get_db
from app.schemas.producto import ProductoCreate, ProductoRead, ProductoUpdate
from app.services import producto as producto_service

router = APIRouter(prefix="/productos", tags=["productos"])


@router.get("", response_model=list[ProductoRead])
def listar(db: Session = Depends(get_db)):
    return producto_service.listar_productos(db)


# --- Endpoints de administración ---
ADMIN_ONLY = [Depends(get_current_admin)]


@router.get("/{producto_id}", response_model=ProductoRead, dependencies=ADMIN_ONLY)
def obtener(producto_id: int, db: Session = Depends(get_db)):
    return producto_service.obtener_producto(db, producto_id)


@router.post(
    "",
    response_model=ProductoRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=ADMIN_ONLY,
)
def crear(datos: ProductoCreate, db: Session = Depends(get_db)):
    return producto_service.crear_producto(db, datos)


@router.put("/{producto_id}", response_model=ProductoRead, dependencies=ADMIN_ONLY)
def actualizar(
    producto_id: int,
    datos: ProductoUpdate,
    db: Session = Depends(get_db),
):
    return producto_service.actualizar_producto(db, producto_id, datos)
