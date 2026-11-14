
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Copy, FileText, X } from 'lucide-react';
import { publicMangaComicCatalogService } from '../services/publicMangaComicCatalogService';
import { MangaComicCover } from '../components/catalog/PublicMangaComicCard';
import { getCatalogReturnTo } from '../utils/catalog';

const DEMOGRAPHIC_CATEGORIES = new Set([
  'shonen',
  'shōnen',
  'shojo',
  'shōjo',
  'seinen',
  'josei',
  'kodomo',
  'kodomomuke',
]);

const normalizeCategoryName = (name = '') =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase();

const getCategories = (record) => {
  const categories =
    record.categorias?.length
      ? record.categorias
      : record.categories?.length
        ? record.categories
        : record.categoria
          ? [record.categoria]
          : [];

  return categories.map((category, index) => {
    if (typeof category === 'string') {
      return { id: category, nombre: category, descripcion: '' };
    }

    return {
      id: category.id ?? category.nombre ?? index,
      nombre: category.nombre ?? category.name ?? 'Sin nombre',
      descripcion: category.descripcion ?? category.description ?? '',
    };
  });
};

const isDemographicCategory = (category) =>
  DEMOGRAPHIC_CATEGORIES.has(normalizeCategoryName(category.nombre));

export function PublicMangaComicDetailView() {
  const { id } = useParams();
  const { state } = useLocation();

  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const backTo = getCatalogReturnTo(
    state?.catalogReturnTo,
    '/catalogo/mangas'
  );

  useEffect(() => {
    if (!selectedCategory) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedCategory(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCategory]);

  useEffect(() => {
    let cancelled = false;

    publicMangaComicCatalogService.get(id)
      .then((record) => {
        if (!cancelled) setResult({ id, retry, record });
      })
      .catch((error) => {
        if (!cancelled) {
          setResult({ id, retry, error: error.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, retry]);

  const current =
    result?.id === id && result?.retry === retry ? result : null;

  const record = current?.record;
  const type = record?.type || record?.tipo;
  const categories = record ? getCategories(record) : [];
  const demographicCategories = categories.filter(isDemographicCategory);
  const genreCategories = categories.filter((category) => !isDemographicCategory(category));

  return (
    <>
      <Link className="public-catalog-back" to={backTo}>
        <ArrowLeft size={16} />
        Volver al catálogo
      </Link>

      {!current ? (
        <p className="public-catalog-message" role="status">
          Cargando el tomo…
        </p>
      ) : current.error ? (
        <div className="public-catalog-message" role="alert">
          <h1>No pudimos mostrar el tomo</h1>
          <p>{current.error}</p>
          <button
            className="public-catalog-primary"
            onClick={() => setRetry((value) => value + 1)}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <article className="public-game-detail">
          <div className="public-game-detail-cover">
            <MangaComicCover record={record} />
          </div>

          <div className="public-game-detail-intro">
            <span className="public-game-type">
              {type === 'comic' ? 'CÓMIC' : 'MANGA'} · TOMO {record.volume_number}
            </span>

            <h1>{record.title}</h1>

            {record.author && (
              <p className="public-manga-author">
                <span>Por</span> {record.author}
              </p>
            )}

            {demographicCategories.length > 0 && (
              <section className="public-manga-classification" aria-label="Clasificación demográfica">
                <span className="public-manga-section-label">Clasificación demográfica</span>
                <div className="public-game-tags">
                  {demographicCategories.map((category) => (
                    <button
                      className="public-game-tag-demographic public-manga-category-button"
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      disabled={!category.descripcion}
                      aria-label={category.descripcion ? `Ver descripción de ${category.nombre}` : category.nombre}
                    >
                      {category.nombre}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {genreCategories.length > 0 && (
              <section className="public-manga-genres" aria-label="Géneros y categorías">
                <span className="public-manga-section-label">Géneros y categorías</span>
                <div className="public-game-tags">
                  {genreCategories.map((category) => (
                    <button
                      className="public-manga-category-button"
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      disabled={!category.descripcion}
                      aria-label={category.descripcion ? `Ver descripción de ${category.nombre}` : category.nombre}
                    >
                      {category.nombre}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {record.synopsis && (
              <section className="public-manga-synopsis" aria-labelledby="public-manga-synopsis-title">
                <h2 id="public-manga-synopsis-title">Sinopsis</h2>
                <p>{record.synopsis}</p>
              </section>
            )}
          </div>

          <dl className="public-game-specs">
            <div>
              <dt><BookOpen size={18} />Tipo</dt>
              <dd>{type === 'comic' ? 'Cómic' : 'Manga'}</dd>
            </div>

            <div>
              <dt><FileText size={18} />Páginas</dt>
              <dd>{record.pages}</dd>
            </div>

            <div>
              <dt><Copy size={18} />Copias registradas</dt>
              <dd>{record.copies}</dd>
            </div>

            <div>
              <dt>Estado</dt>
              <dd>Activo</dd>
            </div>
          </dl>
        </article>
      )}

      {selectedCategory && (
        <div
          className="public-manga-category-modal-backdrop"
          onClick={() => setSelectedCategory(null)}
        >
          <section
            className="public-manga-category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-manga-category-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="public-manga-category-modal-heading">
              <h2 id="public-manga-category-modal-title">{selectedCategory.nombre}</h2>
              <button
                type="button"
                className="public-manga-category-modal-close"
                onClick={() => setSelectedCategory(null)}
                aria-label="Cerrar descripción"
              >
                <X size={20} />
              </button>
            </div>
            <p>{selectedCategory.descripcion}</p>
          </section>
        </div>
      )}
    </>
  );
}
