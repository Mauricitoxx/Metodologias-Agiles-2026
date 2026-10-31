# La Frikioteca — Frontend

Frontend React y Vite con las cinco pantallas de la referencia: inicio de sesión, panel central, inventario, formulario de entidad y gestión de staff.

## Ejecutar

```sh
npm install
npm run dev
```

## Conexión con el backend

El módulo de **Actividades** (pestaña *Actividades* del inventario, `/admin/inventario`) consume la API del backend; el resto de los módulos todavía usa datos de prueba en `localStorage`.

La URL de la API se configura con `VITE_API_URL` (por defecto `http://127.0.0.1:8000/api`). Para cambiarla, copiar `.env.example` como `.env.local` (no se sube a git) y reiniciar `npm run dev`. El backend tiene que estar levantado (ver `backend/README.md`).

| Archivo                          | Para qué sirve                                                   |
| -------------------------------- | ---------------------------------------------------------------- |
| `src/services/api.js`            | Cliente `fetch`: errores como `ApiError` con mensajes por campo   |
| `src/services/activityService.js`| Llamadas a `/activities` y `/activity-types`                      |
| `src/utils/activity.js`          | Etiquetas y formato de fechas (usar `toInputValue` para `datetime-local`, nunca `toISOString`) |

## Cuenta de demostración
## Inicio de sesión

La pantalla `/login` implementa el layer **Login · La Frikioteca** de Figma. Valida las credenciales contra FastAPI y permite mostrar u ocultar la contraseña. Las rutas administrativas requieren una sesión validada por `/api/auth/me`. El token se conserva en `sessionStorage` y se invalida en el servidor al cerrar sesión; vence después de 8 horas por defecto.

Levantá el backend, aplicá `alembic upgrade head` y creá una cuenta con el comando documentado en [backend/README.md](../backend/README.md). No hay credenciales de demostración ni registro público.

Opcionalmente copiá `.env.example` a `.env`:

- `VITE_API_URL`: URL de la API, por defecto `http://127.0.0.1:8000/api`.
- `VITE_PUBLIC_SITE_URL`: destino opcional de “Volver a La Frikioteca”. Si está vacío, abre `/catalogo`. Reiniciá Vite después de cambiarlo.

“¿Te olvidaste la contraseña?” indica contactar al equipo: todavía no hay recuperación automática por correo.

Las entidades y miembros de staff siguen guardándose en `localStorage` de este navegador. El staff de demostración no crea cuentas del backend. No se almacenan contraseñas de staff; la clave temporal es una vista previa para una futura integración.

El panel central (`/admin`) solo ofrece dos accesos: Inventario y Staff. Inventario (`/admin/inventario`) agrupa las pestañas Juegos de mesa, Mangas & Cómics, Carta y Actividades.

Juegos de mesa (`views/JuegosView.jsx`) muestra los juegos agrupados por categoría y permite crear, editar y eliminar categorías; una categoría con juegos asociados no se puede eliminar.

Inventario permite buscar, filtrar, registrar, editar, consultar fichas, dar de baja y reactivar juegos, cómics, cartas y buffet. El formulario valida SKU único y cantidad de jugadores, selecciona complejidad y carga imágenes PNG, JPG o WebP hasta 5 MB. Las portadas se reducen para el almacenamiento local.

La pestaña Carta (clave interna `buffet`) usa la API de productos (`services/productoService.js`): lista activos e inactivos ordenados por categoría y nombre, con precio y estado Activo/Inactivo. La baja es lógica, siempre pide confirmación y oculta el producto de la carta pública. El alta y la edición usan su propio formulario (`views/ProductoFormView.jsx`, "Registro de carta" del Figma): nombre único de hasta 50 caracteres, descripción de hasta 500, tipo, precio con dos decimales y estado Activo/Inactivo. El precio de oferta se suma en HU-13.

Staff permite alta, edición, selección de avatar y rol, búsqueda de activos, baja y reactivación. Se conserva al menos un Superadministrador activo.

La autenticación ya usa servidor y base de datos. Los demás módulos aún requieren integración con la API, autorización de roles, envío de credenciales y recuperación automática de contraseña. Los futuros endpoints de gestión deben usar la dependencia `get_current_admin` del backend.

## Verificación

```sh
npm run build
npm run lint
```
