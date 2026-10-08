# La Frikioteca

Aplicación móvil desarrollada para **La Frikioteca**, orientada a mejorar la experiencia de los clientes del local mediante la consulta de juegos de mesa, reglas, material explicativo, carta gastronómica, actividades y catálogo de mangas y cómics.

## Objetivo

Centralizar en una app móvil la información de interés para los clientes de La Frikioteca, permitiéndoles conocer de antemano los juegos disponibles, consultar sus características y reglas, acceder a material explicativo y visualizar otros servicios y actividades ofrecidos por el local.

A su vez, el sistema contará con funcionalidades de administración para mantener actualizada la información disponible para los clientes.

## Funcionalidades principales

El producto se organiza en cinco módulos funcionales:

### 1. Seguridad y usuarios

- Inicio y cierre de sesión para usuarios administradores.
- Registro de nuevos administradores.
- Consulta y baja de administradores.
- Control de acceso a las funcionalidades de gestión.

### 2. Gestión de juegos

- Alta y modificación de juegos de mesa.
- Consulta y baja lógica de los juegos.
- Gestión de categorías.
- Gestión de reglas organizadas por secciones.
- Asociación opcional de videos explicativos via URL.
- Catálogo público de juegos.
- Búsqueda y filtrado por nombre o categoría.
- Consulta del detalle de cada juego.

### 3. Gestión de carta y ofertas

- Alta y modificación de productos de la carta.
- Consulta y baja lógica de productos.
- Gestión de precios promocionales.
- Visualización pública de la carta.
- Visualización de ofertas vigentes.

### 4. Gestión de actividades

- Registro y modificación de actividades.
- Consulta, cancelación y eliminación de actividades.
- Cronograma público de actividades.
- Búsqueda y filtrado.
- Consulta del detalle de cada actividad.

### 5. Gestión de mangas y cómics

- Registro y modificación de mangas y cómics.
- Consulta y baja de ejemplares.
- Catálogo público.
- Búsqueda y filtrado.
- Consulta de información detallada de cada tomo.

## Stack tecnológico

| Área                 | Tecnología                                              |
| -------------------- | ------------------------------------------------------- |
| Frontend             | React.js (Vite)                                         |
| Backend              | Python + FastAPI                                        |
| ORM                  | SQLAlchemy (migraciones con Alembic)                    |
| Base de datos        | SQLite en desarrollo local; luego se migrará (PostgreSQL) |
| Control de versiones | Git + GitHub                                            |

## Arquitectura general

El sistema se plantea siguiendo una arquitectura cliente-servidor:

```text
┌──────────────────────┐
│      React.js        │
│       + Vite         │
│      Frontend        │
└──────────┬───────────┘
           │ HTTP / API REST
           ▼
┌──────────────────────┐
│      FastAPI         │
│      Backend         │
└──────────┬───────────┘
           │ SQLAlchemy
           ▼
┌──────────────────────┐
│  SQLite (local) →    │
│  PostgreSQL (luego)  │
└──────────────────────┘
```

El frontend será responsable de la interacción con clientes y administradores, mientras que el backend concentrará la lógica de negocio, validaciones, persistencia y acceso a datos.

## Modelo de dominio

Entre las principales entidades contempladas por el sistema se encuentran:

- Juego
- Categoría
- Regla
- Producto
- Menu
- Actividad
- MangaComic
- Persona
- Cliente
- Administrador
- Sucursal

El modelo completo y sus relaciones se encuentran documentados dentro del trello del proyecto.

## Organización del proyecto

La estructura irá evolucionando con los sprints. Actualmente:

```text
.
├── backend/              # API FastAPI (ver backend/README.md)
│   ├── app/              # Código: rutas, modelos, esquemas, servicios
│   ├── alembic/          # Migraciones de la base
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/             # React + Vite (ver frontend/README.md)
│   ├── src/
│   ├── package.json
│   └── ...
│
├── Doc/
│   ├── ER-Frikioteca
│   └── ...
│
└── README.md
```

## Instalación y ejecución

### Requisitos previos

Para ejecutar el proyecto localmente se requiere:

- Git
- Python 3.11 o superior
- Node.js 20.19+ o 22.12+ y npm

No hace falta instalar un motor de base de datos: en desarrollo se usa SQLite, que viene con Python.

### 1. Clonar el repositorio

```bash
git clone https://github.com/Mauricitoxx/Metodologias-Agiles-2026.git
cd Metodologias-Agiles-2026
```

### 2. Backend

Desde la raíz del proyecto (comandos para Windows PowerShell; en macOS/Linux el venv se activa con `source venv/bin/activate` y el `.env` se copia con `cp`):

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

La API queda en http://127.0.0.1:8000 y su documentación interactiva en http://127.0.0.1:8000/docs.

La guía completa (variables de entorno, estructura, cómo agregar un módulo, migraciones, tests y problemas comunes) está en [backend/README.md](backend/README.md).

### 3. Frontend

En otra terminal, desde la raíz del proyecto:

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda en http://localhost:5173. Más detalles en [frontend/README.md](frontend/README.md).

### 4. Base de datos

- En desarrollo local se usa **SQLite**: la base es el archivo `backend/frikioteca.db`, que se crea con `alembic upgrade head` y no se sube a git.
- La conexión se configura con la variable `DATABASE_URL` del archivo `backend/.env`. Para migrar a otra base (por ejemplo PostgreSQL) alcanza con cambiar esa URL y volver a correr `alembic upgrade head`.
- Los cambios en la estructura de la base se versionan con **Alembic** (`backend/alembic/versions/`). Después de cada `git pull`, correr `alembic upgrade head` para tener la base al día.

### 5. Flujo de trabajo con Git

1. Partir siempre de `main` actualizado: `git checkout main` y `git pull`.
2. Crear una rama por tarea: `git checkout -b feat/<modulo-o-tarea>` (por ejemplo `feat/juegos`).
3. Al terminar, subir la rama y abrir un Pull Request hacia `main`.

## Gestión ágil

El proyecto se planifica y gestiona mediante **Trello**, utilizando un Product Backlog e iteraciones de desarrollo.

El tablero contempla estados de trabajo como:

```text
Backlog → Sprint → En proceso → Revisión → Listo
```

Las historias de usuario están agrupadas por módulos funcionales y contienen criterios de aceptación para orientar el desarrollo y la validación.

### Tablero del proyecto

[2026 - UTN - Grupo 07](https://trello.com/b/V7xkKSeG/2026-utn-grupo-07)

## Equipo

Proyecto desarrollado por el **Grupo 7**:

- Bautista Calvo
- Damián Ariel Alvite
- Franco Javier Portillo Colinas
- Iara Rearte
- Juan Cruz Caceres
- Mauro Lista

La documentación funcional y técnica se mantendrá actualizada a medida que avance el desarrollo y se completen los distintos sprints.
