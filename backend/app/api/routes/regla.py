from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.regla import ReglaCreate, ReglaRead, ReglaUpdate
from app.services import juego as juego_service
from app.services import regla as regla_service

router = APIRouter(prefix="/reglas", tags=["reglas"])


@router.get("/{regla_id}", response_model=ReglaRead)
def obtener(regla_id: int, db: Session = Depends(get_db)):
    regla = regla_service.obtener_regla_por_id(db, regla_id)
    if not regla:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regla no encontrada",
        )
    return regla


@router.post("", response_model=ReglaRead, status_code=status.HTTP_201_CREATED)
def crear(datos: ReglaCreate, db: Session = Depends(get_db)):
    if datos.juego_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="juego_id es requerido para crear una regla",
        )
    juego = juego_service.obtener_juego_por_id(
        db, datos.juego_id, incluir_inactivos=True
    )
    if not juego:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El juego asociado no existe",
        )
    return regla_service.crear_regla(db, datos)


@router.put("/{regla_id}", response_model=ReglaRead)
def actualizar(
    regla_id: int, datos: ReglaUpdate, db: Session = Depends(get_db)
):
    regla = regla_service.obtener_regla_por_id(db, regla_id)
    if not regla:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regla no encontrada",
        )
    return regla_service.actualizar_regla(db, regla, datos)


@router.delete("/{regla_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(regla_id: int, db: Session = Depends(get_db)):
    regla = regla_service.obtener_regla_por_id(db, regla_id)
    if not regla:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Regla no encontrada",
        )
    regla_service.eliminar_regla(db, regla)
    return None
