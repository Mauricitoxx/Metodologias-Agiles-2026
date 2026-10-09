from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.categoria_juego import (
    CategoriaJuegoCreate,
    CategoriaJuegoRead,
    CategoriaJuegoUpdate,
)
from app.services import categoria_juego as categoria_service

router = APIRouter(prefix="/categorias-juego", tags=["categorias-juego"])


@router.get("", response_model=list[CategoriaJuegoRead])
def listar(db: Session = Depends(get_db)):
    return categoria_service.listar_categorias(db)


@router.get("/{categoria_id}", response_model=CategoriaJuegoRead)
def obtener(categoria_id: int, db: Session = Depends(get_db)):
    categoria = categoria_service.obtener_categoria_por_id(db, categoria_id)
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )
    return categoria


@router.post("", response_model=CategoriaJuegoRead, status_code=status.HTTP_201_CREATED)
def crear(datos: CategoriaJuegoCreate, db: Session = Depends(get_db)):
    existente = categoria_service.obtener_categoria_por_nombre(db, datos.nombre)
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una categoría con ese nombre",
        )
    return categoria_service.crear_categoria(db, datos)


@router.put("/{categoria_id}", response_model=CategoriaJuegoRead)
def actualizar(
    categoria_id: int, datos: CategoriaJuegoUpdate, db: Session = Depends(get_db)
):
    categoria = categoria_service.obtener_categoria_por_id(db, categoria_id)
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )
    if datos.nombre:
        existente = categoria_service.obtener_categoria_por_nombre(db, datos.nombre)
        if existente and existente.id != categoria_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una categoría con ese nombre",
            )
    return categoria_service.actualizar_categoria(db, categoria, datos)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(categoria_id: int, db: Session = Depends(get_db)):
    categoria = categoria_service.obtener_categoria_por_id(db, categoria_id)
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )
    categoria_service.eliminar_categoria(db, categoria)
    return None
