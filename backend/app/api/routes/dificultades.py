from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dificultad import DificultadCreate, DificultadRead, DificultadUpdate
from app.services import dificultad as dificultad_service

router = APIRouter(prefix="/dificultades", tags=["dificultades"])


@router.get("", response_model=list[DificultadRead])
def listar(db: Session = Depends(get_db)):
    return dificultad_service.listar_dificultades(db)


@router.get("/{dificultad_id}", response_model=DificultadRead)
def obtener(dificultad_id: int, db: Session = Depends(get_db)):
    dificultad = dificultad_service.obtener_dificultad_por_id(db, dificultad_id)
    if not dificultad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dificultad no encontrada",
        )
    return dificultad


@router.post("", response_model=DificultadRead, status_code=status.HTTP_201_CREATED)
def crear(datos: DificultadCreate, db: Session = Depends(get_db)):
    existente = dificultad_service.obtener_dificultad_por_nombre(db, datos.nombre)
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una dificultad con ese nombre",
        )
    return dificultad_service.crear_dificultad(db, datos)


@router.put("/{dificultad_id}", response_model=DificultadRead)
def actualizar(
    dificultad_id: int, datos: DificultadUpdate, db: Session = Depends(get_db)
):
    dificultad = dificultad_service.obtener_dificultad_por_id(db, dificultad_id)
    if not dificultad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dificultad no encontrada",
        )
    if datos.nombre:
        existente = dificultad_service.obtener_dificultad_por_nombre(db, datos.nombre)
        if existente and existente.id != dificultad_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una dificultad con ese nombre",
            )
    return dificultad_service.actualizar_dificultad(db, dificultad, datos)


@router.delete("/{dificultad_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(dificultad_id: int, db: Session = Depends(get_db)):
    dificultad = dificultad_service.obtener_dificultad_por_id(db, dificultad_id)
    if not dificultad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dificultad no encontrada",
        )
    dificultad_service.eliminar_dificultad(db, dificultad)
    return None
