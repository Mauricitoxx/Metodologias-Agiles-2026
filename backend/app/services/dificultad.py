from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dificultad import Dificultad
from app.schemas.dificultad import DificultadCreate, DificultadUpdate


def listar_dificultades(db: Session) -> list[Dificultad]:
    return list(db.scalars(select(Dificultad).order_by(Dificultad.id)))


def obtener_dificultad_por_id(db: Session, dificultad_id: int) -> Dificultad | None:
    return db.get(Dificultad, dificultad_id)


def obtener_dificultad_por_nombre(db: Session, nombre: str) -> Dificultad | None:
    return db.scalar(select(Dificultad).where(Dificultad.nombre == nombre))


def crear_dificultad(db: Session, datos: DificultadCreate) -> Dificultad:
    dificultad = Dificultad(**datos.model_dump())
    db.add(dificultad)
    db.commit()
    db.refresh(dificultad)
    return dificultad


def actualizar_dificultad(
    db: Session, dificultad: Dificultad, datos: DificultadUpdate
) -> Dificultad:
    datos_dict = datos.model_dump(exclude_unset=True)
    for clave, valor in datos_dict.items():
        setattr(dificultad, clave, valor)
    db.commit()
    db.refresh(dificultad)
    return dificultad


def eliminar_dificultad(db: Session, dificultad: Dificultad) -> None:
    db.delete(dificultad)
    db.commit()
