# La Frikioteca — Administración

Frontend React y Vite con las cinco pantallas de la referencia: inicio de sesión, panel central, inventario, formulario de entidad y gestión de staff.

## Ejecutar

```sh
npm install
npm run dev
```

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
