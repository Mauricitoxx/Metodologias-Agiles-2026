# La Frikioteca — Administración

Frontend React y Vite con las cinco pantallas de la referencia: inicio de sesión, panel central, inventario, formulario de entidad y gestión de staff.

## Ejecutar

```sh
npm install
npm run dev
```

## Inicio de sesión

La pantalla `/login` implementa el layer **Login · La Frikioteca** de Figma. Valida las credenciales contra FastAPI y permite mostrar u ocultar la contraseña. Las rutas administrativas requieren una sesión validada por `/api/auth/me`. El token se conserva en `sessionStorage` y se invalida en el servidor al cerrar sesión; vence después de 8 horas por defecto.

Levantá el backend, aplicá `alembic upgrade head` y creá una cuenta con el comando documentado en [backend/README.md](../backend/README.md). No hay credenciales de demostración ni registro público.

Opcionalmente copiá `.env.example` a `.env`:

- `VITE_API_URL`: URL de la API, por defecto `http://127.0.0.1:8000/api`.
- `VITE_PUBLIC_SITE_URL`: destino de “Volver a La Frikioteca”. Mientras esté vacío, el botón informa que el sitio público estará disponible próximamente. Reiniciá Vite después de cambiarlo.

“¿Te olvidaste la contraseña?” indica contactar al equipo: todavía no hay recuperación automática por correo.

Las entidades y miembros de staff siguen guardándose en `localStorage` de este navegador. El staff de demostración no crea cuentas del backend. No se almacenan contraseñas de staff; la clave temporal es una vista previa para una futura integración.

Inventario permite buscar, filtrar, registrar, editar, consultar fichas, dar de baja y reactivar juegos, cómics, cartas y buffet. El formulario valida SKU único y cantidad de jugadores, selecciona complejidad y carga imágenes PNG, JPG o WebP hasta 5 MB. Las portadas se reducen para el almacenamiento local.

Staff permite alta, edición, selección de avatar y rol, búsqueda de activos, baja y reactivación. Se conserva al menos un Superadministrador activo.

La autenticación ya usa servidor y base de datos. Los demás módulos aún requieren integración con la API, autorización de roles, envío de credenciales y recuperación automática de contraseña. Los futuros endpoints de gestión deben usar la dependencia `get_current_admin` del backend.

## Verificación

```sh
npm run build
npm run lint
```
