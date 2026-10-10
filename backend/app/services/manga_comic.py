from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.manga_comic import MangaComic
from app.schemas.manga_comic import MangaComicCreate, MangaComicUpdate

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
        #si detecta un duplicado, devuelve un error 409
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Ya existe un registro activo con ese título y tomo. "
                "Podés sumar las copias al registro existente."
            ),
        )
    #si no existe crea el objeto con los datos recibidos
    manga = MangaComic(**manga_data.model_dump())
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

    existing = (
        db.query(MangaComic)
        .filter(
            MangaComic.title == manga_data.title,
            MangaComic.volume_number == manga_data.volume_number,
            MangaComic.is_active.is_(True),
            #Comprobamos que no exista otro registro activo con esos datos
            MangaComic.id != manga_id,
        )
        .first()
    )
    #validación anticipada
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Ya existe otro registro activo con ese título y tomo. "
                "Podés sumar las copias al registro existente."
            ),
        )
    #recorro los campos recibidos y actualizo sus valores 
    for field, value in manga_data.model_dump().items():
        setattr(manga, field, value)

    try:
        db.commit()
        db.refresh(manga)
    #proteccion adicional
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
#Agrego esta funcion solo para el admin 
def list_all_manga_comics(db: Session) -> list[MangaComic]:
    """Devuelve todos los mangas y cómics, activos e inactivos, para administración."""
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
    # Si no existe o ya está inactivo, se conserva el 404.
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

