import { Link } from 'react-router-dom';
import { Dices } from 'lucide-react';
import { CatalogIcon } from './CatalogIcon';

export function GameCover({ game }) {
  const image = game.imagen || game.image;
  return image ? <img className="public-game-cover" src={image} alt={`Portada de ${game.nombre}`} loading="lazy" />
    : <div className="public-game-cover-placeholder" role="img" aria-label={`${game.nombre}, sin portada`}><Dices size={44} /><span>JUEGOS DE MESA</span></div>;
}

export function PublicGameCard({ game, returnTo = '/catalogo/juegos' }) {
  return (
    <article className="public-game-card">
      <div className="public-game-image">
        <GameCover game={game} />
        <span className="public-game-available"><CatalogIcon name="96a58" />¡DISPONIBLE!</span>
      </div>
      <div className="public-game-body">
        <p className="public-game-type">JUEGO DE MESA</p>
        <h2>{game.nombre}</h2>
        <div className="public-game-meta">
          <span><CatalogIcon name="ab1c2" />{game.jugadores_min}–{game.jugadores_max}<span className="public-sr-only"> jugadores</span></span>
          <span aria-hidden="true">•</span>
          <span><CatalogIcon name="2b113" />{game.duracion_min} min</span>
        </div>
        <div className="public-game-tags">{game.categorias?.map((category) => <span key={category.id}>{category.nombre}</span>)}</div>
        <Link className="public-catalog-primary" to={`/catalogo/juegos/${game.id}`} state={{ catalogReturnTo: returnTo }} aria-label={`Ver detalles de ${game.nombre}`}>Ver Detalles<CatalogIcon name="22e95" /></Link>
      </div>
    </article>
  );
}
