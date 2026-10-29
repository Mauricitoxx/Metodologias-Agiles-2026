from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.categoria_juego import CategoriaJuego
from app.models.juego import Juego
from app.schemas.juego import JuegoCreate, JuegoUpdate


def listar_juegos(
    db: Session,
    nombre: str | None = None,
    categoria_id: int | None = None,
    dificultad_id: int | None = None,
    solo_activos: bool = True,
) -> list[Juego]:
    stmt = (
        select(Juego)
        .options(
            joinedload(Juego.dificultad),
            selectinload(Juego.categorias),
        )
        .order_by(Juego.nombre)
    )

    if solo_activos:
        stmt = stmt.where(Juego.activo.is_(True))

    if nombre:
        stmt = stmt.where(Juego.nombre.ilike(f"%{nombre.strip()}%"))

    if categoria_id is not None:
        stmt = stmt.where(Juego.categorias.any(CategoriaJuego.id == categoria_id))

    if dificultad_id is not None:
        stmt = stmt.where(Juego.dificultad_id == dificultad_id)

    return list(db.scalars(stmt).unique())


def obtener_juego_por_id(
    db: Session,
    juego_id: int,
    incluir_inactivos: bool = False,
) -> Juego | None:
    stmt = (
        select(Juego)
        .options(
            joinedload(Juego.dificultad),
            selectinload(Juego.categorias),
            selectinload(Juego.reglas),
        )
        .where(Juego.id == juego_id)
    )

    if not incluir_inactivos:
        stmt = stmt.where(Juego.activo.is_(True))

    return db.scalars(stmt).unique().first()


def crear_juego(db: Session, datos: JuegoCreate) -> Juego:
    datos_dict = datos.model_dump(exclude={"categoria_ids"})
    juego = Juego(**datos_dict)

    if datos.categoria_ids:
        categorias = list(
            db.scalars(
                select(CategoriaJuego).where(
                    CategoriaJuego.id.in_(datos.categoria_ids)
                )
            )
        )
        juego.categorias = categorias

    db.add(juego)
    db.commit()
    db.refresh(juego)

    # Aseguramos cargar las relaciones para serialización
    return obtener_juego_por_id(db, juego.id, incluir_inactivos=True) or juego


def actualizar_juego(
    db: Session,
    juego: Juego,
    datos: JuegoUpdate,
) -> Juego:
    datos_dict = datos.model_dump(exclude_unset=True)

    if "categoria_ids" in datos_dict:
        categoria_ids = datos_dict.pop("categoria_ids")
        if categoria_ids is not None:
            categorias = list(
                db.scalars(
                    select(CategoriaJuego).where(
                        CategoriaJuego.id.in_(categoria_ids)
                    )
                )
            )
            juego.categorias = categorias

    for clave, valor in datos_dict.items():
        setattr(juego, clave, valor)

    db.commit()
    db.refresh(juego)

    return obtener_juego_por_id(db, juego.id, incluir_inactivos=True) or juego


def eliminar_juego(
    db: Session,
    juego: Juego,
    baja_logica: bool = True,
) -> None:
    if baja_logica:
        juego.activo = False
        db.commit()
        db.refresh(juego)
    else:
        db.delete(juego)
        db.commit()
