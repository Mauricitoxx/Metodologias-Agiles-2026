import { useState } from 'react';
import { RefreshCw, ShieldCheck, Copy, Check } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';

const avatars = ['🤖', '🎮', '👾', '🎲', '🛡️', '⚡'];

export function StaffForm({ initialItem, onDone }) {
  const { data, addItem, updateItem } = useAdmin();
  const [form, setForm] = useState({
    name: initialItem?.name || initialItem?.nombre || '',
    nickname: initialItem?.nickname || '',
    email: initialItem?.email || '',
    role: initialItem?.role || 'Administrador',
    status: initialItem?.status || 'activo',
    avatarEmoji: initialItem?.avatarEmoji || '🛡️',
    ...initialItem,
  });

  const generateTempPassword = () => `Frikio2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const [password, setPassword] = useState(generateTempPassword);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  async function submit(event) {
    event.preventDefault();
    setError('');

    const emailTrimmed = form.email.trim().toLowerCase();
    const nameTrimmed = form.name.trim();

    if (!nameTrimmed) {
      return setError('Por favor ingresá un nombre válido.');
    }

    if (!emailTrimmed) {
      return setError('Por favor ingresá un correo válido.');
    }

    if (
      (data.admins || []).some(
        (item) => item.email.toLowerCase() === emailTrimmed && item.id !== form.id
      )
    ) {
      return setError('Ya hay un miembro de staff registrado con ese correo.');
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        name: nameTrimmed,
        nombre: nameTrimmed,
        email: emailTrimmed,
        password: password,
      };

      const saved = initialItem
        ? await updateItem('admins', payload)
        : await addItem('admins', payload);

      if (saved) {
        onDone();
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="staff-form" onSubmit={submit}>
      <fieldset className="retro-panel">
        <legend className="profile-legend">▣ IDENTIDAD DE STAFF</legend>
        <label className="section-small-label">AVATAR DE STAFF</label>
        <div className="avatar-choices">
          {avatars.map((avatar) => (
            <button
              type="button"
              key={avatar}
              aria-label={`Avatar ${avatar}`}
              aria-pressed={form.avatarEmoji === avatar}
              className={form.avatarEmoji === avatar ? 'selected' : ''}
              onClick={() => setForm((prev) => ({ ...prev, avatarEmoji: avatar }))}
            >
              {avatar}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label htmlFor="staff-name">NOMBRE COMPLETO</label>
          <input
            id="staff-name"
            className="form-input"
            type="text"
            value={form.name || form.nombre || ''}
            required
            placeholder="Ej: Kira Vance"
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value, nombre: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="staff-email">CORREO INSTITUCIONAL</label>
          <input
            id="staff-email"
            className="form-input"
            type="email"
            value={form.email || ''}
            required
            placeholder="Ej: kira.v@frikioteca.com"
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="staff-role">ROL Y PERMISOS</label>
          <input
            id="staff-role"
            className="form-input"
            value="Administrador (Acceso Total)"
            disabled
            readOnly
          />
        </div>
      </fieldset>

      {!initialItem && (
        <section className="retro-panel temporary-key">
          <label htmlFor="staff-key" className="section-small-label">
            CLAVE TEMPORAL GENERADA
          </label>
          <div className="key-row">
            <input
              className="form-input"
              id="staff-key"
              value={password}
              readOnly
              style={{ fontWeight: 'bold', letterSpacing: '1px' }}
            />
            <button
              type="button"
              className="search-btn-blue"
              aria-label="Copiar clave temporal"
              title="Copiar contraseña"
              onClick={handleCopyPassword}
            >
              {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            </button>
            <button
              type="button"
              className="search-btn-blue"
              aria-label="Generar otra clave temporal"
              title="Generar nueva clave"
              onClick={() => setPassword(generateTempPassword())}
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <small>
            {copied ? '✅ ¡Contraseña copiada al portapapeles!' : '🔑 Esta clave se registrará en la base de datos para que el usuario pueda iniciar sesión.'}
          </small>
        </section>
      )}

      {error && (
        <p className="error-text" role="alert" style={{ color: '#ef4444', fontWeight: 600 }}>
          {error}
        </p>
      )}

      <div className="staff-submit-row">
        {initialItem && (
          <button type="button" className="btn-secondary" onClick={onDone} disabled={loading}>
            Cancelar
          </button>
        )}
        <button className="primary-cta-yellow-btn" type="submit" disabled={loading}>
          <ShieldCheck size={18} /> {loading ? 'PROCESANDO...' : initialItem ? 'GUARDAR CAMBIOS' : 'REGISTRAR STAFF'}
        </button>
      </div>
    </form>
  );
}
