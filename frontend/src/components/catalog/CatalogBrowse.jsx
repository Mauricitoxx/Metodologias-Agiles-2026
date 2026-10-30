import { useId } from 'react';
import { CatalogSections } from './CatalogSections';
import { CatalogIcon } from './CatalogIcon';

// Presentación compartida: no conoce modelos ni servicios de juegos o lecturas.
export function CatalogBrowse({ title, searchLabel, search, category, categories, order, sortOptions, onChange, loading, failed, count, singular, plural, total, children }) {
  const categoryId = useId();
  return <>
    <h1 className="public-sr-only">{title}</h1>
    <form className="public-catalog-search" role="search" onSubmit={(event) => event.preventDefault()}>
      <div><CatalogIcon name="7c478" /><input type="search" aria-label={searchLabel} placeholder={`${searchLabel}...`} value={search} onChange={(event) => onChange('buscar', event.target.value)} /></div>
      <button className="public-catalog-primary" type="submit">Buscar</button>
    </form>
    <CatalogSections count={total} />
    <div className="public-catalog-filters">
      <label htmlFor={categoryId}>Categoría</label>
      <select id={categoryId} value={category} onChange={(event) => onChange('categoria', event.target.value)}>
        <option value="">Todas las categorías</option>
        {categories.map((item) => <option key={item.key} value={item.key}>{item.nombre}</option>)}
      </select>
    </div>
    <div className="public-catalog-counter">
      <p role="status" aria-live="polite"><span className="public-catalog-counter-title">{title}</span>
        <span className="public-catalog-counter-summary">{loading ? 'Cargando catálogo…' : failed ? 'Catálogo sin conexión' : <><strong>{count}</strong>{' '}{count === 1 ? singular : plural} para explorar</>}</span>
      </p>
      <label><CatalogIcon name="15b7f" /><span className="public-sr-only">Ordenar catálogo</span><select value={order} onChange={(event) => onChange('orden', event.target.value)}>{sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    </div>
    {children}
  </>;
}
