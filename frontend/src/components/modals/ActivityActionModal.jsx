import { useEffect, useState } from 'react';
import { AlertTriangle, Ban, CalendarClock, Eye, EyeOff, Undo2, X } from 'lucide-react';
import { activityService } from '../../services/activityService';
import { AutoResizeTextarea } from '../common/AutoResizeTextarea';
import { DateTimePicker } from '../common/DateTimePicker';
import { effectiveDate, formatDate, formatTime, toInputDateTime, toInputValue } from '../../utils/activity';

const REASON_MAX_LENGTH = 200;

const ACTIONS = {
  cancel: {
    title: 'Cancelar actividad',
    icon: Ban,
    iconClass: 'warning',
    confirmLabel: 'Sí, cancelar',
    confirmClass: 'btn-confirm-warning',
    withReason: true,
    run: (activity, { motivo, alcance }) => activityService.cancel(activity.id, { motivo, alcance })
  },
  postpone: {
    title: 'Postergar actividad',
    icon: CalendarClock,
    iconClass: 'info',
    confirmLabel: 'Postergar',
    confirmClass: 'btn-confirm-info',
    withReason: true,
    run: (activity, { newDate, motivo, alcance }) =>
      activityService.postpone(activity.id, { fechaHoraPostergada: newDate, motivo, alcance })
  },
  undoPostpone: {
    title: 'Deshacer postergación',
    icon: Undo2,
    iconClass: 'info',
    confirmLabel: 'Volver a la fecha original',
    confirmClass: 'btn-confirm-info',
    run: (activity) => activityService.undoPostpone(activity.id)
  },
  deactivate: {
    title: 'Inactivar actividad',
    icon: EyeOff,
    iconClass: 'warning',
    confirmLabel: 'Sí, inactivar',
    confirmClass: 'btn-confirm-warning',
    run: (activity) => activityService.deactivate(activity.id)
  },
  activate: {
    title: 'Reactivar actividad',
    icon: Eye,
    iconClass: 'restore',
    confirmLabel: 'Sí, reactivar',
    confirmClass: 'btn-confirm-restore',
    run: (activity) => activityService.activate(activity.id)
  },
  delete: {
    title: 'Eliminar definitivamente',
    icon: AlertTriangle,
    iconClass: 'danger',
    confirmLabel: 'Eliminar definitivamente',
    confirmClass: 'btn-confirm-danger',
    run: (activity) => activityService.remove(activity.id)
  }
};

const SCOPES = [
  { value: 'fecha', label: 'Solo esta fecha' },
  { value: 'serie', label: 'Toda la serie' }
];

const SCOPE_HINTS = {
  cancel: {
    fecha: 'La serie sigue: la próxima fecha se mantiene como siempre.',
    serie: 'La serie se detiene: no se generan más fechas.'
  },
  postpone: {
    fecha: 'Las próximas fechas siguen calculándose desde la fecha original.',
    serie: 'Las próximas fechas se calculan desde la nueva fecha.'
  }
};

const formatDateTime = (value) => `${formatDate(value)} ${formatTime(value)}`;

