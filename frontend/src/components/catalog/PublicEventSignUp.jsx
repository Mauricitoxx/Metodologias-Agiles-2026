import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Info, X } from 'lucide-react';
import { activityService } from '../../services/activityService';
import { effectiveDate, formatDate, formatTime } from '../../utils/activity';
import { signUpStatus, spotsLabel, spotsLevel } from '../../utils/publicSchedule';

export function EventSpots({ activity }) {
  if (activity.estado === 'cancelada') return null;
  const percent = activity.cupo ? Math.round((activity.cupos_disponibles / activity.cupo) * 100) : 0;
  return (
    <div className={`public-event-spots ${spotsLevel(activity)}`}>
      <p><strong>{spotsLabel(activity)}</strong></p>
      <div className="public-event-spots-track" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function SignUpModal({ activity, onClose, onRegistered }) {
  const titleId = useId();
  const nameRef = useRef(null);
  const [form, setForm] = useState({ nombre: '', email: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const date = effectiveDate(activity);

  useEffect(() => {
    nameRef.current?.focus();
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const change = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: undefined, general: undefined }));
  };

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.nombre.trim()) nextErrors.nombre = 'Ingresá tu nombre';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) nextErrors.email = 'Ingresá un correo electrónico válido';
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);

    setSubmitting(true);
    try {
      onRegistered(await activityService.register(activity.id, { nombre: form.nombre.trim(), email: form.email.trim() }));
      setDone(true);
    } catch (error) {
      setErrors(Object.keys(error.fieldErrors || {}).length ? error.fieldErrors : { general: error.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="public-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="public-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="public-modal-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        {done ? <div className="public-modal-done" role="status">
          <CheckCircle2 size={44} aria-hidden="true" />
          <h2 id={titleId}>¡Ya estás inscripto!</h2>
          <p>Te esperamos en <strong>{activity.nombre}</strong> el {formatDate(date)} a las {formatTime(date)}.</p>
          <button type="button" className="public-catalog-primary" onClick={onClose}>Listo</button>
        </div> : <form onSubmit={submit} noValidate>
          <p className="public-game-type">INSCRIPCIÓN</p>
          <h2 id={titleId}>{activity.nombre}</h2>
          <p className="public-modal-date">{formatDate(date)} · {formatTime(date)}</p>
          <label className="public-field">
            <span>Nombre y apellido</span>
            <input ref={nameRef} value={form.nombre} onChange={change('nombre')} maxLength={100} autoComplete="name" aria-invalid={Boolean(errors.nombre)} />
            {errors.nombre && <small role="alert">{errors.nombre}</small>}
          </label>
          <label className="public-field">
            <span>Correo electrónico</span>
            <input type="email" value={form.email} onChange={change('email')} maxLength={254} autoComplete="email" aria-invalid={Boolean(errors.email)} />
            {errors.email && <small role="alert">{errors.email}</small>}
          </label>
          {errors.general && <p className="public-modal-error" role="alert">{errors.general}</p>}
          <button type="submit" className="public-catalog-primary" disabled={submitting}>{submitting ? 'Inscribiendo…' : 'Confirmar inscripción'}</button>
        </form>}
      </div>
    </div>
  );
}

// Barra de cupos + "Inscribirme" + acceso al detalle. Sin `detailTo` (en el detalle) no muestra el botón de información.
export function EventActions({ activity, onRegistered, detailTo, detailState }) {
  const [open, setOpen] = useState(false);
  // Stable, so the modal's Escape listener and initial focus run only once
  const close = useCallback(() => setOpen(false), []);
  const status = signUpStatus(activity);
  return (
    <>
      <EventSpots activity={activity} />
      <div className="public-event-actions">
        <button type="button" className="public-catalog-primary" disabled={!status.open} onClick={() => setOpen(true)}>{status.label}</button>
        {detailTo && <Link className="public-event-info" to={detailTo} state={detailState} aria-label={`Información de ${activity.nombre}`} title="Ver información"><Info size={20} /></Link>}
      </div>
      {open && <SignUpModal activity={activity} onClose={close} onRegistered={onRegistered} />}
    </>
  );
}
