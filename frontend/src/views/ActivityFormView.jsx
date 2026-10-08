import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Plus, X, CalendarDays } from 'lucide-react';
import { activityService, activityTypeService } from '../services/activityService';
import { ACTIVITY_FREQUENCIES, ACTIVITY_STATUSES } from '../utils/activity';

const EDITABLE_STATUSES = ['activa', 'inactiva'];
const KEEP_STATUS = '';

// <input type="datetime-local"> works with "YYYY-MM-DDTHH:mm" in local time
const toInputDateTime = (value) => (value ? value.slice(0, 16) : '');
const nowForInput = () => {
  const now = new Date();
  const pad = (number) => String(number).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const isWebUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const emptyForm = {
  nombre: '',
  descripcion: '',
  tipo_id: '',
  fecha_hora: '',
  duracion: '',
  cupo: '',
  edad_minima: '',
  frecuencia: 'unica',
  estado: 'activa',
  imagen: ''
};

const formFromActivity = (activity) => ({
  nombre: activity.nombre,
  descripcion: activity.descripcion,
  tipo_id: String(activity.tipo.id),
  fecha_hora: toInputDateTime(activity.fecha_hora),
  duracion: String(activity.duracion),
  cupo: String(activity.cupo),
  edad_minima: String(activity.edad_minima),
  frecuencia: activity.frecuencia,
  // Cancelled/postponed activities keep their status unless the admin picks another one
  estado: EDITABLE_STATUSES.includes(activity.estado) ? activity.estado : KEEP_STATUS,
  imagen: activity.imagen
});

const validate = (form, { dateChanged }) => {
  const errors = {};
  const required = ['nombre', 'descripcion', 'tipo_id', 'fecha_hora', 'duracion', 'cupo', 'edad_minima', 'frecuencia', 'imagen'];
  required.forEach((field) => {
    if (!String(form[field]).trim()) errors[field] = 'Campo obligatorio';
  });

  const positiveInteger = (field) => {
    if (errors[field]) return;
    const number = Number(form[field]);
    if (!Number.isInteger(number) || number <= 0) errors[field] = 'Debe ser un número entero mayor a 0';
  };
  positiveInteger('duracion');
  positiveInteger('cupo');

  if (!errors.edad_minima) {
    const age = Number(form.edad_minima);
    if (!Number.isInteger(age) || age < 0) errors.edad_minima = 'Debe ser un número entero mayor o igual a 0';
  }
  if (!errors.fecha_hora && dateChanged && new Date(form.fecha_hora) <= new Date()) {
    errors.fecha_hora = 'La fecha y hora deben ser posteriores a la actual';
  }
  if (!errors.imagen && !isWebUrl(form.imagen.trim())) {
    errors.imagen = 'Debe ingresar una URL web válida';
  }
  if (form.nombre.trim().length > 100) errors.nombre = 'Máximo 100 caracteres';
  return errors;
};

export function ActivityFormView({ activity, types, onTypeCreated, onClose, onSaved }) {
  const editing = Boolean(activity);
  const initialForm = editing ? formFromActivity(activity) : emptyForm;

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newType, setNewType] = useState(null); // null = hidden, string = input value
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const dateChanged = !editing || form.fecha_hora !== initialForm.fecha_hora;

  const change = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (name === 'imagen') setImageFailed(false);
  };

  const buildPayload = () => {
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      tipo_id: Number(form.tipo_id),
      // An unchanged date is sent as stored, so the backend does not treat it as a new date
      fecha_hora: dateChanged ? form.fecha_hora : activity.fecha_hora,
      duracion: Number(form.duracion),
      cupo: Number(form.cupo),
      edad_minima: Number(form.edad_minima),
      frecuencia: form.frecuencia,
      imagen: form.imagen.trim()
    };
    if (form.estado !== KEEP_STATUS) payload.estado = form.estado;
    return payload;
  };

  const save = async (event) => {
    event.preventDefault();
    setFormError('');
    const validationErrors = validate(form, { dateChanged });
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setFormError('Faltan completar campos obligatorios o hay valores inválidos.');
      return;
    }

    setSaving(true);
    try {
      const saved = editing
        ? await activityService.update(activity.id, buildPayload())
        : await activityService.create(buildPayload());
      onSaved(saved, editing);
    } catch (error) {
      setErrors(error.fieldErrors || {});
      setFormError(error.message);
      setSaving(false);
    }
  };

  const createType = async () => {
    const nombre = (newType || '').trim();
    if (!nombre) return setErrors((prev) => ({ ...prev, tipo_id: 'Ingresá el nombre del nuevo tipo' }));
    try {
      const created = await activityTypeService.create(nombre);
      onTypeCreated(created);
      setForm((prev) => ({ ...prev, tipo_id: String(created.id) }));
      setErrors((prev) => ({ ...prev, tipo_id: undefined }));
      setNewType(null);
    } catch (error) {
      setErrors((prev) => ({ ...prev, tipo_id: error.fieldErrors?.nombre || error.message }));
    }
  };

  const invalid = (name) => (errors[name] ? 'is-invalid' : '');
  const fieldError = (name) =>
    errors[name] && (
      <span id={`activity-${name}-error`} className="error-text" role="alert">
        {errors[name]}
      </span>
    );
  const fieldProps = (name) => ({
    id: `activity-${name}`,
    name,
    value: form[name],
    onChange: change,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `activity-${name}-error` : undefined
  });

  const canKeepStatus = editing && !EDITABLE_STATUSES.includes(activity.estado);
  const currentStatusLabel = ACTIVITY_STATUSES.find((status) => status.value === activity?.estado)?.label;

  return (
    <div className="entity-form-view">
      <button className="small-back" onClick={onClose}>
        <ArrowLeft size={15} /> Volver al cronograma
      </button>

      <section className="retro-panel entity-intro">
        <span className="section-small-label">ADMIN PANEL | ACTIVIDADES</span>
        <h2>{editing ? 'EDITAR ACTIVIDAD' : 'NUEVA ACTIVIDAD'}</h2>
        <p>Todos los campos son obligatorios. La fecha debe ser posterior a la actual.</p>
      </section>

      <form onSubmit={save} noValidate>
        <section className="retro-panel form-section">
          <h3>
            <span className="step-number blue">1</span> DATOS DE LA ACTIVIDAD
          </h3>

          <div className="form-group">
            <label htmlFor="activity-nombre">NOMBRE *</label>
            <input className={`form-input ${invalid('nombre')}`} maxLength={100} {...fieldProps('nombre')} />
            {fieldError('nombre')}
          </div>

          <div className="form-group">
            <label htmlFor="activity-descripcion">DESCRIPCIÓN *</label>
            <textarea className={`form-textarea ${invalid('descripcion')}`} rows={3} {...fieldProps('descripcion')} />
            {fieldError('descripcion')}
          </div>

          <div className="form-group">
            <label htmlFor="activity-tipo_id">TIPO *</label>
            <div className="activity-type-row">
              <select className={`form-select ${invalid('tipo_id')}`} {...fieldProps('tipo_id')}>
                <option value="">Seleccioná un tipo</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nombre}
                  </option>
                ))}
              </select>
              {newType === null && (
                <button type="button" className="btn-secondary" onClick={() => setNewType('')}>
                  <Plus size={14} /> Nuevo
                </button>
              )}
            </div>
            {newType !== null && (
              <div className="activity-type-row">
                <input
                  className="form-input"
                  aria-label="Nombre del nuevo tipo"
                  placeholder="Ej: Presentación de libro"
                  maxLength={50}
                  value={newType}
                  onChange={(event) => setNewType(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      createType();
                    }
                  }}
                  autoFocus
                />
                <button type="button" className="btn-primary" onClick={createType}>
                  Agregar
                </button>
                <button type="button" className="btn-secondary" onClick={() => setNewType(null)} aria-label="Cancelar nuevo tipo">
                  <X size={14} />
                </button>
              </div>
            )}
            {fieldError('tipo_id')}
          </div>
        </section>

        <section className="retro-panel form-section">
          <h3>
            <span className="step-number yellow">2</span> FECHA Y CUPO
          </h3>

          <div className="form-group">
            <label htmlFor="activity-fecha_hora">FECHA Y HORA *</label>
            <input
              type="datetime-local"
              className={`form-input ${invalid('fecha_hora')}`}
              min={dateChanged ? nowForInput() : undefined}
              {...fieldProps('fecha_hora')}
            />
            {fieldError('fecha_hora')}
            {activity?.fecha_hora_postergada && (
              <span className="activity-form-hint">
                Esta actividad está postergada. Al cambiar el estado a Activa o Inactiva se descarta la fecha postergada.
              </span>
            )}
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="activity-duracion">DURACIÓN (MIN) *</label>
              <input type="number" min={1} step={1} className={`form-input ${invalid('duracion')}`} {...fieldProps('duracion')} />
              {fieldError('duracion')}
            </div>
            <div className="form-group">
              <label htmlFor="activity-cupo">CUPO *</label>
              <input type="number" min={1} step={1} className={`form-input ${invalid('cupo')}`} {...fieldProps('cupo')} />
              {fieldError('cupo')}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="activity-edad_minima">EDAD MÍNIMA *</label>
              <input type="number" min={0} step={1} className={`form-input ${invalid('edad_minima')}`} {...fieldProps('edad_minima')} />
              {fieldError('edad_minima')}
            </div>
            <div className="form-group">
              <label htmlFor="activity-frecuencia">FRECUENCIA *</label>
              <select className={`form-select ${invalid('frecuencia')}`} {...fieldProps('frecuencia')}>
                {ACTIVITY_FREQUENCIES.map((frequency) => (
                  <option key={frequency.value} value={frequency.value}>
                    {frequency.label}
                  </option>
                ))}
              </select>
              {fieldError('frecuencia')}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="activity-estado">ESTADO *</label>
            <select className={`form-select ${invalid('estado')}`} {...fieldProps('estado')}>
              {canKeepStatus && <option value={KEEP_STATUS}>Mantener: {currentStatusLabel}</option>}
              {ACTIVITY_STATUSES.filter((status) => EDITABLE_STATUSES.includes(status.value)).map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {fieldError('estado')}
            <span className="activity-form-hint">Para cancelar o postergar usá los botones de la tarjeta.</span>
          </div>
        </section>

        <section className="retro-panel form-section">
          <h3>
            <span className="step-number pink">3</span> IMAGEN
          </h3>
          <div className="cover-upload">
            <div className="cover-preview">
              {form.imagen && isWebUrl(form.imagen.trim()) && !imageFailed ? (
                <img src={form.imagen.trim()} alt="Vista previa de la actividad" onError={() => setImageFailed(true)} />
              ) : (
                <CalendarDays size={34} />
              )}
            </div>
            <div className="form-group activity-image-field">
              <label htmlFor="activity-imagen">URL DE LA IMAGEN *</label>
              <input type="url" placeholder="https://..." className={`form-input ${invalid('imagen')}`} maxLength={500} {...fieldProps('imagen')} />
              {fieldError('imagen')}
              {imageFailed && <span className="activity-form-hint">No se pudo cargar la vista previa. Revisá la URL.</span>}
            </div>
          </div>
        </section>

        {formError && (
          <p className="error-text form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="retro-panel form-save-bar">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Descartar
          </button>
          <button className="btn-primary" type="submit" disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando…' : editing ? 'GUARDAR CAMBIOS' : 'CREAR ACTIVIDAD'}
          </button>
        </div>
      </form>
    </div>
  );
}
