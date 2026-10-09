import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/useAdmin';
import '../styles/login.css';

const asset = (name) => `/login/${name}`;
function Icon({ name }) { return <img src={asset(name)} alt="" aria-hidden="true" />; }

export function LoginView() {
  const { login, session } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [dialogType, setDialogType] = useState('recovery');
  const recovery = useRef(null);
  const submitting = useRef(false);
  const publicSite = import.meta.env.VITE_PUBLIC_SITE_URL;

  function openDialog(type) {
    setDialogType(type);
    recovery.current.showModal();
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (failure) {
      setError(failure.message);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (session) return <Navigate to="/admin" replace />;
  return (
    <div className="login-screen">
      <header className="login-header">
        <img className="login-logo" src={asset('e7f2c.png')} alt="Logo de La Frikioteca" width="32" height="32" />
        <div className="login-brand"><p>LA FRIKIOTECA</p><span>COMIC · BUFFET · GAMES</span></div>
      </header>
      <main className="login-content">
        <section className="login-intro" aria-labelledby="login-title">
          <span className="login-badge"><Icon name="d4fee.svg" />ACCESO ADMINISTRATIVO</span>
          <div><h1 id="login-title">INICIÁ SESIÓN</h1><p>Tu base de operaciones en La Frikioteca.<br />Ingresá con tu cuenta de administración.</p></div>
        </section>
        <form className="login-card" onSubmit={submit} aria-busy={pending}>
          <h2>TU CUENTA ADMIN<Icon name="a94f4.svg" /></h2>
          <div className="login-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <div className="login-input"><Icon name="a9363.svg" /><input id="login-email" name="email" type="email" autoComplete="username" placeholder="Tu correo electrónico" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} /></div>
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <div className="login-input"><Icon name="021e8.svg" /><input id="login-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresá tu contraseña" required maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} /><button type="button" className="login-eye" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon name="49317.svg" /></button></div>
          </div>
          {error && <p className="login-error" role="alert">{error}</p>}
          <div className="login-actions">
            <button className="login-submit" type="submit" disabled={pending}><span>{pending ? 'Ingresando…' : 'Ingresar'}</span><Icon name="705ab.svg" /></button>
            <button className="login-recover" type="button" onClick={() => openDialog('recovery')}>¿Te olvidaste la contraseña?</button>
          </div>
        </form>
        <aside className="login-notice"><Icon name="b91eb.svg" /><p>Área exclusiva para administradores.<br />Usá las credenciales que te asignó el equipo.</p></aside>
        {publicSite ? <a className="login-back" href={publicSite}><Icon name="388e2.svg" />Volver a La Frikioteca</a> : <button className="login-back" type="button" onClick={() => openDialog('public')}><Icon name="388e2.svg" />Volver a La Frikioteca</button>}
      </main>
      <dialog ref={recovery} className="login-recovery-dialog" aria-labelledby="recovery-title">
        <h2 id="recovery-title">{dialogType === 'recovery' ? 'Recuperar acceso' : 'La Frikioteca'}</h2><p>{dialogType === 'recovery' ? 'Contactá al equipo de La Frikioteca para que te asignen una nueva contraseña.' : 'El sitio público estará disponible próximamente.'}</p><form method="dialog"><button className="login-submit">Entendido</button></form>
      </dialog>
    </div>
  );
}
