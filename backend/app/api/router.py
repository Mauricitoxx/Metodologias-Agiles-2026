from fastapi import APIRouter
from app.api.routes import auth, health, activities, activity_types, health, mangas_comics, categorias_juego, dificultades, juegos, regla,

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(health.router)
api_router.include_router(activities.router)
api_router.include_router(activity_types.router)
api_router.include_router(juegos.router)
api_router.include_router(categorias_juego.router)
api_router.include_router(dificultades.router)
api_router.include_router(regla.router)
api_router.include_router(mangas_comics.router)

# Registrar acá el router de cada módulo. Ejemplo:
# from app.api.routes import juegos
# api_router.include_router(juegos.router)