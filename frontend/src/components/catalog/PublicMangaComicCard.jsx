
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

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
  const categories = record.categories || record.categorias || [];

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

        <div className="public-game-tags">
          {categories.map((category) => (
            <span key={category.id}>
              {category.nombre}
            </span>
          ))}
        </div>

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
