# Backend — La Frikioteca API

API REST hecha con **FastAPI** y **SQLAlchemy**. En desarrollo local usa **SQLite** (no hay que instalar nada para la base); más adelante se migrará a otra base de datos cambiando solo una variable de entorno.

| Herramienta       | Para qué se usa                                   |
| ----------------- | ------------------------------------------------- |
| FastAPI + Uvicorn | Framework de la API y servidor de desarrollo      |
| SQLAlchemy        | ORM: modelos y acceso a la base                   |
| SQLite            | Base de datos local (archivo `frikioteca.db`)     |
| Alembic           | Migraciones: versionar los cambios de la base     |
| pydantic-settings | Leer la configuración desde el archivo `.env`     |
| pytest            | Tests                                             |

---

## Requisitos

- **Python 3.11 o superior** (`python --version`)
- Git

---

## Levantar el backend por primera vez

Todos los comandos se ejecutan **dentro de la carpeta `backend/`**.

### 1. Crear y activar el entorno virtual

```powershell
cd backend
python -m venv venv
```

Activarlo:

| Sistema               | Comando                       |
| --------------------- | ----------------------------- |
| Windows (PowerShell)  | `venv\Scripts\activate`       |
| Windows (Git Bash)    | `source venv/Scripts/activate` |
| macOS / Linux         | `source venv/bin/activate`    |

Cuando está activo, el prompt empieza con `(venv)`. **Hay que activarlo cada vez que se abre una terminal nueva.**

### 2. Instalar las dependencias

```powershell
pip install -r requirements.txt
```

### 3. Crear el archivo `.env`

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux / Git Bash
cp .env.example .env
```

Los valores por defecto sirven para desarrollo local; no hace falta cambiar nada. El `.env` **no se sube a git** (cada uno tiene el suyo).

### 4. Crear las tablas de la base

```powershell
alembic upgrade head
```

Esto crea `frikioteca.db` (si no existe) y aplica todas las migraciones. El archivo `.db` tampoco se sube a git.

### 5. Levantar la API

```powershell
uvicorn app.main:app --reload
```

| URL                                    | Qué hay                                         |
| -------------------------------------- | ----------------------------------------------- |
| http://127.0.0.1:8000/docs             | Documentación interactiva (Swagger): probar endpoints |
| http://127.0.0.1:8000/api/health       | Estado de la API → `{"status": "ok"}`           |
| http://127.0.0.1:8000/api/health/db    | Estado de la base → `{"status": "ok", "database": "ok"}` |

`--reload` reinicia el servidor al guardar un archivo `.py`. Para cortarlo: `Ctrl + C`.

---

## Día a día

Cada vez que hagas `git pull` de `main` (o actualices tu rama):

```powershell
venv\Scripts\activate          # si la terminal es nueva
pip install -r requirements.txt  # por si alguien agregó dependencias
alembic upgrade head             # por si alguien agregó migraciones
uvicorn app.main:app --reload
```

---

## Variables de entorno (`.env`)

| Variable       | Valor por defecto                                   | Descripción                                   |
| -------------- | --------------------------------------------------- | --------------------------------------------- |
| `APP_NAME`     | `La Frikioteca API`                                 | Título que aparece en `/docs`                 |
| `ENVIRONMENT`  | `development`                                       | Entorno de ejecución                          |
| `DATABASE_URL` | `sqlite:///./frikioteca.db`                         | Conexión a la base de datos                   |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173`       | Orígenes que pueden llamar a la API (el frontend de Vite), separados por coma |
| `AUTH_SESSION_MINUTES` | `480` | Duración de las sesiones administrativas (1 a 10080 minutos) |

Si agregás una variable nueva: sumala a `app/core/config.py` **y** a `.env.example`, y avisá al equipo para que la copien en su `.env`.

---

## Estructura

### Módulo de autenticación

El login sigue el flujo **ruta → servicio → modelo/base → esquema**. Las tablas `administradores` y `sesiones_administradores` se crean con Alembic; las contraseñas usan scrypt con sal aleatoria y la base guarda únicamente el hash SHA-256 del token de sesión.

Configurá una `DATABASE_URL` válida en tu `.env` (por ejemplo, `sqlite:///./frikioteca.db` para desarrollo local). Después de `alembic upgrade head`, creá la primera cuenta desde `backend/`:

```powershell
python -m app.create_admin --email admin@frikioteca.test --nombre "Administrador"
```

El comando solicita y confirma una contraseña de 12 a 256 caracteres sin mostrarla en pantalla. No incluye cuentas o contraseñas predeterminadas ni un endpoint de registro público.

