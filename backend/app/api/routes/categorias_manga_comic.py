from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.categoria_manga_comic import (
    CategoriaMangaComicCreate,
    CategoriaMangaComicRead,
    CategoriaMangaComicUpdate,
)
from app.services import categoria_manga_comic as categoria_service


router = APIRouter(
    prefix="/categorias-manga-comic",
    tags=["categorias-manga-comic"],
)


@router.get("", response_model=list[CategoriaMangaComicRead])
def listar(db: Session = Depends(get_db)):
    return categoria_service.listar_categorias(db)


@router.get("/{categoria_id}", response_model=CategoriaMangaComicRead)
def obtener(categoria_id: int, db: Session = Depends(get_db)):
    categoria = categoria_service.obtener_categoria_por_id(db, categoria_id)

    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )

    return categoria


@router.post(
    "",
    response_model=CategoriaMangaComicRead,
    status_code=status.HTTP_201_CREATED,
)
def crear(datos: CategoriaMangaComicCreate, db: Session = Depends(get_db)):
    existente = categoria_service.obtener_categoria_por_nombre(db, datos.nombre)

    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una categoría con ese nombre",
        )

    return categoria_service.crear_categoria(db, datos)


@router.put("/{categoria_id}", response_model=CategoriaMangaComicRead)
def actualizar(
    categoria_id: int,
    datos: CategoriaMangaComicUpdate,
    db: Session = Depends(get_db),
):
    categoria = categoria_service.obtener_categoria_por_id(db, categoria_id)

    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )

    if datos.nombre:
        existente = categoria_service.obtener_categoria_por_nombre(
            db,
            datos.nombre,
        )
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

    if categoria_service.categoria_tiene_mangas_comics(db, categoria_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar esta categoría porque hay mangas o cómics usándola",
        )

    categoria_service.eliminar_categoria(db, categoria)
    return None