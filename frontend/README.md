# La Frikioteca — Administración

Frontend React y Vite con las cinco pantallas de la referencia: inicio de sesión, panel central, inventario, formulario de entidad y gestión de staff.

## Ejecutar

```sh
npm install
npm run dev
```

## Conexión con el backend

El módulo de **Actividades** (`/admin/actividades`) consume la API del backend; el resto de los módulos todavía usa datos de prueba en `localStorage`.

La URL de la API se configura con `VITE_API_URL` (por defecto `http://127.0.0.1:8000/api`). Para cambiarla, copiar `.env.example` como `.env.local` (no se sube a git) y reiniciar `npm run dev`. El backend tiene que estar levantado (ver `backend/README.md`).

| Archivo                          | Para qué sirve                                                   |
| -------------------------------- | ---------------------------------------------------------------- |
| `src/services/api.js`            | Cliente `fetch`: errores como `ApiError` con mensajes por campo   |
| `src/services/activityService.js`| Llamadas a `/activities` y `/activity-types`                      |
| `src/utils/activity.js`          | Etiquetas y formato de fechas (usar `toInputValue` para `datetime-local`, nunca `toISOString`) |

## Cuenta de demostración

- Correo: `admin@frikioteca.demo`
- Contraseña: `Frikio2026!`

El inicio de sesión es una demostración de interfaz, no una protección de acceso. La sesión se conserva en `sessionStorage`. Las entidades y miembros se guardan en `localStorage` de este navegador. No se almacenan contraseñas de staff; la clave temporal es una vista previa para una futura integración.

Inventario permite buscar, filtrar, registrar, editar, consultar fichas, dar de baja y reactivar juegos, cómics, cartas y buffet. El formulario valida SKU único y cantidad de jugadores, selecciona complejidad y carga imágenes PNG, JPG o WebP hasta 5 MB. Las portadas se reducen para el almacenamiento local.

Staff permite alta, edición, selección de avatar y rol, búsqueda de activos, baja y reactivación. Se conserva al menos un Superadministrador activo.

Para producción faltan el servidor, la base de datos, autenticación y autorización de roles, envío de credenciales y recuperación de contraseña.

## Verificación

```sh
npm run build
npm run lint
```
