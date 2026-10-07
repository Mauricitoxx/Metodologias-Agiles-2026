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

| Área                 | Tecnología   |
| -------------------- | ------------ |
| Aplicación móvil     | React Native |
| Framework            | Expo         |
| Backend              | FastAPI      |
| ORM                  | SQLAlchemy   |
| Base de datos        | PostgreSQL   |
| Control de versiones | Git          |

## Arquitectura general

El sistema se plantea siguiendo una arquitectura cliente-servidor:

```text
┌──────────────────────┐
│   React Native       │
│       + Expo         │
│  Aplicación móvil    │
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
│     PostgreSQL       │
│   Base de datos      │
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

La estructura definitiva ira evolucionando con los sprints. Una organización esperada es:

```text
.
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── app/
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

Para ejecutar el proyecto localmente se requiere, como mínimo:

- Git
- Node.js y npm
- Expo
- Python 3
- PostgreSQL

### 1. Clonar el repositorio

```bash
git clone https://github.com/Mauricitoxx/Metodologias-Agiles-2026.git
cd Metodologias-Agiles-2026
```

### 2. Backend

Ingresar al directorio del backend:

```bash
cd backend
```

Crear un entorno virtual:

```bash
python -m venv venv
```

Activarlo en Windows:

```bash
venv\Scripts\activate
```

Instalar las dependencias:

```bash
pip install -r requirements.txt
```

Ejecutar la API:

```bash
uvicorn app.main:app --reload
```

> Los nombres de módulos y archivos pueden variar durante la configuración inicial del backend.

### 3. Frontend

Desde la raíz del proyecto:

```bash
cd frontend
npm install
npx expo start
```

Expo permitirá iniciar la aplicación en un emulador o dispositivo compatible.

### 4. Base de datos

El backend utiliza PostgreSQL como motor de base de datos.

La configuración de conexión deberá establecerse mediante variables de entorno een el archivo .env.

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
