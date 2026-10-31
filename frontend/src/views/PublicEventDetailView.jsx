import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Hourglass, IdCard, Repeat } from 'lucide-react';
import { activityService } from '../services/activityService';
import { ActivityChangeNotice } from '../components/cards/ActivityChangeNotice';
import { EventCover, EventStatus } from '../components/catalog/PublicEventCard';
import { EventActions } from '../components/catalog/PublicEventSignUp';
import { ageLabel, effectiveDate, formatDate, formatDuration, formatTime, frequencyLabel } from '../utils/activity';
import { getScheduleReturnTo } from '../utils/publicSchedule';

export function PublicEventDetailView() {
  const { id } = useParams();
  const { state } = useLocation();
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const backTo = getScheduleReturnTo(state?.eventsReturnTo);

  useEffect(() => {
    let cancelled = false;
    activityService.getPublic(id).then((activity) => { if (!cancelled) setResult({ id, retry, activity }); })
      .catch((error) => { if (!cancelled) setResult({ id, retry, error: error.message, notFound: error.status === 404 }); });
    return () => { cancelled = true; };
  }, [id, retry]);

  const current = result?.id === id && result?.retry === retry ? result : null;
  const activity = current?.activity;
  const date = activity && effectiveDate(activity);

  return (
    <>
      <Link className="public-catalog-back" to={backTo}><ArrowLeft size={16} />Volver al cronograma</Link>
      {!current ? <p className="public-catalog-message" role="status">Cargando el evento…</p>
        : current.error ? <div className="public-catalog-message" role="alert"><h1>No pudimos mostrar el evento</h1><p>{current.notFound ? 'Este evento ya no está disponible en el cronograma.' : current.error}</p>{!current.notFound && <button className="public-catalog-primary" onClick={() => setRetry((value) => value + 1)}>Reintentar</button>}</div>
          : <article className={`public-game-detail public-event-detail ${activity.estado}`}>
            <div className="public-game-detail-cover"><EventCover activity={activity} /></div>
            <div className="public-game-detail-intro">
              <div className="public-event-labels"><span className="public-game-type">{activity.tipo.nombre.toUpperCase()}</span><EventStatus activity={activity} /></div>
              <h1>{activity.nombre}</h1>
              <ActivityChangeNotice activity={activity} />
              <p>{activity.descripcion}</p>
            </div>
            <dl className="public-game-specs">
              <div><dt><Calendar size={18} />Fecha</dt><dd>{formatDate(date)}</dd></div>
              <div><dt><Clock size={18} />Hora</dt><dd>{formatTime(date)}</dd></div>
              <div><dt><Hourglass size={18} />Duración</dt><dd>{formatDuration(activity.duracion)}</dd></div>
              <div><dt><IdCard size={18} />Edad mínima</dt><dd>{ageLabel(activity.edad_minima)}</dd></div>
              <div><dt><Repeat size={18} />Frecuencia</dt><dd>{frequencyLabel(activity.frecuencia)}</dd></div>
            </dl>
            <div className="public-event-detail-actions">
              <EventActions activity={activity} onActivityChange={(updated) => setResult((previous) => ({ ...previous, activity: updated }))} />
            </div>
          </article>}
    </>
  );
}
