from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.juego import JuegoCreate, JuegoDetailRead, JuegoRead, JuegoUpdate
from app.schemas.regla import ReglaCreate, ReglaRead
from app.services import categoria_juego as categoria_service
from app.services import dificultad as dificultad_service
from app.services import juego as juego_service
from app.services import regla as regla_service

router = APIRouter(prefix="/juegos", tags=["juegos"])


@router.get("", response_model=list[JuegoRead])
def listar(
    nombre: str | None = Query(None, description="Filtrar por nombre del juego"),
    categoria_id: int | None = Query(None, description="Filtrar por ID de categoría"),
    dificultad_id: int | None = Query(None, description="Filtrar por ID de dificultad"),
    solo_activos: bool = Query(True, description="Mostrar solo juegos activos"),
    db: Session = Depends(get_db),
):
    return juego_service.listar_juegos(
        db=db,
        nombre=nombre,
        categoria_id=categoria_id,
        dificultad_id=dificultad_id,
        solo_activos=solo_activos,
    )


@router.get("/{juego_id}", response_model=JuegoDetailRead)
def obtener(
    juego_id: int,
    incluir_inactivos: bool = Query(
        False, description="Permite consultar juegos dados de baja"
    ),
    db: Session = Depends(get_db),
):
    juego = juego_service.obtener_juego_por_id(
        db=db, juego_id=juego_id, incluir_inactivos=incluir_inactivos
    )
    if not juego:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Juego no encontrado",
        )
    return juego


@router.post("", response_model=JuegoRead, status_code=status.HTTP_201_CREATED)
def crear(datos: JuegoCreate, db: Session = Depends(get_db)):
    if datos.dificultad_id is not None:
        dificultad = dificultad_service.obtener_dificultad_por_id(
            db, datos.dificultad_id
        )
        if not dificultad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La dificultad con id {datos.dificultad_id} no existe",
            )

    if datos.categoria_ids:
        for cat_id in datos.categoria_ids:
            categoria = categoria_service.obtener_categoria_por_id(db, cat_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La categoría con id {cat_id} no existe",
                )

    return juego_service.crear_juego(db=db, datos=datos)


@router.put("/{juego_id}", response_model=JuegoRead)
def actualizar(
    juego_id: int,
    datos: JuegoUpdate,
    db: Session = Depends(get_db),
):
    juego = juego_service.obtener_juego_por_id(
        db=db, juego_id=juego_id, incluir_inactivos=True
    )
    if not juego:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Juego no encontrado",
        )

    if datos.dificultad_id is not None:
        dificultad = dificultad_service.obtener_dificultad_por_id(
            db, datos.dificultad_id
        )
        if not dificultad:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La dificultad con id {datos.dificultad_id} no existe",
            )

    if datos.categoria_ids is not None:
        for cat_id in datos.categoria_ids:
            categoria = categoria_service.obtener_categoria_por_id(db, cat_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La categoría con id {cat_id} no existe",
                )

    return juego_service.actualizar_juego(db=db, juego=juego, datos=datos)


@router.delete("/{juego_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(
    juego_id: int,
    baja_logica: bool = Query(
        True, description="Si es True realiza baja lógica (activo=False)"
    ),
    db: Session = Depends(get_db),
):
    juego = juego_service.obtener_juego_por_id(
        db=db, juego_id=juego_id, incluir_inactivos=True
    )
    if not juego:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Juego no encontrado",
        )

    juego_service.eliminar_juego(db=db, juego=juego, baja_logica=baja_logica)
    return None


@router.get("/{juego_id}/reglas", response_model=list[ReglaRead])
def listar_reglas(juego_id: int, db: Session = Depends(get_db)):
    juego = juego_service.obtener_juego_por_id(
        db=db, juego_id=juego_id, incluir_inactivos=True
    )
    if not juego:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Juego no encontrado",
        )
    return regla_service.listar_reglas_por_juego(db=db, juego_id=juego_id)


@router.post(
    "/{juego_id}/reglas",
    response_model=ReglaRead,
    status_code=status.HTTP_201_CREATED,
)
def crear_regla_para_juego(
    juego_id: int,
    datos: ReglaCreate,
    db: Session = Depends(get_db),
):
    juego = juego_service.obtener_juego_por_id(
        db=db, juego_id=juego_id, incluir_inactivos=True
    )
    if not juego:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Juego no encontrado",
        )
    return regla_service.crear_regla(db=db, datos=datos, juego_id=juego_id)