| Endpoint | Función |
| -------- | ------- |
| `POST /api/auth/login` | Recibe JSON `email` y `password`; devuelve token Bearer y datos del administrador |
| `GET /api/auth/me` | Valida la sesión y devuelve el administrador activo |
| `POST /api/auth/logout` | Invalida la sesión actual; responde 204 |

Para los endpoints privados de los próximos módulos, usá `Depends(get_current_admin)` desde `app.api.routes.auth`. Las sesiones vencidas, revocadas o de administradores inactivos se rechazan. La autorización de roles y la recuperación automática por correo quedan para sus respectivos módulos.

Tests del módulo: `pytest tests/test_auth.py`. La migración inicial de este clon crea únicamente las tablas de autenticación.

Organización **por capas**: cada módulo funcional (juegos, carta, actividades, mangas, usuarios) aporta un archivo en cada capa.

```text
backend/
├── app/
│   ├── main.py              # Crea la app, configura CORS y monta todo bajo /api
│   ├── core/
│   │   └── config.py        # Lee el .env
│   ├── db/
│   │   ├── base.py          # Base de la que heredan todos los modelos
│   │   └── session.py       # Conexión a la base y dependencia get_db()
│   ├── api/
│   │   ├── router.py        # ⚠ Compartido: registra el router de cada módulo
│   │   └── routes/          # Endpoints (un archivo por módulo)
│   ├── models/              # Tablas SQLAlchemy (un archivo por entidad)
│   │   └── __init__.py      # ⚠ Compartido: importa cada modelo para Alembic
│   ├── schemas/             # Esquemas Pydantic: qué entra y sale de la API
│   └── services/            # Lógica de negocio
├── alembic/
│   ├── env.py               # Conecta Alembic con la app (no hace falta tocarlo)
│   └── versions/            # Migraciones (se suben a git)
├── tests/
│   ├── conftest.py          # Fixtures: base en memoria y cliente de pruebas
│   └── test_*.py
├── alembic.ini
├── pytest.ini
├── requirements.txt
└── .env.example
```

Flujo de un pedido: **ruta → servicio → modelo/base**, y la respuesta sale con un **esquema**. Las rutas no tienen lógica de negocio: reciben el pedido, llaman al servicio y devuelven el resultado.

---

## Cómo agregar un módulo (ejemplo: Juegos)

### 0. Crear tu rama desde `main` actualizado

```powershell
git checkout main
git pull
git checkout -b feat/juegos
```

### 1. Modelo — `app/models/juego.py`

```python
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Juego(Base):
    __tablename__ = "juegos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    activo: Mapped[bool] = mapped_column(default=True)
```

Y registrarlo en **`app/models/__init__.py`** (si no, Alembic no lo ve):

```python
from app.models.juego import Juego  # noqa: F401
```

### 2. Esquemas — `app/schemas/juego.py`

```python
from pydantic import BaseModel, ConfigDict


class JuegoCreate(BaseModel):
    nombre: str


class JuegoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    activo: bool
```

`from_attributes=True` permite devolver directamente un objeto del modelo y que FastAPI lo convierta a JSON.

### 3. Servicio — `app/services/juego.py`

```python
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.juego import Juego
from app.schemas.juego import JuegoCreate


def listar_juegos(db: Session) -> list[Juego]:
    return list(db.scalars(select(Juego).where(Juego.activo)))


def crear_juego(db: Session, datos: JuegoCreate) -> Juego:
    juego = Juego(**datos.model_dump())
    db.add(juego)
    db.commit()
    db.refresh(juego)
    return juego
```

### 4. Rutas — `app/api/routes/juegos.py`

```python
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.juego import JuegoCreate, JuegoRead
from app.services import juego as juego_service

router = APIRouter(prefix="/juegos", tags=["juegos"])


@router.get("", response_model=list[JuegoRead])
def listar(db: Session = Depends(get_db)):
    return juego_service.listar_juegos(db)


@router.post("", response_model=JuegoRead, status_code=status.HTTP_201_CREATED)
def crear(datos: JuegoCreate, db: Session = Depends(get_db)):
    return juego_service.crear_juego(db, datos)
```

Y registrarlo en **`app/api/router.py`**:

```python
from app.api.routes import juegos

api_router.include_router(juegos.router)
```

Los endpoints quedan en `/api/juegos` y aparecen en `/docs`.

### 5. Migración

```powershell
alembic revision --autogenerate -m "crear tabla juegos"
alembic upgrade head
```

