import { useState } from 'react';
import { Edit3, Trash2, Ban, CalendarClock, Calendar, Clock, Users, Repeat, CalendarDays } from 'lucide-react';
import { StatusBadge, CategoryTag } from '../common/Badge';
import { effectiveDate, formatDate, formatDuration, formatTime, frequencyLabel } from '../../utils/activity';

export const ActivityCard = ({ activity, onEdit, onPostpone, onCancel, onDelete }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const date = effectiveDate(activity);
  const isPostponed = Boolean(activity.fecha_hora_postergada);
  const isClosed = activity.estado === 'cancelada' || activity.estado === 'inactiva';

  return (
    <article className={`catalog-item-card activity-card activity-${activity.estado}`}>
      <div className="card-main-content">
        <div className="card-thumb-container card-thumb-event">
          {activity.imagen && !imageFailed ? (
            <img
              src={activity.imagen}
              alt={activity.nombre}
              className="card-thumb-img"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="event-calendar-badge">
              <CalendarDays size={28} className="event-trophy-icon" />
            </div>
          )}
        </div>

        <div className="card-info-container">
          <div className="card-header-row">
            <CategoryTag>{activity.tipo.nombre}</CategoryTag>
            <StatusBadge status={activity.estado} />
          </div>

          <h3 className="card-item-title activity-title">{activity.nombre}</h3>

          <div className="card-meta-row">
            <span className="meta-spec">
              <Calendar size={13} className="meta-icon" /> {formatDate(date)}
            </span>
            <span className="meta-spec">
              • <Clock size={13} className="meta-icon" /> {formatTime(date)}
            </span>
          </div>

          {isPostponed && (
            <p className="activity-original-date">
              Fecha original: <s>{formatDate(activity.fecha_hora)} {formatTime(activity.fecha_hora)}</s>
            </p>
          )}

          <div className="card-footer-chips">
            <span className="slots-badge">
              <Users size={12} /> {activity.cupo} cupos
            </span>
            <span className="slots-badge">{formatDuration(activity.duracion)}</span>
            <span className="slots-badge">
              <Repeat size={12} /> {frequencyLabel(activity.frecuencia)}
            </span>
            <span className="slots-badge">+{activity.edad_minima}</span>
          </div>
        </div>
      </div>

      <div className="card-actions-bar">
        <button className="btn-card-action btn-edit" onClick={() => onEdit(activity)}>
          <Edit3 size={15} /> EDITAR
        </button>
        <button
          className="btn-card-action btn-ficha"
          onClick={() => onPostpone(activity)}
          disabled={isClosed}
          title={isClosed ? 'No se puede postergar una actividad cancelada o inactiva' : 'Postergar'}
        >
          <CalendarClock size={15} /> POSTERGAR
        </button>
        <button
          className="btn-card-action btn-ficha activity-btn-cancel"
          onClick={() => onCancel(activity)}
          disabled={isClosed}
          title={isClosed ? 'La actividad ya está cancelada o inactiva' : 'Cancelar'}
          aria-label="Cancelar actividad"
        >
          <Ban size={15} />
        </button>
        <button
          className="btn-card-action btn-icon-baja"
          onClick={() => onDelete(activity)}
          title="Eliminar definitivamente"
          aria-label="Eliminar actividad"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
};
