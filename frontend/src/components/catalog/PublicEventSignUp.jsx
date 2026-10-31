import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Copy, Info, X } from 'lucide-react';
import { activityService } from '../../services/activityService';
import { ageLabel, effectiveDate, formatDate, formatTime } from '../../utils/activity';
import { findSignUp, forgetSignUp, saveSignUp, signUpPath } from '../../utils/eventSignUps';
import { hasStarted, signUpStatus, spotsLabel, spotsLevel } from '../../utils/publicSchedule';

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

function PublicModal({ titleId, onClose, children }) {
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="public-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="public-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="public-modal-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        {children}
      </div>
    </div>
  );
}

// Enlace para cancelar desde cualquier dispositivo: lo único que el cliente necesita guardar.
export function CancelLink({ token }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}${signUpPath(token)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false); // sin permiso de portapapeles: el enlace sigue visible para copiarlo a mano
    }
  }

  return (
    <div className="public-cancel-link">
      <p>Guardá este enlace: con él podés cancelar tu inscripción desde cualquier dispositivo.</p>
      <div>
        <input readOnly value={link} aria-label="Enlace para cancelar la inscripción" onFocus={(event) => event.target.select()} />
        <button type="button" onClick={copy} aria-label="Copiar enlace"><Copy size={16} /></button>
      </div>
      {copied && <small role="status">¡Enlace copiado!</small>}
    </div>
  );
}

function validate(form, minimumAge) {
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = 'Ingresá tu nombre';
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Ingresá un correo electrónico válido';
  const age = Number(form.edad);
  if (form.edad === '' || !Number.isInteger(age) || age < 0 || age > 120) errors.edad = 'Ingresá tu edad';
  else if (age < minimumAge) errors.edad = `Tenés que tener al menos ${minimumAge} años para inscribirte`;
  return errors;
}

function SignUpModal({ activity, onClose, onSignedUp, onActivityChange }) {
  const titleId = useId();
  const nameRef = useRef(null);
  const [form, setForm] = useState({ nombre: '', email: '', edad: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState(null);
  const date = effectiveDate(activity);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const change = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
    setErrors((previous) => ({ ...previous, [field]: undefined, general: undefined }));
  };

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validate(form, activity.edad_minima);
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);

    setSubmitting(true);
    try {
      const result = await activityService.register(activity.id, { nombre: form.nombre.trim(), email: form.email.trim(), edad: Number(form.edad) });
      onSignedUp(result.actividad, result.token);
      setToken(result.token);
    } catch (error) {
      setErrors(Object.keys(error.fieldErrors || {}).length ? error.fieldErrors : { general: error.message });
      // Otro cliente pudo tomar el último lugar: se actualiza la barra de cupos
      if (error.status === 409) activityService.getPublic(activity.id).then(onActivityChange).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicModal titleId={titleId} onClose={onClose}>
      {token ? <div className="public-modal-done" role="status">
        <CheckCircle2 size={44} aria-hidden="true" />
        <h2 id={titleId}>¡Ya estás inscripto!</h2>
        <p>Te esperamos en <strong>{activity.nombre}</strong> el {formatDate(date)} a las {formatTime(date)}.</p>
        <CancelLink token={token} />
        <button type="button" className="public-catalog-primary" onClick={onClose}>Listo</button>
      </div> : <form onSubmit={submit} noValidate>
        <p className="public-game-type">INSCRIPCIÓN</p>
        <h2 id={titleId}>{activity.nombre}</h2>
        <p className="public-modal-date">{formatDate(date)} · {formatTime(date)} · {activity.edad_minima > 0 ? `Edad mínima: ${activity.edad_minima} años` : ageLabel(0)}</p>
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
        <label className="public-field">
          <span>Edad</span>
          <input type="number" inputMode="numeric" min={0} max={120} step={1} value={form.edad} onChange={change('edad')} aria-invalid={Boolean(errors.edad)} />
          {errors.edad && <small role="alert">{errors.edad}</small>}
        </label>
        {errors.general && <p className="public-modal-error" role="alert">{errors.general}</p>}
        <button type="submit" className="public-catalog-primary" disabled={submitting}>{submitting ? 'Inscribiendo…' : 'Confirmar inscripción'}</button>
      </form>}
    </PublicModal>
  );
}

