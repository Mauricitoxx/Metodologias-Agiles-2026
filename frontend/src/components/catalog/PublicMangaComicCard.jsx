import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

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

export function MangaComicCover({ record }) {
  const image = record.image || record.imagen;

  return image ? (
    <img
      className="public-game-cover"
      src={image}
      alt={`Portada de ${record.title}`}
      loading="lazy"
    />
  ) : (
    <div
      className="public-game-cover-placeholder"
      role="img"
      aria-label={`${record.title}, sin portada`}
    >
      <BookOpen size={44} />
      <span>MANGA Y CÓMIC</span>
    </div>
  );
}

export function PublicMangaComicCard({
  record,
  returnTo = '/catalogo/mangas',
}) {
  const type = record.type || record.tipo;
  const categories = getCategories(record);

  return (
    <article className="public-game-card">
      <div className="public-game-image">
        <MangaComicCover record={record} />
        <span className="public-game-available">
          ACTIVO
        </span>
      </div>

      <div className="public-game-body">
        <p className="public-game-type">
          {type === 'comic' ? 'CÓMIC' : 'MANGA'}
        </p>

        <h2>{record.title}</h2>

        <div className="public-game-meta">
          <span>Tomo {record.volume_number}</span>
          <span aria-hidden="true">•</span>
          <span>{record.pages} páginas</span>
        </div>

        <div className="public-game-meta">
          <span>{record.copies} copias registradas</span>
        </div>

        {categories.length > 0 && (
          <section className="public-manga-card-categories" aria-label="Categorías">
            <h3>Categorías</h3>
            <div className="public-game-tags">
              {categories.map((category) => (
                <span key={category.id}>{category.nombre}</span>
              ))}
            </div>
          </section>
        )}

        <Link
          className="public-catalog-primary"
          to={`/catalogo/mangas/${record.id}`}
          state={{ catalogReturnTo: returnTo }}
          aria-label={`Ver detalles de ${record.title}, tomo ${record.volume_number}`}
        >
          Ver detalles
        </Link>
      </div>
    </article>
  );
}