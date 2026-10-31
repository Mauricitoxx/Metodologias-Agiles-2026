import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, Clock, Repeat, Users } from 'lucide-react';
import { ActivityChangeNotice } from '../cards/ActivityChangeNotice';
import { ageLabel, ageTitle, effectiveDate, formatDuration, formatTime, frequencyLabel } from '../../utils/activity';
import { isInProgress } from '../../utils/publicSchedule';

export function EventCover({ activity }) {
  const [failed, setFailed] = useState(false);
  return activity.imagen && !failed
    ? <img className="public-game-cover" src={activity.imagen} alt={`Imagen de ${activity.nombre}`} loading="lazy" onError={() => setFailed(true)} />
    : <div className="public-game-cover-placeholder" role="img" aria-label={`${activity.nombre}, sin imagen`}><CalendarDays size={36} /><span>EVENTO</span></div>;
}

// Lo que el cliente necesita saber antes que nada: si el evento ya empezó o cambió.
export function EventStatus({ activity }) {
  if (activity.estado === 'cancelada') return <span className="public-event-status cancelada">CANCELADO</span>;
  if (isInProgress(activity)) return <span className="public-event-status en-curso">EN CURSO</span>;
  if (activity.estado === 'postergada') return <span className="public-event-status postergada">NUEVA FECHA</span>;
  return null;
}

export function PublicEventCard({ activity, returnTo }) {
  const date = effectiveDate(activity);
  return (
    <article className={`public-event-card ${activity.estado}`}>
      <div className="public-event-image"><EventCover activity={activity} /></div>
      <div className="public-event-body">
        <div className="public-event-labels">
          <time dateTime={date}>{formatTime(date)}</time>
          <EventStatus activity={activity} />
        </div>
        <p className="public-game-type">{activity.tipo.nombre.toUpperCase()}</p>
        <h3>{activity.nombre}</h3>
        <div className="public-game-meta">
          <span><Clock size={13} aria-hidden="true" />{formatDuration(activity.duracion)}</span>
          <span aria-hidden="true">•</span>
          <span><Users size={13} aria-hidden="true" />{activity.cupo}<span className="public-sr-only"> cupos</span></span>
          {activity.frecuencia !== 'unica' && <><span aria-hidden="true">•</span><span><Repeat size={13} aria-hidden="true" />{frequencyLabel(activity.frecuencia)}</span></>}
        </div>
        <div className="public-game-tags"><span title={ageTitle(activity.edad_minima)}>{ageLabel(activity.edad_minima)}</span></div>
        <ActivityChangeNotice activity={activity} />
        <Link className="public-event-link" to={`/eventos/${activity.id}`} state={{ eventsReturnTo: returnTo }} aria-label={`Ver detalles de ${activity.nombre}`}>Ver detalles<ChevronRight size={16} aria-hidden="true" /></Link>
      </div>
    </article>
  );
}
