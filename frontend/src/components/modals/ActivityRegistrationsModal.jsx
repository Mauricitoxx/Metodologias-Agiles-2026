import { useEffect, useState } from 'react';
import { Mail, RefreshCw, Trash2, Users, X } from 'lucide-react';
import { activityService } from '../../services/activityService';
import { effectiveDate, formatDate, formatTime } from '../../utils/activity';

const RegistrationRow = ({ activityId, registration, onDeleted }) => {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      onDeleted(registration, await activityService.removeRegistration(activityId, registration.id));
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  };

  return (
    <li className="activity-types-row">
      {confirming ? (
        <div className="activity-types-confirm">
          <span>
            ¿Eliminar a <strong>{registration.nombre}</strong>? Se libera su cupo.
          </span>
          <button type="button" className="btn-confirm btn-confirm-danger" onClick={remove} disabled={busy}>
            Eliminar
          </button>
          <button type="button" className="btn-secondary" onClick={() => setConfirming(false)} disabled={busy}>
            No
          </button>
        </div>
      ) : (
        <div className="activity-types-view">
          <div className="activity-registration-info">
            <span className="activity-types-name">
              {registration.nombre}
              <span className="activity-registration-age">
                {registration.edad === null ? 'Edad sin dato' : `${registration.edad} años`}
              </span>
            </span>
            <a className="activity-registration-email" href={`mailto:${registration.email}`}>
              <Mail size={12} /> {registration.email}
            </a>
          </div>
          <button
            type="button"
            className="activity-types-icon-btn danger"
            onClick={() => setConfirming(true)}
            aria-label={`Eliminar la inscripción de ${registration.nombre}`}
            title="Eliminar inscripción"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
      {error && (
        <span className="error-text" role="alert">
          {error}
        </span>
      )}
    </li>
  );
};

// `onChanged` receives the activity with the updated counts after each deletion
export const ActivityRegistrationsModal = ({ activity, onChanged, onClose }) => {
  const [registrations, setRegistrations] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const date = effectiveDate(activity);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    let ignore = false;
    activityService
      .listRegistrations(activity.id)
      .then((data) => {
        if (!ignore) setRegistrations(data);
      })
      .catch((error) => {
        if (!ignore) setLoadError(error.message);
      });
    return () => {
      ignore = true;
    };
  }, [activity.id, reloadKey]);

  const retry = () => {
    setLoadError('');
    setReloadKey((key) => key + 1);
  };

  const handleDeleted = (registration, updatedActivity) => {
    setRegistrations((prev) => prev.filter((item) => item.id !== registration.id));
    onChanged(registration, updatedActivity);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-registrations-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon-title">
            <div className="alert-circle-icon info">
              <Users size={20} />
            </div>
            <h3 className="modal-title" id="activity-registrations-title">
              Inscriptos
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">
            <strong>{activity.nombre}</strong> ({formatDate(date)} {formatTime(date)})
            {registrations && (
              <>
                <br />
                {registrations.length}/{activity.cupo} cupos ocupados
              </>
            )}
          </p>

          {loadError ? (
            <div className="empty-state-box" role="alert">
              <p>{loadError}</p>
              <button className="text-link activity-retry" onClick={retry}>
                <RefreshCw size={12} /> Reintentar
              </button>
            </div>
          ) : registrations === null ? (
            <p className="activity-form-hint">Cargando inscriptos…</p>
          ) : registrations.length === 0 ? (
            <p className="activity-form-hint">Todavía no hay inscriptos para esta fecha.</p>
          ) : (
            <ul className="activity-types-list">
              {registrations.map((registration) => (
                <RegistrationRow
                  key={registration.id}
                  activityId={activity.id}
                  registration={registration}
                  onDeleted={handleDeleted}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
