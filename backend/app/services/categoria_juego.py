from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.categoria_juego import CategoriaJuego
from app.models.juego import juegos_categorias
from app.schemas.categoria_juego import CategoriaJuegoCreate, CategoriaJuegoUpdate


def listar_categorias(db: Session) -> list[CategoriaJuego]:
    return list(db.scalars(select(CategoriaJuego).order_by(CategoriaJuego.nombre)))


def obtener_categoria_por_id(db: Session, categoria_id: int) -> CategoriaJuego | None:
    return db.get(CategoriaJuego, categoria_id)


def obtener_categoria_por_nombre(db: Session, nombre: str) -> CategoriaJuego | None:
    nombre_limpio = nombre.strip()
    return db.scalar(
        select(CategoriaJuego).where(func.lower(CategoriaJuego.nombre) == func.lower(nombre_limpio))
    )


def categoria_tiene_juegos(db: Session, categoria_id: int) -> bool:
    total = db.scalar(
        select(func.count())
        .select_from(juegos_categorias)
        .where(juegos_categorias.c.categoria_id == categoria_id)
    ) or 0
    return total > 0


def crear_categoria(db: Session, datos: CategoriaJuegoCreate) -> CategoriaJuego:
    datos_dict = datos.model_dump()
    if "nombre" in datos_dict and isinstance(datos_dict["nombre"], str):
        datos_dict["nombre"] = datos_dict["nombre"].strip()
    categoria = CategoriaJuego(**datos_dict)
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


def actualizar_categoria(
    db: Session, categoria: CategoriaJuego, datos: CategoriaJuegoUpdate
) -> CategoriaJuego:
    datos_dict = datos.model_dump(exclude_unset=True)
    for clave, valor in datos_dict.items():
        if isinstance(valor, str):
            valor = valor.strip()
        setattr(categoria, clave, valor)
    db.commit()
    db.refresh(categoria)
    return categoria


def eliminar_categoria(db: Session, categoria: CategoriaJuego) -> None:
    db.delete(categoria)
    db.commit()
