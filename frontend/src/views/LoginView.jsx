import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';

export function LoginView() {
  const { login } = useAdmin();
  const [visible, setVisible] = useState(false);
  const [help, setHelp] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  function submit(event) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== 'admin@frikioteca.demo' || password !== 'Frikio2026!') {
      setError('Usá las credenciales de demostración indicadas abajo.');
      return;
    }
    login();
  }
  return <div className="login-view">
    <span className="admin-connected-badge"><LockKeyhole size={13} /> ACCESO ADMINISTRATIVO</span>
    <div className="admin-hub-hero"><h2 className="admin-hub-title">INICIÁ SESIÓN</h2><p className="admin-hub-subtitle">Tu base de operaciones en La Frikioteca.<br />Ingresá con tu cuenta de administración.</p></div>
    <form className="retro-panel login-form" onSubmit={submit}>
      <h3>TU CUENTA ADMIN <ShieldCheck size={18} /></h3>
      <label htmlFor="login-email">Correo electrónico</label>
      <div className="input-with-icon"><Mail size={16} /><input id="login-email" type="email" autoComplete="username" placeholder="Tu correo electrónico" value={email} onChange={e => setEmail(e.target.value)} required /></div>
      <label htmlFor="login-password">Contraseña</label>
      <div className="input-with-icon"><LockKeyhole size={16} /><input id="login-password" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresá tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button className="primary-cta-yellow-btn" type="submit">Ingresar <ArrowRight size={18} /></button>
      <button className="text-link" type="button" onClick={() => setHelp(!help)}>¿Te olvidaste la contraseña?</button>
      {help && <p className="help-copy" role="status">Esta es una demostración local. Usá la cuenta de prueba; la recuperación por correo requiere conectar un backend.</p>}
    </form>
    <div className="admin-hub-notice-box"><ShieldCheck size={20} /><p>Área exclusiva para administradores.<br />Usá las credenciales que te asignó el equipo.</p></div>
    <div className="demo-access"><strong>Acceso de demostración</strong><p>admin@frikioteca.demo<br />Frikio2026!</p><small>Datos locales · Sin autenticación de servidor</small></div>
  </div>;
}
