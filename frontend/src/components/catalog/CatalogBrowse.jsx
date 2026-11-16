
import { useId } from 'react';
import { CatalogSections } from './CatalogSections';
import { CatalogIcon } from './CatalogIcon';
import './../../styles/CatalogBrowse.css'

// Presentación compartida: no conoce modelos ni servicios de juegos o lecturas.
export function CatalogBrowse({
  title,
  searchLabel,
  search,
  type,
  typeOptions = [],
  categoryLabel = 'Categorías',
  selectedCategories = [],
  categories,
  order,
  sortOptions,
  onChange,
  loading,
  failed,
  count,
  singular,
  plural,
  total,
  children,
}) {
  const typeId = useId();
  const categoryId = useId();

  return (
    <>
      <h1 className="public-sr-only">{title}</h1>

      <form
        className="public-catalog-search"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <div>
          <CatalogIcon name="7c478" />
          <input
            type="search"
            aria-label={searchLabel}
            placeholder={`${searchLabel}...`}
            value={search}
            onChange={(event) => onChange('buscar', event.target.value)}
          />
        </div>

        <button className="public-catalog-primary" type="submit">
          Buscar
        </button>
      </form>

      <CatalogSections count={total} />

      <div className="public-catalog-filters">
        {typeOptions.length > 0 && (
          <div>
            <label htmlFor={typeId}>Tipo</label>
            <select
              id={typeId}
              value={type}
              onChange={(event) => onChange('tipo', event.target.value)}
            >
              <option value="">Todos los tipos</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="public-catalog-genres">
          <span className="public-catalog-filter-label">
            {categoryLabel}
          </span>

          <div
            className="public-catalog-tags"
            role="group"
            aria-label={`Filtrar por ${categoryLabel.toLowerCase()}`}
          >
            {categories.map((item) => {
              const active = selectedCategories.includes(item.key);

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`public-catalog-tag ${active ? 'is-selected' : ''}`}
                  aria-pressed={active}
                  onClick={() => {
                    const next = active
                      ? selectedCategories.filter((key) => key !== item.key)
                      : [...selectedCategories, item.key];

                    onChange('generos', next);
                  }}
                >
                  {active && <span aria-hidden="true">✓ </span>}
                  {item.nombre}
                </button>
              );
            })}
          </div>

          {selectedCategories.length > 0 && (
            <button
              type="button"
              className="public-catalog-clear-tags"
              onClick={() => onChange('generos', [])}
            >
              Limpiar géneros
            </button>
          )}
        </div>
      </div>

      <div className="public-catalog-counter">
        <p role="status" aria-live="polite">
          <span className="public-catalog-counter-title">{title}</span>
          <span className="public-catalog-counter-summary">
            {loading
              ? 'Cargando catálogo…'
              : failed
                ? 'Catálogo sin conexión'
                : (
                  <>
                    <strong>{count}</strong>{' '}
                    {count === 1 ? singular : plural} para explorar
                  </>
                )}
          </span>
        </p>

        <label>
          <CatalogIcon name="15b7f" />
          <span className="public-sr-only">Ordenar catálogo</span>
          <select
            value={order}
            onChange={(event) => onChange('orden', event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {children}
    </>
  );
}
