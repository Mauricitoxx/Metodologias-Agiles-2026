from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoUpdate
from app.services.errors import not_found


def listar_productos(db: Session) -> list[Producto]:
    """Productos activos de la carta, agrupados por tipo y ordenados por nombre."""
    stmt = (
        select(Producto)
        .where(Producto.activo.is_(True))
        .order_by(Producto.tipo, Producto.nombre)
    )
    return list(db.scalars(stmt))


def obtener_producto(db: Session, producto_id: int) -> Producto:
    producto = db.get(Producto, producto_id)
    if producto is None:
        raise not_found("Producto no encontrado")
    return producto


def crear_producto(db: Session, datos: ProductoCreate) -> Producto:
    producto = Producto(**datos.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


def actualizar_producto(
    db: Session,
    producto_id: int,
    datos: ProductoUpdate,
) -> Producto:
    producto = obtener_producto(db, producto_id)

    for clave, valor in datos.model_dump().items():
        setattr(producto, clave, valor)

    db.commit()
    db.refresh(producto)
    return producto
