from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
#PARA PODER ADMIN QUIEN PUEDE ACCEDER A LOS HTTP
from app.api.routes.auth import get_current_admin

from app.db.session import get_db
from app.schemas.manga_comic import (
    MangaComicCreate,
    MangaComicResponse,
    MangaComicUpdate,
)
from app.services.manga_comic import (
    create_manga_comic,
    deactivate_manga_comic,
    get_manga_comic,
    list_manga_comics,
    list_all_manga_comics,
    reactivate_manga_comic,
    update_manga_comic,
)

router = APIRouter(
    prefix="/mangas-comics",
    tags=["Mangas y cómics"],
)


@router.post(
    "/",
    response_model=MangaComicResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_manga(
    manga_data: MangaComicCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return create_manga_comic(db, manga_data)


@router.get(
    "/",
    response_model=list[MangaComicResponse],
)
def list_mangas(
    db: Session = Depends(get_db),
):
    return list_manga_comics(db)

@router.get(
    "/admin/todos",
    response_model=list[MangaComicResponse],
)
def list_all_mangas_admin(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return list_all_manga_comics(db)


@router.get(
    "/{manga_id}",
    response_model=MangaComicResponse,
)
def get_manga(
    manga_id: int,
    db: Session = Depends(get_db),
):
    return get_manga_comic(db, manga_id)


@router.put(
    "/{manga_id}",
    response_model=MangaComicResponse,
)
def update_manga(
    manga_id: int,
    manga_data: MangaComicUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return update_manga_comic(db, manga_id, manga_data)


@router.patch(
    "/{manga_id}/baja",
    response_model=MangaComicResponse,
)
def deactivate_manga(
    manga_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return deactivate_manga_comic(db, manga_id)

@router.patch(
    "/{manga_id}/reactivar",
    response_model=MangaComicResponse,
)
def reactivate_manga(
    manga_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    return reactivate_manga_comic(db, manga_id)
