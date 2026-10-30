
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Copy, FileText } from 'lucide-react';
import { publicMangaComicCatalogService } from '../services/publicMangaComicCatalogService';
import { MangaComicCover } from '../components/catalog/PublicMangaComicCard';
import { getCatalogReturnTo } from '../utils/catalog';

export function PublicMangaComicDetailView() {
  const { id } = useParams();
  const { state } = useLocation();

  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);

  const backTo = getCatalogReturnTo(
    state?.catalogReturnTo,
    '/catalogo/mangas'
  );

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
  const categories = record?.categories || record?.categorias || [];

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

            <div className="public-game-tags">
              {categories.map((category) => (
                <span key={category.id}>{category.nombre}</span>
              ))}
            </div>

            <p>
              {record.synopsis || 'Este tomo todavía no tiene una sinopsis cargada.'}
            </p>
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
    </>
  );
}
