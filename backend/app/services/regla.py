from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.regla import Regla
from app.schemas.regla import ReglaCreate, ReglaReorderItem, ReglaUpdate


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


def obtener_regla_por_titulo(
    db: Session, juego_id: int, titulo: str
) -> Regla | None:
    titulo_limpio = titulo.strip().lower()
    return db.scalars(
        select(Regla).where(
            Regla.juego_id == juego_id,
            func.lower(Regla.titulo) == titulo_limpio,
        )
    ).first()


def crear_regla(
    db: Session, datos: ReglaCreate, juego_id: int | None = None
) -> Regla:
    datos_dict = datos.model_dump()
    if juego_id is not None:
        datos_dict["juego_id"] = juego_id
    elif datos_dict.get("juego_id") is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="juego_id es requerido para crear una regla",
        )

    # Validar que el cuerpo no esté vacío
    contenido = datos_dict.get("contenido")
    if not contenido or not str(contenido).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El cuerpo del texto no puede estar vacío. Debe completar la información",
        )

    # Validar que el título no esté vacío
    titulo = datos_dict.get("titulo")
    if not titulo or not str(titulo).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El título no puede estar vacío. Debe completar la información",
        )

    # Validar unicidad del título para este juego
    existente = obtener_regla_por_titulo(db, datos_dict["juego_id"], titulo)
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede haber dos secciones con el mismo título",
        )

    datos_dict["titulo"] = titulo.strip()
    datos_dict["contenido"] = contenido.strip()

    regla = Regla(**datos_dict)
    db.add(regla)
    try:
        db.commit()
        db.refresh(regla)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede haber dos secciones con el mismo título",
        )
    return regla


def actualizar_regla(
    db: Session, regla: Regla, datos: ReglaUpdate
) -> Regla:
    datos_dict = datos.model_dump(exclude_unset=True)

    if "contenido" in datos_dict:
        contenido = datos_dict["contenido"]
        if contenido is None or not str(contenido).strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El cuerpo del texto no puede estar vacío. Debe completar la información",
            )
        datos_dict["contenido"] = str(contenido).strip()

    if "titulo" in datos_dict:
        titulo = datos_dict["titulo"]
        if titulo is None or not str(titulo).strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El título no puede estar vacío. Debe completar la información",
            )
        titulo_limpio = str(titulo).strip()
        existente = obtener_regla_por_titulo(db, regla.juego_id, titulo_limpio)
        if existente and existente.id != regla.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puede haber dos secciones con el mismo título",
            )
        datos_dict["titulo"] = titulo_limpio

    for clave, valor in datos_dict.items():
        setattr(regla, clave, valor)

    try:
        db.commit()
        db.refresh(regla)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede haber dos secciones con el mismo título",
        )
    return regla


def reordenar_reglas(
    db: Session, juego_id: int, items: list[ReglaReorderItem]
) -> list[Regla]:
    for item in items:
        regla = db.get(Regla, item.id)
        if regla and regla.juego_id == juego_id:
            regla.orden = item.orden
    db.commit()
    return listar_reglas_por_juego(db, juego_id)


def eliminar_regla(db: Session, regla: Regla) -> None:
    db.delete(regla)
    db.commit()
