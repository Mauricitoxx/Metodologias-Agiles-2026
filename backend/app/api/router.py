from fastapi import APIRouter
from app.api.routes import (
    activities,
    activity_types,
    administradores,
    auth,
    categorias_juego,
    dificultades,
    health,
    juegos,
    mangas_comics,
    regla,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(administradores.router)
api_router.include_router(health.router)
api_router.include_router(activities.router)
api_router.include_router(activity_types.router)
api_router.include_router(juegos.router)
api_router.include_router(categorias_juego.router)
api_router.include_router(dificultades.router)
api_router.include_router(regla.router)
api_router.include_router(mangas_comics.router)
api_router.include_router(productos.router)

# Registrar acá el router de cada módulo. Ejemplo:
# from app.api.routes import juegos
# api_router.include_router(juegos.router)
