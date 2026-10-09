# Esquemas Pydantic: definen qué datos entran y salen de la API (un archivo por entidad).
from app.schemas.categoria_juego import (
    CategoriaJuegoBase,
    CategoriaJuegoCreate,
    CategoriaJuegoRead,
    CategoriaJuegoUpdate,
)
from app.schemas.dificultad import (
    DificultadBase,
    DificultadCreate,
    DificultadRead,
    DificultadUpdate,
)
from app.schemas.juego import (
    JuegoBase,
    JuegoCreate,
    JuegoDetailRead,
    JuegoRead,
    JuegoUpdate,
)
from app.schemas.regla import (
    ReglaBase,
    ReglaCreate,
    ReglaRead,
    ReglaUpdate,
)

__all__ = [
    # CategoriaJuego
    "CategoriaJuegoBase",
    "CategoriaJuegoCreate",
    "CategoriaJuegoRead",
    "CategoriaJuegoUpdate",
    # Dificultad
    "DificultadBase",
    "DificultadCreate",
    "DificultadRead",
    "DificultadUpdate",
    # Regla
    "ReglaBase",
    "ReglaCreate",
    "ReglaRead",
    "ReglaUpdate",
    # Juego
    "JuegoBase",
    "JuegoCreate",
    "JuegoRead",
    "JuegoDetailRead",
    "JuegoUpdate",
]