const ActionMessage = ({ action, activity }) => {
  const name = <strong>{activity.nombre}</strong>;
  const when = formatDateTime(effectiveDate(activity));

  switch (action) {
    case 'cancel':
      return (
        <p className="confirm-message">
          ¿Querés cancelar {name} ({when})? Los clientes la van a ver como <em>cancelada</em> en el cronograma.
        </p>
      );
    case 'postpone':
      return (
        <p className="confirm-message">
          Elegí la nueva fecha para {name}.
          <br />
          Fecha original: {formatDateTime(activity.fecha_hora)}.
          <br />
          Los clientes van a ver la fecha original tachada.
        </p>
      );
    case 'undoPostpone':
      return (
        <p className="confirm-message">
          {name} vuelve a su fecha original: <strong>{formatDateTime(activity.fecha_hora)}</strong>. Se descarta la
          fecha postergada ({when}).
        </p>
      );
    case 'deactivate':
      return (
        <p className="confirm-message">
          {name} deja de mostrarse a los clientes. No se borra: podés reactivarla cuando quieras.
        </p>
      );
    case 'activate':
      return (
        <p className="confirm-message">
          {name} vuelve a mostrarse a los clientes
          {activity.fecha_hora_postergada ? <> como <em>postergada</em> ({when})</> : <> ({when})</>}.
        </p>
      );
    case 'delete':
      return (
        <>
          <p className="confirm-message">
            ¿Querés eliminar {name} ({when})? Se borra <strong>definitivamente</strong> y no se puede deshacer.
          </p>
          <p className="activity-form-hint">Si solo querés ocultarla a los clientes, usá Inactivar.</p>
        </>
      );
    default:
      return null;
  }
};

export const ActivityActionModal = ({ action, activity, onClose, onDone }) => {
  const config = ACTIONS[action];
  const isRecurring = activity.frecuencia !== 'unica';
  const [newDate, setNewDate] = useState('');
  // Postponing again starts from the current postponement; a cancellation has its own reason
  const isRepostpone = action === 'postpone' && activity.estado === 'postergada';
  const [motivo, setMotivo] = useState(isRepostpone ? activity.motivo || '' : '');
  const [alcance, setAlcance] = useState(isRepostpone ? activity.alcance || 'fecha' : 'fecha');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [minDate] = useState(() => toInputValue(new Date()));

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
      if (newDate < minDate) return setError('La nueva fecha debe ser posterior a la actual');
      if (newDate === toInputDateTime(activity.fecha_hora)) {
        return setError('La nueva fecha debe ser distinta a la fecha original');
      }
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await config.run(activity, {
        newDate,
        motivo: motivo.trim() || null,
        alcance: isRecurring ? alcance : undefined
      });
      onDone(action, activity, result);
    } catch (requestError) {
      setError(Object.values(requestError.fieldErrors || {})[0] || requestError.message);
      setSubmitting(false);
    }
  };

  const Icon = config.icon;

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
          <ActionMessage action={action} activity={activity} />

          {action === 'postpone' && (
            <div className="form-group">
              <label htmlFor="activity-postpone-date">NUEVA FECHA Y HORA *</label>
              <DateTimePicker
                id="activity-postpone-date"
                value={newDate}
                onChange={(value) => {
                  setNewDate(value);
                  setError('');
                }}
                min={minDate}
                invalid={Boolean(error)}
              />
            </div>
          )}

          {config.withReason && isRecurring && (
            <div className="form-group">
              <span className="section-small-label" id="activity-scope-label">
                ¿A QUÉ FECHAS AFECTA?
              </span>
              <div className="filter-pills-row" role="radiogroup" aria-labelledby="activity-scope-label">
                {SCOPES.map((scope) => (
                  <button
                    key={scope.value}
                    type="button"
                    role="radio"
                    aria-checked={alcance === scope.value}
                    className={`filter-pill ${alcance === scope.value ? 'active' : ''}`}
                    onClick={() => setAlcance(scope.value)}
                  >
                    {scope.label.toUpperCase()}
                  </button>
                ))}
              </div>
              <span className="activity-form-hint">{SCOPE_HINTS[action][alcance]}</span>
            </div>
          )}

          {config.withReason && (
            <div className="form-group">
              <label htmlFor="activity-action-reason">MOTIVO (OPCIONAL)</label>
              <AutoResizeTextarea
                id="activity-action-reason"
                className="form-textarea"
                rows={2}
                maxLength={REASON_MAX_LENGTH}
                placeholder={action === 'cancel' ? 'Ej: Se suspende por lluvia' : 'Ej: Cambio de sede'}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
              />
              <span className="activity-form-hint">
                Lo ven los clientes. {motivo.length}/{REASON_MAX_LENGTH}
              </span>
            </div>
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
