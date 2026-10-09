"""Crear una cuenta administrativa sin habilitar registro público."""
import argparse
from getpass import getpass

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.administrador import Administrador
from app.schemas.auth import LoginRequest
from app.services.auth import hash_password


def main() -> None:
    parser = argparse.ArgumentParser(description="Crear un administrador de La Frikioteca")
    parser.add_argument("--email", required=True)
    parser.add_argument("--nombre", required=True)
    args = parser.parse_args()
    password = getpass("Contraseña (mínimo 12 caracteres): ")
    if len(password) < 12 or len(password) > 256:
        parser.error("La contraseña debe tener entre 12 y 256 caracteres.")
    if password != getpass("Repetí la contraseña: "):
        parser.error("Las contraseñas no coinciden.")
    nombre = args.nombre.strip()
    if not nombre or len(nombre) > 100:
        parser.error("El nombre debe tener entre 1 y 100 caracteres.")
    datos = LoginRequest(email=args.email, password=password)
    with SessionLocal() as db:
        if db.scalar(select(Administrador).where(Administrador.email == datos.email)):
            parser.error("Ya existe un administrador con ese correo.")
        db.add(Administrador(nombre=nombre, email=datos.email, password_hash=hash_password(password)))
        db.commit()
    print("Administrador creado.")


if __name__ == "__main__":
    main()
