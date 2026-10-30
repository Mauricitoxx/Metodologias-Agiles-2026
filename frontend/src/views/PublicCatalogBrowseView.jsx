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
  const sources = useMemo(() => catalogModules.filter((module) => module.enabled && (!moduleId || module.id === moduleId)), [moduleId]);
  const { entries, loading, failures, retry } = useCatalogEntries(sources);
  const sortOptions = selected?.sortOptions || [{ value: 'nombre', label: 'Nombre A–Z' }];
  const search = params.get('buscar') || '';
  const category = params.get('categoria') || '';
  const requestedOrder = params.get('orden');
  const order = sortOptions.some((option) => option.value === requestedOrder) ? requestedOrder : 'nombre';
  const categories = useMemo(() => catalogCategories(entries), [entries]);
  // Compatibilidad con enlaces previos de juegos que usaban categoria=3.
  const categoryKey = category && !category.includes(':') ? `${selected?.id || 'juegos'}:${category}` : category;
  const filtered = useMemo(() => {
    const visible = sources.flatMap((module) => {
      const ownEntries = entries.filter((entry) => entry.moduleId === module.id);
      return module.selectEntries ? module.selectEntries(ownEntries, params) : ownEntries;
    });
    return filterCatalogEntries(visible, { search, category: categoryKey, order });
  }, [entries, sources, params, search, categoryKey, order]);
  const failed = failures.length > 0 && failures.length === sources.length;
  function updateParam(key, value) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });
  }
  return <CatalogBrowse title={selected?.availableTitle || 'Títulos disponibles'} searchLabel={selected?.searchLabel || 'Buscar por título'}
    search={search} category={categoryKey} categories={categories} order={order} sortOptions={sortOptions} onChange={updateParam}
    loading={loading} failed={failed} count={filtered.length} singular={selected?.singular || 'título'} plural={selected?.plural || 'títulos'}>
    {failures.length > 0 && <div className="public-catalog-message" role="alert"><h2>{failed ? 'No pudimos abrir el catálogo' : 'Parte del catálogo no está disponible'}</h2><p>No pudimos cargar: {sources.filter((module) => failures.includes(module.id)).map((module) => module.title).join(', ')}. Intentá nuevamente.</p><button className="public-catalog-primary" onClick={retry}>Reintentar</button></div>}
    {loading ? <p className="public-catalog-message" role="status">Estamos preparando el catálogo…</p>
      : failed ? null : filtered.length ? <div className="public-catalog-grid">{filtered.map((entry) => {
        const module = sources.find((source) => source.id === entry.moduleId);
        return <div className="public-catalog-entry" key={entry.key}>{module.renderCard(entry, `${location.pathname}${location.search}`)}</div>;
      })}</div>
        : <div className="public-catalog-message"><h2>{search || category ? 'No encontramos títulos' : 'Pronto habrá más títulos'}</h2><p>{search || category ? 'Probá con otro título o elegí una categoría diferente.' : 'No hay títulos disponibles en este momento. Volvé a consultar más tarde.'}</p>{(search || category) && <button className="public-catalog-primary" onClick={() => { const next = new URLSearchParams(params); ['buscar', 'categoria', 'orden'].forEach((key) => next.delete(key)); setParams(next); }}>Limpiar filtros</button>}</div>}
  </CatalogBrowse>;
}
