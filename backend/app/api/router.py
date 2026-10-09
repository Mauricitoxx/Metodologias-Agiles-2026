from fastapi import APIRouter

from app.api.routes import categorias_juego, dificultades, health, juegos, regla

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(juegos.router)
api_router.include_router(categorias_juego.router)
api_router.include_router(dificultades.router)
api_router.include_router(regla.router)

