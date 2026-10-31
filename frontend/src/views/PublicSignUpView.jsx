import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { activityService } from '../services/activityService';
import { EventCover } from '../components/catalog/PublicEventCard';
import { effectiveDate, formatDate, formatTime } from '../utils/activity';
import { forgetSignUp, saveSignUp } from '../utils/eventSignUps';

// Destino del enlace de cancelación: funciona en cualquier dispositivo, sin cuenta.
export function PublicSignUpView() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const [cancel, setCancel] = useState({ confirming: false, submitting: false, done: false, error: '' });

  useEffect(() => {
    let cancelled = false;
    activityService.getRegistration(token).then((registration) => {
      if (cancelled) return;
      // Abrir el enlace en otro dispositivo también lo recuerda ahí, para ver "Estás inscripto" en el cronograma
      if (registration.cancelable) saveSignUp({ id: registration.actividad.id, fecha_hora: registration.fecha_hora }, token);
      setResult({ token, retry, registration });
    }).catch((error) => { if (!cancelled) setResult({ token, retry, error: error.message, notFound: error.status === 404 }); });
    return () => { cancelled = true; };
  }, [token, retry]);

  const current = result?.token === token && result?.retry === retry ? result : null;
  const registration = current?.registration;

  async function confirmCancel() {
    setCancel((previous) => ({ ...previous, submitting: true, error: '' }));
    try {
      await activityService.cancelRegistration(token);
      forgetSignUp(registration.actividad.id);
      setCancel({ confirming: false, submitting: false, done: true, error: '' });
    } catch (error) {
      setCancel((previous) => ({ ...previous, submitting: false, error: error.message }));
    }
  }

  if (!current) return <><BackLink /><p className="public-catalog-message" role="status">Buscando tu inscripción…</p></>;

  if (current.error) {
    return <><BackLink /><div className="public-catalog-message" role="alert">
      <h1>{current.notFound ? 'No encontramos la inscripción' : 'No pudimos abrir la inscripción'}</h1>
      <p>{current.notFound ? 'El enlace no es válido o la inscripción ya fue cancelada.' : current.error}</p>
      {!current.notFound && <button className="public-catalog-primary" onClick={() => setRetry((value) => value + 1)}>Reintentar</button>}
    </div></>;
  }

  const activity = registration.actividad;
  const date = effectiveDate(activity);

  return (
    <>
      <BackLink />
      <article className="public-game-detail public-signup">
        <div className="public-game-detail-cover"><EventCover activity={activity} /></div>
        <div className="public-game-detail-intro">
          <span className="public-game-type">TU INSCRIPCIÓN</span>
          <h1>{activity.nombre}</h1>
          <p>{formatDate(date)} · {formatTime(date)}</p>
          <dl className="public-signup-data">
            <div><dt>Nombre</dt><dd>{registration.nombre}</dd></div>
            <div><dt>Correo</dt><dd>{registration.email}</dd></div>
          </dl>
        </div>
        <div className="public-event-detail-actions">
          {cancel.done ? <div className="public-modal-done" role="status">
            <CheckCircle2 size={40} aria-hidden="true" />
            <h2>Inscripción cancelada</h2>
            <p>Liberaste tu lugar. Si cambiás de idea, podés volver a inscribirte mientras queden cupos.</p>
            <Link className="public-catalog-primary" to="/eventos">Ver el cronograma</Link>
          </div> : !registration.cancelable ? <p className="public-signup-closed">
            {activity.fecha_hora === registration.fecha_hora ? 'La actividad ya comenzó: la inscripción no se puede cancelar.' : 'Esta fecha de la actividad ya pasó.'}
          </p> : cancel.confirming ? <>
            <p><strong>¿Seguro que querés cancelar?</strong> Vas a liberar tu lugar.</p>
            {cancel.error && <p className="public-modal-error" role="alert">{cancel.error}</p>}
            <div className="public-modal-confirm-actions">
              <button type="button" className="public-catalog-secondary" onClick={() => setCancel((previous) => ({ ...previous, confirming: false, error: '' }))}>Volver</button>
              <button type="button" className="public-catalog-danger" onClick={confirmCancel} disabled={cancel.submitting}>{cancel.submitting ? 'Cancelando…' : 'Sí, cancelar'}</button>
            </div>
          </> : <button type="button" className="public-catalog-secondary" onClick={() => setCancel((previous) => ({ ...previous, confirming: true }))}>Cancelar inscripción</button>}
        </div>
      </article>
    </>
  );
}

function BackLink() {
  return <Link className="public-catalog-back" to="/eventos"><ArrowLeft size={16} />Ir al cronograma</Link>;
}
