import { useState } from 'react';
import { CalendarDays, Clock, Repeat } from 'lucide-react';
import { ActivityChangeNotice } from '../cards/ActivityChangeNotice';
import { EventActions } from './PublicEventSignUp';
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

export function PublicEventCard({ activity, returnTo, onRegistered }) {
  const date = effectiveDate(activity);
  return (
    <article className={`public-event-card ${activity.estado}`}>
      <div className="public-event-image"><EventCover activity={activity} /></div>
      <div className="public-event-body">
        <div className="public-event-top">
          <div className="public-event-labels">
            <p className="public-game-type">{activity.tipo.nombre.toUpperCase()}</p>
            <EventStatus activity={activity} />
          </div>
          <time dateTime={date}>{formatTime(date)}</time>
        </div>
        <h3>{activity.nombre}</h3>
        <div className="public-game-meta">
          <span><Clock size={13} aria-hidden="true" />{formatDuration(activity.duracion)}</span>
          {activity.frecuencia !== 'unica' && <><span aria-hidden="true">•</span><span><Repeat size={13} aria-hidden="true" />{frequencyLabel(activity.frecuencia)}</span></>}
        </div>
        <div className="public-game-tags"><span title={ageTitle(activity.edad_minima)}>{ageLabel(activity.edad_minima)}</span></div>
        <ActivityChangeNotice activity={activity} />
        <div className="public-event-footer">
          <EventActions activity={activity} onRegistered={onRegistered} detailTo={`/eventos/${activity.id}`} detailState={{ eventsReturnTo: returnTo }} />
        </div>
      </div>
    </article>
  );
}