**Revisá el archivo generado en `alembic/versions/`** antes de commitearlo (ver [Migraciones](#migraciones)).

### 6. Test — `tests/test_juegos.py`

```python
from fastapi.testclient import TestClient


def test_crear_y_listar_juegos(client: TestClient):
    response = client.post("/api/juegos", json={"nombre": "Catan"})
    assert response.status_code == 201

    juegos = client.get("/api/juegos").json()
    assert [j["nombre"] for j in juegos] == ["Catan"]
```

```powershell
pytest
```

### 7. Subir los cambios

Commitear el modelo, esquema, servicio, ruta, test, **la migración** y los dos archivos compartidos, y abrir un PR a `main`.

---

## Módulos implementados

### Actividades (HU-15 y HU-16)

| Capa      | Archivos                                                                 |
| --------- | ------------------------------------------------------------------------ |
| Modelos   | `models/actividad.py` (`Actividad`), `models/tipo_actividad.py` (`TipoActividad`) |
| Esquemas  | `schemas/actividad.py`, `schemas/tipo_actividad.py`                      |
| Servicios | `services/activity.py`, `services/activity_type.py`, `services/recurrence.py` |
| Rutas     | `api/routes/activities.py`, `api/routes/activity_types.py`               |
| Tests     | `tests/test_activities.py`, `tests/test_activity_types.py`, `tests/test_recurrence.py` |

**Endpoints**

| Método | Ruta                                  | Acceso  | Descripción                                             |
| ------ | ------------------------------------- | ------- | ------------------------------------------------------- |
| GET    | `/api/activities/schedule`            | Público | Cronograma: próximas actividades (`search`, `tipo_id`)  |
| GET    | `/api/activities/schedule/{id}`       | Público | Detalle (404 si está inactiva)                          |
| GET    | `/api/activities`                     | Admin   | Listado completo (`search`, `tipo_id`, `estado`, `order=asc\|desc`, `date_from`, `date_to`) |
| GET    | `/api/activities/{id}`                | Admin   | Detalle                                                 |
| POST   | `/api/activities`                     | Admin   | Alta                                                    |
| PUT    | `/api/activities/{id}`                | Admin   | Modificación (si no se envía `estado`, se conserva; cambiar la fecha la posterga) |
| PATCH  | `/api/activities/{id}/cancel`         | Admin   | Cancelar (body opcional: `motivo`, `alcance`)           |
| PATCH  | `/api/activities/{id}/postpone`       | Admin   | Postergar (`fecha_hora_postergada`, `motivo`, `alcance`) |
| PATCH  | `/api/activities/{id}/undo-postpone`  | Admin   | Volver a la fecha original                              |
| PATCH  | `/api/activities/{id}/deactivate`     | Admin   | Inactivar (los clientes dejan de verla)                 |
| PATCH  | `/api/activities/{id}/activate`       | Admin   | Reactivar una inactiva o cancelada                      |
| DELETE | `/api/activities/{id}`                | Admin   | Eliminación física                                      |
| GET    | `/api/activity-types`                 | Público | Tipos de actividad                                      |
| POST   | `/api/activity-types`                 | Admin   | Nuevo tipo (nombre único, sin distinguir mayúsculas)    |
| PUT    | `/api/activity-types/{id}`            | Admin   | Renombrar tipo                                          |
| DELETE | `/api/activity-types/{id}`            | Admin   | Eliminar tipo (409 si alguna actividad lo usa)          |

**Reglas de negocio**

- Todos los campos son obligatorios; la fecha debe ser futura al crear, y al editar solo si se cambia.
- Estados: al crear se elige `activa` o `inactiva`; al editar, `activa`, `cancelada` o `inactiva`. `postergada` nunca se elige: resulta de cambiar la fecha.
- Transiciones (`STATUS_TRANSITIONS` en `services/activity.py`): se cancela una activa o postergada; se inactiva cualquiera; se reactiva una inactiva o cancelada (vuelve como `postergada` si conservaba fecha postergada).
- Al postergar (o cambiar la fecha al editar) se conserva la fecha original y la nueva queda en `fecha_hora_postergada`; volver a la fecha original deshace la postergación. En una `inactiva` sin fecha postergada la fecha simplemente se reemplaza. Las listas ordenan por la fecha efectiva.
- `motivo` (opcional, lo ve el cliente) y `alcance` (`fecha` o `serie`, solo en recurrentes) describen la última cancelación o postergación; se borran cuando la actividad vuelve a `activa`.
- El cronograma público oculta las `inactiva` y las que ya terminaron; las `cancelada` se muestran para que el cliente lo vea.
- **Recurrentes:** antes de cada lectura, las actividades `semanal`/`quincenal` terminadas pasan a la próxima fecha (mismo día y hora) y las `mensual` al mismo N-ésimo día de la semana del mes siguiente (el 5.º pasa a ser el último). Una postergada con alcance `fecha` vuelve a su día habitual; con alcance `serie`, las próximas fechas se calculan desde la nueva. Una cancelada con alcance `fecha` saltea esa fecha y sigue; con alcance `serie` (o sin alcance) la serie se detiene.
- Los errores 422 propios (`services/errors.py`) usan el mismo formato que los de validación de FastAPI, así el frontend los muestra en el campo correspondiente.

> ⚠ **Pendiente (HU-01):** los endpoints de admin dependen de `require_admin` (`app/api/deps.py`), que por ahora deja pasar todo. Cuando exista el login, solo hay que implementar esa función.

---

## Migraciones

Alembic guarda cada cambio de la base como un archivo en `alembic/versions/`. Así todos tienen la misma estructura de base sin borrarla ni recrearla a mano.

| Comando                                         | Qué hace                                                  |
| ----------------------------------------------- | --------------------------------------------------------- |
| `alembic revision --autogenerate -m "mensaje"`  | Compara los modelos con la base y genera una migración    |
| `alembic upgrade head`                          | Aplica todas las migraciones pendientes                   |
| `alembic downgrade -1`                          | Deshace la última migración                               |
| `alembic current`                               | Muestra en qué migración está tu base                     |
| `alembic history`                               | Lista todas las migraciones                               |
| `alembic check`                                 | Verifica que los modelos y las migraciones coincidan      |

Reglas para el equipo:

- **Revisar siempre el archivo autogenerado.** Alembic no detecta todo: por ejemplo, renombrar una columna lo interpreta como borrar una y crear otra (se pierden los datos).
- **No modificar una migración que ya está en `main`.** Si hay que corregir algo, se crea una migración nueva.
- **Si dos personas crean migraciones en paralelo**, al juntar las ramas `alembic upgrade head` avisa que hay varias "heads". Se resuelve con:
  ```powershell
  alembic merge heads -m "merge migraciones"
  alembic upgrade head
  ```
- **Si tu base local quedó inconsistente**, se puede borrar `frikioteca.db` y correr `alembic upgrade head` (se pierden los datos locales).

---

## Tests

```powershell
pytest       # resumen
pytest -v    # detalle por test
```

Los tests usan una **base SQLite en memoria** (definida en `tests/conftest.py`): no tocan `frikioteca.db` y cada test arranca con las tablas vacías. Para probar endpoints, alcanza con pedir el fixture `client`:

```python
def test_algo(client):
    response = client.get("/api/...")
```

---

## Cambiar a otra base de datos

El código no depende de SQLite. Para pasar, por ejemplo, a PostgreSQL:

1. Cambiar `DATABASE_URL` en el `.env`:
   ```env
   DATABASE_URL=postgresql+psycopg://usuario:clave@localhost:5432/frikioteca
   ```
   (el driver `psycopg` ya está en `requirements.txt`).
2. Correr `alembic upgrade head` para crear las tablas en la nueva base.

Para que la migración no dé problemas, en los modelos usar **tipos genéricos de SQLAlchemy** (`String`, `Integer`, `Boolean`, `DateTime`, `Numeric`, `Text`…) y evitar tipos propios de una base (por ejemplo `JSONB` o `ARRAY` de PostgreSQL).

---

## Problemas comunes

| Problema | Solución |
| -------- | -------- |
| PowerShell no deja activar el venv (*"la ejecución de scripts está deshabilitada"*) | Correr `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` y volver a activar (vale solo para esa terminal) |
| `ModuleNotFoundError: No module named 'app'` | Ejecutar los comandos desde `backend/`, no desde la raíz |
| `ModuleNotFoundError` de otro paquete (`fastapi`, `sqlalchemy`…) | El venv no está activo, o falta `pip install -r requirements.txt` |
| `no such table: ...` | Falta `alembic upgrade head` |
| `Address already in use` / el puerto 8000 está ocupado | Usar otro puerto: `uvicorn app.main:app --reload --port 8001` |
| El frontend recibe un error de CORS | Verificar que el origen del frontend esté en `CORS_ORIGINS` del `.env` y reiniciar uvicorn |
| Cambié el `.env` y no se aplica | `--reload` solo detecta cambios en `.py`: reiniciar uvicorn |
