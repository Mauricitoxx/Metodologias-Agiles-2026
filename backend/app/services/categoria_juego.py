from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.categoria_juego import CategoriaJuego
from app.schemas.categoria_juego import CategoriaJuegoCreate, CategoriaJuegoUpdate


def listar_categorias(db: Session) -> list[CategoriaJuego]:
    return list(db.scalars(select(CategoriaJuego).order_by(CategoriaJuego.nombre)))


def obtener_categoria_por_id(db: Session, categoria_id: int) -> CategoriaJuego | None:
    return db.get(CategoriaJuego, categoria_id)


def obtener_categoria_por_nombre(db: Session, nombre: str) -> CategoriaJuego | None:
    return db.scalar(select(CategoriaJuego).where(CategoriaJuego.nombre == nombre))


def crear_categoria(db: Session, datos: CategoriaJuegoCreate) -> CategoriaJuego:
    categoria = CategoriaJuego(**datos.model_dump())
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


def actualizar_categoria(
    db: Session, categoria: CategoriaJuego, datos: CategoriaJuegoUpdate
) -> CategoriaJuego:
    datos_dict = datos.model_dump(exclude_unset=True)
    for clave, valor in datos_dict.items():
        setattr(categoria, clave, valor)
    db.commit()
    db.refresh(categoria)
    return categoria


def eliminar_categoria(db: Session, categoria: CategoriaJuego) -> None:
    db.delete(categoria)
    db.commit()
