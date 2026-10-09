import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.administrador import Administrador, SesionAdministrador
from app.schemas.auth import LoginRequest


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    return f"scrypt${salt}${digest}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, salt, digest = encoded.split("$")
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
        return hmac.compare_digest(actual, digest)
    except (ValueError, TypeError):
        return False


# Igual costo de verificación aunque el correo no exista.
_DUMMY_HASH = hash_password(secrets.token_urlsafe(32))


def _unauthorized() -> HTTPException:
    return HTTPException(401, "Correo o contraseña incorrectos, o sesión vencida.", headers={"WWW-Authenticate": "Bearer"})


def iniciar_sesion(db: Session, datos: LoginRequest) -> tuple[str, Administrador]:
    admin = db.scalar(select(Administrador).where(Administrador.email == datos.email))
    valid = verify_password(datos.password, admin.password_hash if admin else _DUMMY_HASH)
    if not valid or admin is None or not admin.activo:
        raise _unauthorized()
    token = secrets.token_urlsafe(32)
    db.add(SesionAdministrador(
        token_hash=hashlib.sha256(token.encode()).hexdigest(),
        administrador_id=admin.id,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=settings.auth_session_minutes),
    ))
    db.commit()
    return token, admin


def obtener_sesion(db: Session, token: str) -> tuple[SesionAdministrador, Administrador]:
    session = db.get(SesionAdministrador, hashlib.sha256(token.encode()).hexdigest())
    if session is None or session.expires_at <= datetime.now(timezone.utc).replace(tzinfo=None):
        raise _unauthorized()
    admin = db.get(Administrador, session.administrador_id)
    if admin is None or not admin.activo:
        raise _unauthorized()
    return session, admin


def cerrar_sesion(db: Session, token: str) -> None:
    session, _ = obtener_sesion(db, token)
    db.delete(session)
    db.commit()
