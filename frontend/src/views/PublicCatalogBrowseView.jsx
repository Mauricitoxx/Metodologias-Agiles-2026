
import { useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { catalogModules } from '../catalog/modules';
import { useCatalogEntries } from '../hooks/useCatalogEntries';
import { CatalogBrowse } from '../components/catalog/CatalogBrowse';
import { catalogCategories, filterCatalogEntries } from '../utils/catalog';

export function PublicCatalogBrowseView({ moduleId }) {
  const location = useLocation();
  const [params, setParams] = useSearchParams();

  const selected = catalogModules.find((module) => module.id === moduleId);

  const sources = useMemo(
    () => catalogModules.filter(
      (module) => module.enabled && (!moduleId || module.id === moduleId)
    ),
    [moduleId]
  );

  const { entries, loading, failures, retry } = useCatalogEntries(sources);

  const sortOptions = selected?.sortOptions || [
    { value: 'nombre', label: 'Nombre A–Z' },
    { value: 'nombre-desc', label: 'Nombre Z–A' },
  ];

  const typeOptions = useMemo(
    () => [
      ...new Map(
        sources
          .flatMap((module) => module.typeOptions || [])
          .map((option) => [option.value, option])
      ).values(),
    ],
    [sources]
  );

  const search = params.get('buscar') || '';
  const type = params.get('tipo') || '';

  const requestedOrder = params.get('orden');
  const order = sortOptions.some((option) => option.value === requestedOrder)
    ? requestedOrder
    : 'nombre';

  // Admite múltiples géneros y mantiene compatibilidad con categoria.
  const legacyCategory = params.get('categoria');
  const requestedCategories = params.get('generos');

  const selectedCategories = useMemo(() => {
    if (requestedCategories !== null) {
      return requestedCategories.split(',').filter(Boolean);
    }

    if (!legacyCategory) return [];

    // Compatibilidad con enlaces anteriores que usaban categoria=3.
    const legacyKey = legacyCategory.includes(':')
      ? legacyCategory
      : `${selected?.id || 'juegos'}:${legacyCategory}`;

    return [legacyKey];
  }, [requestedCategories, legacyCategory, selected?.id]);

  const categories = useMemo(
    () => catalogCategories(entries),
    [entries]
  );

  const filtered = useMemo(() => {
    const visible = sources.flatMap((module) => {
      const ownEntries = entries.filter(
        (entry) => entry.moduleId === module.id
      );

      return module.selectEntries
        ? module.selectEntries(ownEntries, params)
        : ownEntries;
    });

    return filterCatalogEntries(visible, {
      search,
      categories: selectedCategories,
      order,
    });
  }, [entries, sources, params, search, selectedCategories, order]);

  const failed = failures.length > 0 && failures.length === sources.length;

  function updateParam(key, value) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);

      if (key === 'generos') {
        // Al utilizar el nuevo filtro, dejamos de usar el parámetro antiguo.
        next.delete('categoria');

        if (Array.isArray(value) && value.length > 0) {
          next.set('generos', value.join(','));
        } else {
          next.delete('generos');
        }
      } else {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      }

      return next;
    }, { replace: true });
  }

  function clearFilters() {
    const next = new URLSearchParams(params);

    ['buscar', 'categoria', 'generos', 'tipo', 'orden'].forEach(
      (key) => next.delete(key)
    );

    setParams(next);
  }

  const hasFilters =
    Boolean(search || type || legacyCategory || requestedCategories);

  return (
    <CatalogBrowse
      title={selected?.availableTitle || 'Títulos disponibles'}
      searchLabel={selected?.searchLabel || 'Buscar por título'}
      search={search}
      type={type}
      typeOptions={typeOptions}
      categoryLabel={selected?.categoryLabel || 'Géneros / categorías'}
      selectedCategories={selectedCategories}
      categories={categories}
      order={order}
      sortOptions={sortOptions}
      onChange={updateParam}
      loading={loading}
      failed={failed}
      count={filtered.length}
      singular={selected?.singular || 'título'}
      plural={selected?.plural || 'títulos'}
    >
      {failures.length > 0 && (
        <div className="public-catalog-message" role="alert">
          <h2>
            {failed
              ? 'No pudimos abrir el catálogo'
              : 'Parte del catálogo no está disponible'}
          </h2>
          <p>
            No pudimos cargar:{' '}
            {sources
              .filter((module) => failures.includes(module.id))
              .map((module) => module.title)
              .join(', ')}.
            Intentá nuevamente.
          </p>
          <button
            className="public-catalog-primary"
            onClick={retry}
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <p className="public-catalog-message" role="status">
          Estamos preparando el catálogo…
        </p>
      ) : failed ? null : filtered.length ? (
        <div className="public-catalog-grid">
          {filtered.map((entry) => {
            const module = sources.find(
              (source) => source.id === entry.moduleId
            );

            return (
              <div className="public-catalog-entry" key={entry.key}>
                {module.renderCard(
                  entry,
                  `${location.pathname}${location.search}`
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="public-catalog-message">
          <h2>
            {hasFilters
              ? 'No encontramos publicaciones'
              : 'Pronto habrá más publicaciones'}
          </h2>
          <p>
            {hasFilters
              ? 'No hay publicaciones que coincidan con los criterios seleccionados. Probá con otros filtros.'
              : 'No hay publicaciones disponibles en este momento. Volvé a consultar más tarde.'}
          </p>

          {hasFilters && (
            <button
              className="public-catalog-primary"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </CatalogBrowse>
  );
}
