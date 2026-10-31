import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Baby, Gauge, Play } from 'lucide-react';
import { publicGameCatalogService } from '../services/publicGameCatalogService';
import { GameCover } from '../components/catalog/PublicGameCard';
import { isValidUrl } from '../utils/validation';
import { getCatalogReturnTo } from '../utils/catalog';

export function PublicGameDetailView() {
  const { id } = useParams();
  const { state } = useLocation();
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const backTo = getCatalogReturnTo(state?.catalogReturnTo, '/catalogo/juegos');

  useEffect(() => {
    let cancelled = false;
    publicGameCatalogService.getGame(id).then((game) => { if (!cancelled) setResult({ id, retry, game }); })
      .catch((error) => { if (!cancelled) setResult({ id, retry, error: error.message }); });
    return () => { cancelled = true; };
  }, [id, retry]);

  const current = result?.id === id && result?.retry === retry ? result : null;
  const game = current?.game;
  const rules = [...(game?.reglas || [])].sort((a, b) => a.orden - b.orden);

  return (
    <>
      <Link className="public-catalog-back" to={backTo}><ArrowLeft size={16} />Volver al catálogo</Link>
      {!current ? <p className="public-catalog-message" role="status">Cargando el juego…</p>
        : current.error ? <div className="public-catalog-message" role="alert"><h1>No pudimos mostrar el juego</h1><p>{current.error}</p><button className="public-catalog-primary" onClick={() => setRetry((value) => value + 1)}>Reintentar</button></div>
          : <article className="public-game-detail">
            <div className="public-game-detail-cover"><GameCover game={game} /></div>
            <div className="public-game-detail-intro"><span className="public-game-type">JUEGO DE MESA · DISPONIBLE</span><h1>{game.nombre}</h1>
              <div className="public-game-tags">{game.categorias?.map((category) => <span key={category.id}>{category.nombre}</span>)}</div>
              <p>{game.descripcion || 'Este juego todavía no tiene una descripción cargada.'}</p>
            </div>
            <dl className="public-game-specs">
              <div><dt><Users size={18} />Jugadores</dt><dd>{game.jugadores_min}–{game.jugadores_max}</dd></div>
              <div><dt><Clock size={18} />Duración</dt><dd>{game.duracion_min} min</dd></div>
              <div><dt><Baby size={18} />Edad recomendada</dt><dd>+{game.edad_recomendada} años</dd></div>
              <div><dt><Gauge size={18} />Dificultad</dt><dd>{game.dificultad?.nombre || 'Sin especificar'}</dd></div>
            </dl>
            <section className="public-game-rules" aria-labelledby="public-game-rules-title"><h2 id="public-game-rules-title">Cómo se juega</h2>
              {rules.length ? rules.map((rule, index) => <details key={rule.id} open={index === 0}><summary>{rule.titulo}</summary><p>{rule.contenido}</p></details>) : <p>Las reglas de este juego todavía no están cargadas.</p>}
            </section>
            {isValidUrl(game.video_url) && <section className="public-game-video" aria-labelledby="public-game-video-title"><h2 id="public-game-video-title">Aprendé a jugar</h2><p>Mirá el video explicativo antes de tu próxima partida.</p><a className="public-catalog-primary" href={game.video_url.trim()} target="_blank" rel="noopener noreferrer"><Play size={16} />Ver tutorial<span className="public-sr-only"> (se abre en otra pestaña)</span></a></section>}
          </article>}
    </>
  );
}
