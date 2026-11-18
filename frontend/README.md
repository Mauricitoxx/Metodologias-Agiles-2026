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

Las entidades que todavía no tienen backend (por ejemplo, los juegos de cartas) siguen guardándose en `localStorage` de este navegador. El staff ya no: usa la API de administradores (ver más abajo).

El panel central (`/admin`) solo ofrece dos accesos: Inventario y Staff. Inventario (`/admin/inventario`) agrupa las pestañas Juegos de mesa, Mangas & Cómics, Carta y Actividades, y abre en Actividades.

Juegos de mesa (`views/JuegosView.jsx`) muestra los juegos agrupados por categoría y permite crear, editar y eliminar categorías; una categoría con juegos asociados no se puede eliminar.

Inventario permite buscar, filtrar, registrar, editar, consultar fichas, dar de baja y reactivar juegos, cómics, cartas y buffet. El formulario valida SKU único y cantidad de jugadores, selecciona complejidad y carga imágenes PNG, JPG o WebP hasta 5 MB. Las portadas se reducen para el almacenamiento local.

La pestaña Carta (clave interna `buffet`) usa la API de productos (`services/productoService.js`): lista activos e inactivos ordenados por categoría y nombre, con precio y estado Activo/Inactivo. La baja es lógica, siempre pide confirmación y oculta el producto de la carta pública. El alta y la edición usan su propio formulario (`views/ProductoFormView.jsx`, "Registro de carta" del Figma): nombre único de hasta 50 caracteres, descripción de hasta 500, tipo, precio y estado Activo/Inactivo. Los precios se muestran en pesos sin centavos (`utils/precio.js`, por ejemplo $10.000), aunque la API acepta hasta dos decimales.

HU-13: el formulario tiene el campo opcional **Precio de oferta**. Debe ser mayor a cero y menor al precio; si no, bloquea el guardado con *"El precio de oferta debe ser menor al precio actual"*, el mismo mensaje que devuelve el backend. Al guardar, la tarjeta del buffet muestra el precio original tachado, la oferta resaltada y el porcentaje de descuento. Para quitar la oferta se vacía el campo (o se usa "Quitar oferta") y se guarda: el producto vuelve a mostrar solo su precio original.

El formulario también tiene la sección **Imagen**, igual que en actividades: una URL web opcional con vista previa. La tarjeta del buffet y la ficha muestran esa foto; si el campo queda vacío, se ve el ícono 🍔.

El cronograma público (`/eventos`, botón Eventos de la barra inferior del cliente) consume `GET /api/activities/schedule`: muestra las próximas actividades agrupadas por día, con búsqueda por nombre y filtro por tipo. Las canceladas y postergadas aparecen con su aviso (fecha original y motivo) y las que están en curso se marcan como tales. Cada evento muestra una barra con los lugares restantes y el botón Inscribirme, que abre un formulario de nombre, correo y edad (`POST /api/activities/schedule/{id}/registrations`); no deja inscribirse si no hay cupo o la edad es menor a la mínima. El botón de información lleva al detalle. Sin cuenta, el token de la inscripción se guarda en el navegador (`utils/eventSignUps.js`): la tarjeta pasa a "Estás inscripto" con el botón Cancelar inscripción. La confirmación también muestra un enlace `/eventos/inscripcion/:token` para cancelar desde cualquier dispositivo. `/eventos/:id` muestra el detalle con `GET /api/activities/schedule/{id}`; una actividad inactivada desde el panel deja de estar disponible.

Staff (`/admin/staff`, `views/AdminUsersView.jsx`) usa la API de administradores (`services/staffService.js` → `/api/administradores`): cada miembro es una cuenta real que puede iniciar sesión.

- **Alta:** nombre y correo. Se genera una clave temporal (`utils/tempPassword.js`, con `crypto.getRandomValues`) que se muestra al guardar para copiarla y entregarla; después no se vuelve a ver.
- **Edición:** nombre y correo. Opcionalmente, *Restablecer la contraseña* genera y guarda una clave temporal nueva.
- **Baja y reactivación:** al darlo de baja no puede iniciar sesión y sus sesiones abiertas dejan de valer. El backend impide dar de baja al único administrador activo, y la tarjeta propia no muestra el botón de baja.
- El encabezado muestra el nombre del usuario logueado (sin foto). No hay roles ni avatares: el backend no los tiene.

La autenticación ya usa servidor y base de datos. Los demás módulos aún requieren integración con la API, autorización de roles, envío de credenciales y recuperación automática de contraseña. Los futuros endpoints de gestión deben usar la dependencia `get_current_admin` del backend.

## Verificación

```sh
npm run build
npm run lint
```
