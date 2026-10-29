from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.regla import Regla
from app.schemas.regla import ReglaCreate, ReglaUpdate


def listar_reglas_por_juego(db: Session, juego_id: int) -> list[Regla]:
    return list(
        db.scalars(
            select(Regla)
            .where(Regla.juego_id == juego_id)
            .order_by(Regla.orden, Regla.id)
        )
    )


def obtener_regla_por_id(db: Session, regla_id: int) -> Regla | None:
    return db.get(Regla, regla_id)


def crear_regla(
    db: Session, datos: ReglaCreate, juego_id: int | None = None
) -> Regla:
    datos_dict = datos.model_dump()
    # Si viene juego_id por parámetro, tiene prioridad sobre el del body
    if juego_id is not None:
        datos_dict["juego_id"] = juego_id
    elif datos_dict.get("juego_id") is None:
        raise ValueError("juego_id es requerido para crear una regla")

    regla = Regla(**datos_dict)
    db.add(regla)
    db.commit()
    db.refresh(regla)
    return regla


def actualizar_regla(
    db: Session, regla: Regla, datos: ReglaUpdate
) -> Regla:
    datos_dict = datos.model_dump(exclude_unset=True)
    for clave, valor in datos_dict.items():
        setattr(regla, clave, valor)
    db.commit()
    db.refresh(regla)
    return regla


def eliminar_regla(db: Session, regla: Regla) -> None:
    db.delete(regla)
    db.commit()
