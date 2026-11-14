from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.manga_comic import MangaComic
from app.models.categoria_manga_comic import CategoriaMangaComic
from app.schemas.manga_comic import MangaComicCreate, MangaComicUpdate


def obtener_categorias(
    db: Session,
    categorias_ids: list[int],
) -> list[CategoriaMangaComic]:
    """Valida y obtiene todas las categorías seleccionadas."""
    categorias = (
        db.query(CategoriaMangaComic)
        .filter(CategoriaMangaComic.id.in_(categorias_ids))
        .all()
    )

    if len(categorias) != len(categorias_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Una o más categorías seleccionadas no existen.",
        )

    return categorias


def create_manga_comic(
    db: Session,
    manga_data: MangaComicCreate,
) -> MangaComic:
    existing = (
        db.query(MangaComic)
        .filter(
            MangaComic.title == manga_data.title,
            MangaComic.volume_number == manga_data.volume_number,
            MangaComic.is_active.is_(True),
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Ya existe un registro activo con ese título y tomo. "
                "Podés sumar las copias al registro existente."
            ),
        )

    categorias = obtener_categorias(db, manga_data.categorias_ids)

    datos = manga_data.model_dump(exclude={"categorias_ids"})
    manga = MangaComic(**datos)
    manga.categorias = categorias

    db.add(manga)

    try:
        db.commit()
        db.refresh(manga)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se pudo registrar el manga o cómic porque "
                "ya existe un registro con ese título y tomo activo. "
                "Podés sumar las copias al registro existente."
            ),
        )
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al guardar los datos. Intentá nuevamente.",
        )

    return manga


def update_manga_comic(
    db: Session,
    manga_id: int,
    manga_data: MangaComicUpdate,
) -> MangaComic:
    manga = (
        db.query(MangaComic)
        .filter(
            MangaComic.id == manga_id,
            MangaComic.is_active.is_(True),
        )
        .first()
    )

    if manga is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró un manga o cómic activo con ese ID.",
        )

    categorias = obtener_categorias(db, manga_data.categorias_ids)

    existing = (
        db.query(MangaComic)
        .filter(
            MangaComic.title == manga_data.title,
            MangaComic.volume_number == manga_data.volume_number,
            MangaComic.is_active.is_(True),
            MangaComic.id != manga_id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Ya existe otro registro activo con ese título y tomo. "
                "Podés sumar las copias al registro existente."
            ),
        )

    datos = manga_data.model_dump(exclude={"categorias_ids"})

    for field, value in datos.items():
        setattr(manga, field, value)

    # Reemplaza las asociaciones anteriores por las seleccionadas.
    manga.categorias = categorias

    try:
        db.commit()
        db.refresh(manga)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se pudo modificar el registro porque "
                "la combinación de título y tomo ya existe."
            ),
        )
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al guardar los datos. Intentá nuevamente.",
        )

    return manga


def list_manga_comics(db: Session) -> list[MangaComic]:
    """Devuelve los mangas y cómics activos para el catálogo."""
    return (
        db.query(MangaComic)
        .filter(MangaComic.is_active.is_(True))
        .order_by(MangaComic.title, MangaComic.volume_number)
        .all()
    )


def list_all_manga_comics(db: Session) -> list[MangaComic]:
    """Devuelve todos los mangas y cómics para administración."""
    return (
        db.query(MangaComic)
        .order_by(MangaComic.title, MangaComic.volume_number)
        .all()
    )


def get_manga_comic(
    db: Session,
    manga_id: int,
) -> MangaComic:
    """Busca un manga o cómic activo por su ID."""
    manga = (
        db.query(MangaComic)
        .filter(
            MangaComic.id == manga_id,
            MangaComic.is_active.is_(True),
        )
        .first()
    )

    if manga is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró un manga o cómic activo con ese ID.",
        )

    return manga


def deactivate_manga_comic(
    db: Session,
    manga_id: int,
) -> MangaComic:
    """Da de baja lógicamente un manga o cómic."""
    manga = get_manga_comic(db, manga_id)
    manga.is_active = False

    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo dar de baja el registro. Intentá nuevamente.",
        )

    return manga


def reactivate_manga_comic(
    db: Session,
    manga_id: int,
) -> MangaComic:
    """Reactiva un manga o cómic dado de baja."""
    manga = (
        db.query(MangaComic)
        .filter(MangaComic.id == manga_id)
        .first()
    )

    if manga is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró un manga o cómic con ese ID.",
        )

    if manga.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El manga o cómic ya se encuentra activo.",
        )

    manga.is_active = True

    try:
        db.commit()
        db.refresh(manga)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se puede reactivar porque ya existe "
                "un registro activo con ese título y tomo."
            ),
        )
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo reactivar el registro. Intentá nuevamente.",
        )

    return manga