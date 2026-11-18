import { useState } from 'react';
import { RefreshCw, ShieldCheck, Copy, Check, KeyRound } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { generateTempPassword } from '../utils/tempPassword';

function TemporaryKey({ password, onRegenerate, hint }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: la clave sigue visible para copiarla a mano
    }
  };

  return (
    <section className="retro-panel temporary-key">
      <label htmlFor="staff-key" className="section-small-label">
        CLAVE TEMPORAL
      </label>
      <div className="key-row">
        <input
          className="form-input staff-key-input"
          id="staff-key"
          value={password}
          readOnly
          onFocus={(event) => event.target.select()}
        />
        <button
          type="button"
          className="search-btn-blue"
          aria-label="Copiar clave temporal"
          title="Copiar contraseña"
          onClick={copy}
        >
          {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
        </button>
        {onRegenerate && (
          <button
            type="button"
            className="search-btn-blue"
            aria-label="Generar otra clave temporal"
            title="Generar nueva clave"
            onClick={onRegenerate}
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>
      <small>{copied ? '✅ ¡Contraseña copiada al portapapeles!' : hint}</small>
    </section>
  );
}

export function StaffForm({ initialItem, onDone }) {
  const { staff, addItem, updateItem } = useAdmin();
  const editing = Boolean(initialItem);

  const [name, setName] = useState(initialItem?.name || '');
  const [email, setEmail] = useState(initialItem?.email || '');
  const [password, setPassword] = useState(generateTempPassword);
  // Al editar, la contraseña solo cambia si se pide restablecerla
  const [resetPassword, setResetPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Después de guardar se muestra la clave para entregarla: no se puede volver a consultar
  const [saved, setSaved] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setError('');

    const emailTrimmed = email.trim().toLowerCase();
    const nameTrimmed = name.trim();

    if (!nameTrimmed) return setError('Por favor ingresá un nombre válido.');
    if (!emailTrimmed) return setError('Por favor ingresá un correo válido.');

    if (staff.some((item) => item.email.toLowerCase() === emailTrimmed && item.id !== initialItem?.id)) {
      return setError('Ya hay un miembro de staff registrado con ese correo.');
    }

    const sendsPassword = !editing || resetPassword;
    setLoading(true);

    try {
      const payload = {
        id: initialItem?.id,
        nombre: nameTrimmed,
        email: emailTrimmed,
        ...(sendsPassword ? { password } : {}),
      };

      if (editing) await updateItem('admins', payload);
      else await addItem('admins', payload);

      if (sendsPassword) setSaved({ name: nameTrimmed, email: emailTrimmed, password });
      else onDone();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar.');
    } finally {
      setLoading(false);
    }
  }

  if (saved) {
    return (
      <div className="staff-form">
        <section className="retro-panel staff-saved">
          <h3>
            <ShieldCheck size={18} /> {editing ? 'CONTRASEÑA RESTABLECIDA' : 'MIEMBRO REGISTRADO'}
          </h3>
          <p>
            <strong>{saved.name}</strong> ya puede iniciar sesión con <strong>{saved.email}</strong> y esta clave
            temporal.
          </p>
        </section>
        <TemporaryKey
          password={saved.password}
          hint="🔑 Copiala y entregásela ahora: por seguridad no se vuelve a mostrar."
        />
        <div className="staff-submit-row">
          <button className="primary-cta-yellow-btn" type="button" onClick={onDone}>
            <Check size={18} /> LISTO
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="staff-form" onSubmit={submit}>
      <fieldset className="retro-panel">
        <legend className="profile-legend">▣ IDENTIDAD DE STAFF</legend>

        <div className="form-group">
          <label htmlFor="staff-name">NOMBRE COMPLETO</label>
          <input
            id="staff-name"
            className="form-input"
            type="text"
            value={name}
            required
            maxLength={100}
            placeholder="Ej: Kira Vance"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="staff-email">CORREO INSTITUCIONAL</label>
          <input
            id="staff-email"
            className="form-input"
            type="email"
            value={email}
            required
            maxLength={254}
            placeholder="Ej: kira.v@frikioteca.com"
            onChange={(e) => setEmail(e.target.value)}
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

      {editing && (
        <label className="staff-reset-toggle">
          <input
            type="checkbox"
            checked={resetPassword}
            onChange={(event) => setResetPassword(event.target.checked)}
          />
          <KeyRound size={15} /> Restablecer la contraseña con una clave temporal nueva
        </label>
      )}

      {(!editing || resetPassword) && (
        <TemporaryKey
          password={password}
          onRegenerate={() => setPassword(generateTempPassword())}
          hint="🔑 Al guardar, esta será la contraseña para iniciar sesión."
        />
      )}

      {error && (
        <p className="error-text staff-form-error" role="alert">
          {error}
        </p>
      )}

      <div className="staff-submit-row">
        {editing && (
          <button type="button" className="btn-secondary" onClick={onDone} disabled={loading}>
            Cancelar
          </button>
        )}
        <button className="primary-cta-yellow-btn" type="submit" disabled={loading}>
          <ShieldCheck size={18} /> {loading ? 'PROCESANDO...' : editing ? 'GUARDAR CAMBIOS' : 'REGISTRAR STAFF'}
        </button>
      </div>
    </form>
  );
}
