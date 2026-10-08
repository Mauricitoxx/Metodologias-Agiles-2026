from fastapi import APIRouter

from app.api.routes import health

api_router = APIRouter()
api_router.include_router(health.router)

# Registrar acá el router de cada módulo. Ejemplo:
# from app.api.routes import juegos
# api_router.include_router(juegos.router)
