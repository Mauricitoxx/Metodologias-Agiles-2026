import { useEffect, useState } from 'react';
import { AlertTriangle, Ban, CalendarClock, X } from 'lucide-react';
import { activityService } from '../../services/activityService';
import { formatDate, formatTime, toInputValue } from '../../utils/activity';

const ACTIONS = {
  cancel: {
    title: 'Cancelar actividad',
    icon: Ban,
    iconClass: 'warning',
    confirmLabel: 'Sí, cancelar',
    confirmClass: 'btn-confirm-warning',
    run: (activity) => activityService.cancel(activity.id)
  },
  delete: {
    title: 'Eliminar actividad',
    icon: AlertTriangle,
    iconClass: 'danger',
    confirmLabel: 'Sí, eliminar',
    confirmClass: 'btn-confirm-danger',
    run: (activity) => activityService.remove(activity.id)
  },
  postpone: {
    title: 'Postergar actividad',
    icon: CalendarClock,
    iconClass: 'info',
    confirmLabel: 'Postergar',
    confirmClass: 'btn-confirm-info',
    run: (activity, newDate) => activityService.postpone(activity.id, newDate)
  }
};

const minPostponeDate = (activity) => {
  const afterOriginal = new Date(new Date(activity.fecha_hora).getTime() + 60 * 1000);
  const now = new Date();
  return toInputValue(afterOriginal > now ? afterOriginal : now);
};

export const ActivityActionModal = ({ action, activity, onClose, onDone }) => {
  const config = ACTIONS[action];
  const [newDate, setNewDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [minDate] = useState(() => minPostponeDate(activity));

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, submitting]);

  const confirm = async () => {
    if (action === 'postpone') {
      if (!newDate) return setError('Ingresá la nueva fecha y hora');
      if (newDate < minDate) {
        return setError('La nueva fecha debe ser posterior a la actual y a la fecha original');
      }
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await config.run(activity, newDate);
      onDone(action, activity, result);
    } catch (requestError) {
      setError(Object.values(requestError.fieldErrors || {})[0] || requestError.message);
      setSubmitting(false);
    }
  };

  const Icon = config.icon;
  const when = `${formatDate(activity.fecha_hora_postergada || activity.fecha_hora)} ${formatTime(activity.fecha_hora_postergada || activity.fecha_hora)}`;

  return (
    <div className="modal-backdrop" onClick={submitting ? undefined : onClose}>
      <div
        className="modal-window modal-window-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-action-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon-title">
            <div className={`alert-circle-icon ${config.iconClass}`}>
              <Icon size={20} />
            </div>
            <h3 className="modal-title" id="activity-action-title">
              {config.title}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} disabled={submitting} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {action === 'cancel' && (
            <p className="confirm-message">
              ¿Querés cancelar <strong>{activity.nombre}</strong> ({when})? Los clientes la van a ver como{' '}
              <em>cancelada</em> en el cronograma.
            </p>
          )}
          {action === 'delete' && (
            <p className="confirm-message">
              ¿Querés eliminar <strong>{activity.nombre}</strong> ({when})? Se borra{' '}
              <strong>definitivamente</strong> y no se puede deshacer.
            </p>
          )}
          {action === 'postpone' && (
            <>
              <p className="confirm-message">
                Elegí la nueva fecha para <strong>{activity.nombre}</strong>. Fecha original:{' '}
                {formatDate(activity.fecha_hora)} {formatTime(activity.fecha_hora)}.
              </p>
              <div className="form-group">
                <label htmlFor="activity-postpone-date">NUEVA FECHA Y HORA *</label>
                <input
                  id="activity-postpone-date"
                  type="datetime-local"
                  className={`form-input ${error ? 'is-invalid' : ''}`}
                  min={minDate}
                  value={newDate}
                  onChange={(event) => {
                    setNewDate(event.target.value);
                    setError('');
                  }}
                  aria-invalid={Boolean(error)}
                  autoFocus
                />
              </div>
            </>
          )}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Volver
          </button>
          <button className={`btn-confirm ${config.confirmClass}`} onClick={confirm} disabled={submitting}>
            {submitting ? 'Procesando…' : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
