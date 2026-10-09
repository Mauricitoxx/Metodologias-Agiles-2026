# Importar acá cada modelo nuevo para que Alembic lo detecte en las migraciones.
# Ejemplo:
# from app.models.juego import Juego  # noqa: F401
from app.models.actividad import Actividad  # noqa: F401
from app.models.tipo_actividad import TipoActividad  # noqa: F401
from app.models.administrador import Administrador, SesionAdministrador  # noqa: F401
