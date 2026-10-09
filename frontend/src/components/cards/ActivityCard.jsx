import { useState } from 'react';
import {
  Edit3,
  Trash2,
  Ban,
  CalendarClock,
  Calendar,
  Clock,
  Users,
  Repeat,
  CalendarDays,
  Eye,
  EyeOff,
  RotateCcw,
  Undo2
} from 'lucide-react';
import { StatusBadge, CategoryTag } from '../common/Badge';
import { effectiveDate, formatDate, formatDuration, formatTime, frequencyLabel } from '../../utils/activity';

export const ActivityCard = ({ activity, onEdit, onAction }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const date = effectiveDate(activity);
  const isPostponed = Boolean(activity.fecha_hora_postergada);
  const isInactive = activity.estado === 'inactiva';
  const isCancelled = activity.estado === 'cancelada';
  const isVisible = !isInactive && !isCancelled;
  const run = (type) => () => onAction(type, activity);

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
              {activity.estado === 'postergada' && (
                <button className="activity-inline-action" onClick={run('undoPostpone')}>
                  <Undo2 size={11} /> Deshacer
                </button>
              )}
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
          onClick={run('postpone')}
          disabled={!isVisible}
          title={isVisible ? 'Postergar' : 'No se puede postergar una actividad cancelada o inactiva'}
        >
          <CalendarClock size={15} /> POSTERGAR
        </button>
        {isCancelled ? (
          <button
            className="btn-card-action btn-icon-restore activity-btn-icon"
            onClick={run('activate')}
            title="Reactivar (deshacer la cancelación)"
            aria-label="Reactivar actividad cancelada"
          >
            <RotateCcw size={15} />
          </button>
        ) : (
          <button
            className="btn-card-action btn-ficha activity-btn-icon activity-btn-cancel"
            onClick={run('cancel')}
            disabled={isInactive}
            title={isInactive ? 'No se puede cancelar una actividad inactiva' : 'Cancelar'}
            aria-label="Cancelar actividad"
          >
            <Ban size={15} />
          </button>
        )}
        {isInactive ? (
          <button
            className="btn-card-action btn-icon-restore activity-btn-icon"
            onClick={run('activate')}
            title="Reactivar (volver a mostrarla a los clientes)"
            aria-label="Reactivar actividad"
          >
            <Eye size={15} />
          </button>
        ) : (
          <button
            className="btn-card-action btn-ficha activity-btn-icon"
            onClick={run('deactivate')}
            title="Inactivar (ocultarla a los clientes)"
            aria-label="Inactivar actividad"
          >
            <EyeOff size={15} />
          </button>
        )}
        <button
          className="btn-card-action btn-icon-baja"
          onClick={run('delete')}
          title="Eliminar definitivamente"
          aria-label="Eliminar actividad definitivamente"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
};
