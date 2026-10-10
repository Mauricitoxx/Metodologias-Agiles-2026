# Importar acá cada modelo nuevo para que Alembic lo detecte en las migraciones.
from app.models.actividad import Actividad  # noqa: F401
from app.models.tipo_actividad import TipoActividad  # noqa: F401
from app.models.administrador import Administrador, SesionAdministrador  # noqa: F401
from app.models.manga_comic import MangaComic  # noqa: F401
from app.models.categoria_juego import CategoriaJuego  # noqa: F401
from app.models.dificultad import Dificultad  # noqa: F401
from app.models.juego import Juego, juegos_categorias  # noqa: F401
from app.models.regla import Regla  # noqa: F401
from app.models.producto import Producto  # noqa: F401
