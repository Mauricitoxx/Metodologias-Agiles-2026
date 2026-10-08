import { useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
const avatars = ['🤖', '🎮', '👾', '🎲'];
export function StaffForm({ initialItem, onDone }) {
  const { data, addItem, updateItem } = useAdmin();
  const [form, setForm] = useState({ name: '', nickname: '', email: '', role: 'Gestor de Inventario', status: 'activo', avatarEmoji: '🤖', ...initialItem });
  const [password, setPassword] = useState(() => `Frikio-${crypto.randomUUID().slice(0, 8)}`);
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    if (data.admins.some(item => item.email.toLowerCase() === form.email.trim().toLowerCase() && item.id !== form.id)) return setError('Ya hay un miembro registrado con ese correo.');
    if (initialItem?.role === 'Superadmin' && form.role !== 'Superadmin' && initialItem.status === 'activo' && data.admins.filter(item => item.role === 'Superadmin' && item.status === 'activo').length <= 1) return setError('Debe quedar al menos un Superadministrador activo.');
    const item = { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() };
    const saved = initialItem ? updateItem('admins', item) : addItem('admins', item);
    if (saved) onDone();
  }
  return <form className="staff-form" onSubmit={submit}>
    <fieldset className="retro-panel"><legend className="profile-legend">▣ IDENTIDAD DE PERFIL</legend><label className="section-small-label">AVATAR DE STAFF GEEK</label><div className="avatar-choices">{avatars.map(avatar => <button type="button" key={avatar} aria-label={`Avatar ${avatar}`} aria-pressed={form.avatarEmoji === avatar} className={form.avatarEmoji === avatar ? 'selected' : ''} onClick={() => setForm(prev => ({ ...prev, avatarEmoji: avatar }))}>{avatar}</button>)}</div>
      {[['name', 'NOMBRE COMPLETO', 'text', 'Kira Vance'], ['nickname', 'APODO GEEK / GAMERTAG', 'text', '@KiraValkyrie'], ['email', 'CORREO INSTITUCIONAL', 'email', 'kira.v@lafrikioteca.com']].map(([name, label, type, placeholder]) => <div className="form-group" key={name}><label htmlFor={`staff-${name}`}>{label}</label><input id={`staff-${name}`} className="form-input" type={type} value={form[name] || ''} required={name !== 'nickname'} placeholder={placeholder} onChange={event => setForm(prev => ({ ...prev, [name]: event.target.value }))} /></div>)}
      <div className="form-group"><label htmlFor="staff-role">ROL Y PERMISOS</label><select id="staff-role" className="form-select" value={form.role} onChange={event => setForm(prev => ({ ...prev, role: event.target.value }))}><option>Gestor de Inventario</option><option>Staff Buffet</option><option>Superadmin</option></select></div>
    </fieldset>
    {!initialItem && <section className="retro-panel temporary-key"><label htmlFor="staff-key" className="section-small-label">CLAVE TEMPORAL</label><div className="key-row"><input className="form-input" id="staff-key" value={password} readOnly /><button type="button" className="search-btn-blue" aria-label="Generar clave temporal" onClick={() => setPassword(`Frikio-${crypto.randomUUID().slice(0, 8)}`)}><RefreshCw size={16} /></button></div><small>Vista previa de credencial. Su activación requiere un servidor.</small></section>}
    {error && <p className="error-text" role="alert">{error}</p>}
    <div className="staff-submit-row">{initialItem && <button type="button" className="btn-secondary" onClick={onDone}>Cancelar</button>}<button className="primary-cta-yellow-btn" type="submit"><ShieldCheck size={18} /> {initialItem ? 'GUARDAR CAMBIOS' : 'REGISTRAR ADMIN'}</button></div>
  </form>;
}
