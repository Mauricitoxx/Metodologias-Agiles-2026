from fastapi import APIRouter, Depends, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import AdministradorRead, LoginRequest, LoginResponse
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["seguridad"])
bearer = HTTPBearer()


def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    """Dependencia reutilizable para proteger futuros endpoints de gestión."""
    return auth_service.obtener_sesion(db, credentials.credentials)[1]


@router.post("/login", response_model=LoginResponse)
def login(datos: LoginRequest, response: Response, db: Session = Depends(get_db)):
    token, admin = auth_service.iniciar_sesion(db, datos)
    response.headers["Cache-Control"] = "no-store"
    return LoginResponse(access_token=token, administrador=AdministradorRead.model_validate(admin))


@router.get("/me", response_model=AdministradorRead)
def me(admin=Depends(get_current_admin)):
    return admin


@router.post("/logout", status_code=204)
def logout(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    auth_service.cerrar_sesion(db, credentials.credentials)
