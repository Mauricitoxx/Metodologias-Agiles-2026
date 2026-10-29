import { Ban, CalendarClock, Undo2 } from 'lucide-react';
import { SCOPE_LABELS, formatDate, formatTime } from '../../utils/activity';

/**
 * Everything about a cancellation or postponement in one box: what happened, which dates it
 * affects, the original date, the reason and the undo action.
 */
export const ActivityChangeNotice = ({ activity, onUndoPostpone }) => {
  const isCancelled = activity.estado === 'cancelada';
  const isPostponed = Boolean(activity.fecha_hora_postergada);
  if (!isCancelled && !isPostponed) return null;

  const kind = isCancelled ? 'cancelada' : 'postergada';
  const Icon = isCancelled ? Ban : CalendarClock;
  const scope = activity.frecuencia !== 'unica' && activity.alcance ? SCOPE_LABELS[activity.alcance] : null;
  // A bare cancellation is already told by the status badge
  if (isCancelled && !isPostponed && !scope && !activity.motivo) return null;

  return (
    <div className={`activity-change-notice ${kind}`}>
      <div className="activity-change-header">
        <Icon size={13} aria-hidden="true" />
        <span className="activity-change-title">
          {isCancelled ? 'CANCELADA' : 'POSTERGADA'}
          {scope && <span className="activity-change-scope"> · {scope.toUpperCase()}</span>}
        </span>
        {activity.estado === 'postergada' && (
          <button className="activity-change-undo" onClick={onUndoPostpone} title="Volver a la fecha original">
            <Undo2 size={12} /> Deshacer
          </button>
        )}
      </div>
      {isPostponed && (
        <p>
          Fecha original: <s>{formatDate(activity.fecha_hora)} {formatTime(activity.fecha_hora)}</s>
        </p>
      )}
      {activity.motivo && (
        <p>
          <strong>Motivo:</strong> {activity.motivo}
        </p>
      )}
    </div>
  );
};
