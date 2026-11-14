from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.categoria_manga_comic import CategoriaMangaComic
from app.models.manga_comic_categoria import MangaComicCategoria
from app.schemas.categoria_manga_comic import (
    CategoriaMangaComicCreate,
    CategoriaMangaComicUpdate,
)


def listar_categorias(db: Session) -> list[CategoriaMangaComic]:
    return list(
        db.scalars(
            select(CategoriaMangaComic).order_by(CategoriaMangaComic.nombre)
        )
    )


def obtener_categoria_por_id(
    db: Session,
    categoria_id: int,
) -> CategoriaMangaComic | None:
    return db.get(CategoriaMangaComic, categoria_id)


def obtener_categoria_por_nombre(
    db: Session,
    nombre: str,
) -> CategoriaMangaComic | None:
    nombre_limpio = nombre.strip()
    return db.scalar(
        select(CategoriaMangaComic).where(
            func.lower(CategoriaMangaComic.nombre) == func.lower(nombre_limpio)
        )
    )


def categoria_tiene_mangas_comics(
    db: Session,
    categoria_id: int,
) -> bool:
    total = db.scalar(
        select(func.count())
        .select_from(MangaComicCategoria)
        .where(MangaComicCategoria.categoria_id == categoria_id)
    ) or 0

    return total > 0


def crear_categoria(
    db: Session,
    datos: CategoriaMangaComicCreate,
) -> CategoriaMangaComic:
    datos_dict = datos.model_dump()
    datos_dict["nombre"] = datos_dict["nombre"].strip()
    datos_dict["descripcion"] = datos_dict["descripcion"].strip()

    categoria = CategoriaMangaComic(**datos_dict)
    db.add(categoria)
    db.commit()
    db.refresh(categoria)

    return categoria


def actualizar_categoria(
    db: Session,
    categoria: CategoriaMangaComic,
    datos: CategoriaMangaComicUpdate,
) -> CategoriaMangaComic:
    datos_dict = datos.model_dump(exclude_unset=True)

    for clave, valor in datos_dict.items():
        if isinstance(valor, str):
            valor = valor.strip()
        setattr(categoria, clave, valor)

    db.commit()
    db.refresh(categoria)

    return categoria


def eliminar_categoria(
    db: Session,
    categoria: CategoriaMangaComic,
) -> None:
    db.delete(categoria)
    db.commit()