function CancelSignUpModal({ activity, token, onClose, onCancelled }) {
  const titleId = useId();
  const [state, setState] = useState({ submitting: false, error: '' });

  async function cancel() {
    setState({ submitting: true, error: '' });
    try {
      onCancelled(await activityService.cancelRegistration(token));
      onClose();
    } catch (error) {
      // 404: la inscripción ya no existe (cancelada desde otro dispositivo); este navegador la olvida
      if (error.status === 404) {
        onCancelled(null);
        onClose();
        return;
      }
      setState({ submitting: false, error: error.message });
    }
  }

  return (
    <PublicModal titleId={titleId} onClose={onClose}>
      <div className="public-modal-confirm">
        <h2 id={titleId}>¿Cancelar tu inscripción?</h2>
        <p>Vas a liberar tu lugar en <strong>{activity.nombre}</strong>. Si cambiás de idea, podés volver a inscribirte mientras queden cupos.</p>
        {state.error && <p className="public-modal-error" role="alert">{state.error}</p>}
        <div className="public-modal-confirm-actions">
          <button type="button" className="public-catalog-secondary" onClick={onClose}>Volver</button>
          <button type="button" className="public-catalog-danger" onClick={cancel} disabled={state.submitting}>{state.submitting ? 'Cancelando…' : 'Sí, cancelar'}</button>
        </div>
      </div>
    </PublicModal>
  );
}

// Barra de cupos + inscripción (o su cancelación) + acceso al detalle. Sin `detailTo` (en el detalle) no muestra el botón de información.
export function EventActions({ activity, onActivityChange, detailTo, detailState }) {
  const [modal, setModal] = useState(null);
  // El token vive en localStorage: este contador vuelve a leerlo después de guardarlo u olvidarlo
  const [, setStorageVersion] = useState(0);
  // Stable, so the modal's Escape listener runs only once
  const close = useCallback(() => setModal(null), []);
  const token = findSignUp(activity);
  const status = signUpStatus(activity);
  const started = hasStarted(activity);

  function handleSignedUp(updated, newToken) {
    saveSignUp(updated, newToken);
    setStorageVersion((version) => version + 1);
    onActivityChange(updated);
  }

  function handleCancelled(updated) {
    forgetSignUp(activity.id);
    setStorageVersion((version) => version + 1);
    if (updated) onActivityChange(updated);
    else activityService.getPublic(activity.id).then(onActivityChange).catch(() => {});
  }

  return (
    <>
      <EventSpots activity={activity} />
      {token && <p className="public-event-signed-up"><CheckCircle2 size={14} aria-hidden="true" />Estás inscripto</p>}
      <div className="public-event-actions">
        {token
          ? <button type="button" className="public-catalog-secondary" disabled={started} title={started ? 'La actividad ya comenzó' : undefined} onClick={() => setModal('cancel')}>Cancelar inscripción</button>
          : <button type="button" className="public-catalog-primary" disabled={!status.open} onClick={() => setModal('signUp')}>{status.label}</button>}
        {detailTo && <Link className="public-event-info" to={detailTo} state={detailState} aria-label={`Información de ${activity.nombre}`} title="Ver información"><Info size={20} /></Link>}
      </div>
      {modal === 'signUp' && <SignUpModal activity={activity} onClose={close} onSignedUp={handleSignedUp} onActivityChange={onActivityChange} />}
      {modal === 'cancel' && <CancelSignUpModal activity={activity} token={token} onClose={close} onCancelled={handleCancelled} />}
    </>
  );
}
