# Integrar HU-21/HU-22 en el catálogo público

La navegación pública está en `src/catalog/PublicCatalogRoutes.jsx`; `App.jsx` solo monta `/catalogo/*`. La configuración de cada dominio está en **`src/catalog/modules.jsx`**. No hay que modificar juegos ni el contexto de administración para integrar lecturas.

## Estado actual

- `juegos`: habilitado, conectado a `publicGameCatalogService` y a la API existente.
- `lecturas`: reservado con `slug: 'mangas'`, deshabilitado; muestra únicamente un aviso de próxima disponibilidad. No se realizan solicitudes de mangas ni se implementan sus HU.
- `/catalogo`: reúne las fuentes habilitadas. El contador es de títulos, nunca un total de juegos presentado como total de mangas.
- `/catalogo/juegos`: aplica las etiquetas y el orden propios de juegos.
- `/catalogo/mangas` y `?tipo=comic`: entradas reservadas para el módulo de lecturas.
- Las rutas públicas desconocidas muestran una página de catálogo inexistente; no pasan por el login administrativo.

## Contrato del módulo de lecturas

Al implementar las HU, completar el objeto `lecturas` en `modules.jsx`:

| Campo | Responsabilidad |
| --- | --- |
| `id` / `slug` | Conservar `lecturas` / `mangas` para mantener identidades y URLs estables. |
| `enabled` | Cambiar a `true` cuando sus datos, tarjetas y detalle estén implementados. |
| `title`, `availableTitle` | Etiquetas del módulo y encabezado del listado. |
| `singular`, `plural`, `searchLabel` | Textos para contador y búsqueda. |
| `sortOptions` | Opciones `{ value, label }`; `nombre` está disponible de forma compartida. No ofrecer duración para lecturas. |
| `listEntries()` | Consultar el servicio público, aplicar disponibilidad de SU modelo y transformar cada registro con `createCatalogEntry`. Devolver un array. No reutilizar `isGameAvailable`, porque los esquemas son distintos. |
| `renderCard(entry, returnTo)` | Renderizar la tarjeta de manga/cómic con `entry.record`. El dominio conserva todos sus campos sin convertirlo en un juego. |
| `DetailView` | Vista de detalle que recibe el ID por `useParams()`; se monta automáticamente en `/catalogo/mangas/:id`. |
| `selectEntries(entries, searchParams)` | Opcional: aplicar filtros de dominio como `tipo=comic`, usando metadatos de `entry.record`. Se ejecuta antes de la búsqueda compartida. Debe devolver un array sin mutar la entrada. |
| `BrowseView` | Opcional: si las HU necesitan controles diferentes, reemplazar solo el listado de ese módulo. Recibe `moduleId`; “Todos” sigue usando `listEntries` y `renderCard`. |

`listEntries` debe devolver todos los títulos públicos disponibles del módulo; el filtro de tipo se aplica en `selectEntries`, para que “Todos” pueda mostrar tanto mangas como cómics.

## Adaptar registros sin mezclar dominios

Usar `createCatalogEntry('lecturas', registro, { title, categories })` desde `src/utils/catalog.js`. `title` debe incluir el título buscable y, si corresponde, el tomo. `categories` usa `{ id, nombre }`; el adaptador de lecturas transforma los nombres de campos que exponga su API.

La entrada resultante conserva `record` íntegro y genera `key: 'lecturas:<id>'`. Cada categoría tiene una clave `lecturas:<id>`. Así, un manga con ID 3 y un juego con ID 3 pueden convivir sin que se mezclen sus tarjetas, filtros o detalles. Las categorías de igual nombre permanecen independientes por dominio.

El servicio existente `mangaComicService` ya ofrece operaciones públicas `list` y `get`. La implementación de las HU debe comprobar su esquema y la disponibilidad; las operaciones administrativas quedan fuera del catálogo público.

El esquema actual `MangaComicResponse` no incluye `tipo` ni categorías. Esos datos deben resolverse dentro de las HU de lecturas y su adaptador/API. No inferirlos del ID o del título ni aplicar la disponibilidad de juegos a mangas. Las categorías normalizadas pueden omitirse hasta contar con datos reales.

## Reutilización de UI y navegación

- `PublicCatalogLayout`: marco, marca y navegación inferior mediante `<Outlet />`.
- `CatalogBrowse`: búsqueda, pestañas, categorías, contador, orden y espacio `children` para contenido o estados. No importa servicios ni modelos de juegos.
- `CatalogSections`: genera las pestañas desde el registro de módulos. Reconoce `tipo=comic` y rutas de detalle; no contiene lógica de disponibilidad.
- `useCatalogEntries`: carga fuentes y descarta respuestas de una navegación anterior. Devuelve resultados, fallos, carga y reintento. Las respuestas parciales se conservan.
- `filterCatalogEntries` y `catalogCategories`: búsqueda por título, orden y categorías sobre entradas normalizadas.

En el enlace de cada tarjeta de lectura, guardar `state={{ catalogReturnTo: returnTo }}`. En su detalle, recuperar ese estado con `useLocation()` y validarlo con `getCatalogReturnTo(state?.catalogReturnTo, '/catalogo/mangas')`. Así se vuelve a “Todos” o a lecturas conservando `tipo`, búsqueda, categoría y orden. La vista de juegos ya implementa este patrón.

Los parámetros compartidos son `buscar`, `categoria` y `orden`. Los parámetros de dominio, como `tipo`, se conservan al editar o limpiar los filtros compartidos. Los IDs de categorías en la URL llevan prefijo (`juegos:3`, `lecturas:3`); los enlaces viejos con IDs numéricos se interpretan como categorías de juegos en “Todos”.

## Verificación al integrar

Ejecutar `npm run build`, `npm run lint` y `npm test`. Probar “Todos” con ambos módulos, IDs coincidentes, búsqueda por serie/tomo, tipo Manga/Cómic, detalle y regreso con filtros. También comprobar que una API caída no oculta el otro módulo. Los tests `catalogIntegration.test.mjs` cubren agregación, colisiones, fallo parcial, pestañas y retorno mediante fuentes sintéticas, sin implementar las HU de lecturas.
