from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoUpdate
from app.services.errors import conflict, field_error, not_found


def listar_productos(db: Session, incluir_inactivos: bool = False) -> list[Producto]:
    """Productos de la carta, agrupados por tipo y ordenados por nombre.

    La carta pública solo ve los activos; el panel de administración pide todos.
    """
    stmt = select(Producto).order_by(Producto.tipo, Producto.nombre)
    if not incluir_inactivos:
        stmt = stmt.where(Producto.activo.is_(True))
    return list(db.scalars(stmt))


def obtener_producto(db: Session, producto_id: int) -> Producto:
    producto = db.get(Producto, producto_id)
    if producto is None:
        raise not_found("Producto no encontrado")
    return producto


def validar_nombre_unico(db: Session, nombre: str, producto_id: int | None = None) -> None:
    """El nombre no se puede repetir en la carta, sin distinguir mayúsculas."""
    stmt = select(Producto.id).where(func.lower(Producto.nombre) == nombre.lower())
    if producto_id is not None:
        stmt = stmt.where(Producto.id != producto_id)
    if db.scalars(stmt).first() is not None:
        raise field_error("nombre", "Ya existe un producto con ese nombre")


def crear_producto(db: Session, datos: ProductoCreate) -> Producto:
    validar_nombre_unico(db, datos.nombre)
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
    validar_nombre_unico(db, datos.nombre, producto_id)

    # Con "precio_oferta" en null se quita la oferta; si no se envía, se conserva
    cambios = datos.model_dump(exclude_unset=True)
    # Sin "activo" (o en null), el producto conserva su estado
    if cambios.get("activo") is None:
        cambios.pop("activo", None)

    # Una oferta conservada tampoco puede quedar igual o por encima del nuevo precio
    precio_oferta = cambios.get("precio_oferta", producto.precio_oferta)
    if precio_oferta is not None and precio_oferta >= datos.precio:
        raise field_error("precio_oferta", "El precio de oferta debe ser menor al precio actual")

    for clave, valor in cambios.items():
        setattr(producto, clave, valor)

    db.commit()
    db.refresh(producto)
    return producto


def dar_de_baja_producto(db: Session, producto_id: int) -> Producto:
    """Baja lógica: el producto deja de mostrarse en la carta pero se conserva."""
    producto = obtener_producto(db, producto_id)
    if not producto.activo:
        raise conflict("El producto ya está dado de baja")

    producto.activo = False
    db.commit()
    db.refresh(producto)
    return producto


def reactivar_producto(db: Session, producto_id: int) -> Producto:
    producto = obtener_producto(db, producto_id)
    if producto.activo:
        raise conflict("El producto ya está activo")

    producto.activo = True
    db.commit()
    db.refresh(producto)
    return producto
