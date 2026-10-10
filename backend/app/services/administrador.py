from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.administrador import Administrador
from app.schemas.administrador import AdministradorCreate, AdministradorUpdate
from app.services.auth import hash_password


def listar_administradores(db: Session) -> list[Administrador]:
    """Devuelve la lista de todos los administradores ordenados por ID."""
    return list(db.scalars(select(Administrador).order_by(Administrador.id)).all())


def obtener_administrador(db: Session, admin_id: int) -> Administrador:
    """Busca un administrador por ID o lanza 404."""
    admin = db.get(Administrador, admin_id)
    if admin is None:
        raise HTTPException(404, "El administrador solicitado no existe.")
    return admin


def crear_administrador(db: Session, datos: AdministradorCreate) -> Administrador:
    """Crea un nuevo administrador con su contraseña hasheada."""
    existente = db.scalar(select(Administrador).where(Administrador.email == datos.email))
    if existente is not None:
        raise HTTPException(400, "Ya existe un administrador con ese correo electrónico.")

    admin = Administrador(
        nombre=datos.nombre,
        email=datos.email,
        password_hash=hash_password(datos.password),
        activo=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def actualizar_administrador(db: Session, admin_id: int, datos: AdministradorUpdate) -> Administrador:
    """Actualiza los datos de un administrador."""
    admin = obtener_administrador(db, admin_id)

    if datos.email is not None and datos.email != admin.email:
        existente = db.scalar(select(Administrador).where(Administrador.email == datos.email))
        if existente is not None:
            raise HTTPException(400, "Ya existe un administrador con ese correo electrónico.")
        admin.email = datos.email

    if datos.nombre is not None:
        admin.nombre = datos.nombre

    if datos.password is not None:
        admin.password_hash = hash_password(datos.password)

    db.commit()
    db.refresh(admin)
    return admin


def desactivar_administrador(db: Session, admin_id: int, current_admin_id: int | None = None) -> Administrador:
    """Da de baja a un administrador. Impide desactivar al único administrador activo."""
    admin = obtener_administrador(db, admin_id)
    if not admin.activo:
        return admin

    activos_count = db.scalar(select(func.count()).select_from(Administrador).where(Administrador.activo.is_(True)))
    if activos_count <= 1:
        raise HTTPException(400, "No se puede dar de baja al único administrador activo.")

    admin.activo = False
    db.commit()
    db.refresh(admin)
    return admin


def activar_administrador(db: Session, admin_id: int) -> Administrador:
    """Reactiva a un administrador dado de baja."""
    admin = obtener_administrador(db, admin_id)
    admin.activo = True
    db.commit()
    db.refresh(admin)
    return admin
