import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Settings2, CalendarDays } from 'lucide-react';
import { StatusBadge } from '../components/common/Badge';
import { AutoResizeTextarea } from '../components/common/AutoResizeTextarea';
import { DateTimePicker } from '../components/common/DateTimePicker';
import { ActivityTypesModal } from '../components/modals/ActivityTypesModal';
import { activityService } from '../services/activityService';
import {
  ACTIVITY_FREQUENCIES,
  effectiveDate,
  formatDate,
  formatTime,
  toInputDateTime,
  toInputValue
} from '../utils/activity';

const REASON_MAX_LENGTH = 200;

const STATUS_OPTIONS = {
  activa: { label: 'Activa', hint: 'Los clientes la ven en el cronograma.' },
  cancelada: { label: 'Cancelada', hint: 'Los clientes la ven como cancelada.' },
  inactiva: { label: 'Inactiva', hint: 'Los clientes no la ven. No se borra: podés reactivarla cuando quieras.' }
};
const CREATE_STATUSES = ['activa', 'inactiva'];
const EDIT_STATUSES = ['activa', 'cancelada', 'inactiva'];

const SCOPES = [
  { value: 'fecha', label: 'Solo esta fecha' },
  { value: 'serie', label: 'Toda la serie' }
];

const isWebUrl = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const formatDateTime = (value) => `${formatDate(value)} ${formatTime(value)}`;

const numberInputProps = {
  type: 'number',
  inputMode: 'numeric',
  step: 1,
  onWheel: (event) => event.currentTarget.blur()
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
  imagen: '',
  motivo: '',
  alcance: 'fecha'
};

const formFromActivity = (activity) => ({
  nombre: activity.nombre,
  descripcion: activity.descripcion,
  tipo_id: String(activity.tipo.id),
  fecha_hora: toInputDateTime(effectiveDate(activity)),
  duracion: String(activity.duracion),
  cupo: String(activity.cupo),
  edad_minima: String(activity.edad_minima),
  frecuencia: activity.frecuencia,
  estado: activity.estado === 'postergada' ? 'activa' : activity.estado,
  imagen: activity.imagen,
  motivo: activity.motivo || '',
  alcance: activity.alcance || 'fecha'
});

const predictResult = (activity, form, dateChanged) => {
  if (!activity) return { status: form.estado, postponing: false, undoing: false };

  const backToOriginal = form.fecha_hora === toInputDateTime(activity.fecha_hora);
  const replacesDate = form.estado === 'inactiva' && !activity.fecha_hora_postergada;
  const postponing = dateChanged && !backToOriginal && !replacesDate;
  const undoing = dateChanged && backToOriginal && Boolean(activity.fecha_hora_postergada);
  const postponed = dateChanged ? postponing : Boolean(activity.fecha_hora_postergada);

  const status = form.estado === 'activa' && postponed ? 'postergada' : form.estado;
  return { status, postponing, undoing };
};

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

export function ActivityFormView({ activity, types, onTypeCreated, onTypeUpdated, onTypeDeleted, onClose, onSaved }) {
  const editing = Boolean(activity);
  const initialForm = editing ? formFromActivity(activity) : emptyForm;

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [minDate] = useState(() => toInputValue(new Date()));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (typesOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, typesOpen]);

  const dateChanged = !editing || form.fecha_hora !== initialForm.fecha_hora;
  const result = predictResult(activity, form, dateChanged);
  const cancelling = editing && form.estado === 'cancelada' && activity.estado !== 'cancelada';
  const showReason = editing && ['cancelada', 'postergada'].includes(result.status);
  const showScope = form.frecuencia !== 'unica' && (cancelling || (result.postponing && form.estado !== 'cancelada'));

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const change = (event) => {
    const { name, value } = event.target;
    setField(name, value);
    if (name === 'imagen') setImageFailed(false);
  };

  const buildPayload = () => {
    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      tipo_id: Number(form.tipo_id),
      // An unchanged date is sent as stored, so the backend does not treat it as a new date
      fecha_hora: dateChanged ? form.fecha_hora : effectiveDate(activity),
      duracion: Number(form.duracion),
      cupo: Number(form.cupo),
      edad_minima: Number(form.edad_minima),
      frecuencia: form.frecuencia,
      estado: form.estado,
      imagen: form.imagen.trim()
    };
    if (showReason) payload.motivo = form.motivo.trim() || null;
    if (showScope) payload.alcance = form.alcance;
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

  const handleTypeCreated = (created) => {
    onTypeCreated(created);
    if (!form.tipo_id) setField('tipo_id', String(created.id));
  };

  const handleTypeDeleted = (deleted) => {
    onTypeDeleted(deleted);
    if (form.tipo_id === String(deleted.id)) setField('tipo_id', '');
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

  const statusOptions = editing ? EDIT_STATUSES : CREATE_STATUSES;
  const isStatusDisabled = (status) => status === 'cancelada' && activity?.estado === 'inactiva';

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
            <span className="step-number green">1</span> ESTADO
          </h3>

          {editing && (
            <p className="activity-status-current">
              Estado actual: <StatusBadge status={activity.estado} />
            </p>
          )}

          <div className="form-group">
            <span className="section-small-label" id="activity-estado-label">
              {editing ? 'CAMBIAR A' : 'ESTADO INICIAL'}
            </span>
            <div className="filter-pills-row" role="radiogroup" aria-labelledby="activity-estado-label">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={form.estado === status}
                  className={`filter-pill ${form.estado === status ? 'active' : ''}`}
                  onClick={() => setField('estado', status)}
                  disabled={isStatusDisabled(status)}
                  title={isStatusDisabled(status) ? 'Reactivala primero para poder cancelarla' : undefined}
                >
                  {STATUS_OPTIONS[status].label.toUpperCase()}
                </button>
              ))}
            </div>
            <span className="activity-form-hint">{STATUS_OPTIONS[form.estado].hint}</span>
            {fieldError('estado')}
          </div>

          {editing && result.status !== activity.estado && (
            <p className="activity-status-preview">
              Al guardar queda: <StatusBadge status={result.status} />
            </p>
          )}
        </section>

        <section className="retro-panel form-section">
          <h3>
            <span className="step-number blue">2</span> DATOS DE LA ACTIVIDAD
          </h3>

          <div className="form-group">
            <label htmlFor="activity-nombre">NOMBRE *</label>
            <input className={`form-input ${invalid('nombre')}`} maxLength={100} {...fieldProps('nombre')} />
            {fieldError('nombre')}
          </div>

          <div className="form-group">
            <label htmlFor="activity-descripcion">DESCRIPCIÓN *</label>
            <AutoResizeTextarea className={`form-textarea ${invalid('descripcion')}`} rows={3} {...fieldProps('descripcion')} />
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
              <button type="button" className="btn-secondary" onClick={() => setTypesOpen(true)}>
                <Settings2 size={14} /> Gestionar
              </button>
            </div>
            {fieldError('tipo_id')}
          </div>
        </section>

        <section className="retro-panel form-section">
          <h3>
            <span className="step-number yellow">3</span> FECHA Y CUPO
          </h3>

          <div className="form-group">
            <label htmlFor="activity-fecha_hora">FECHA Y HORA *</label>
            <DateTimePicker
              id="activity-fecha_hora"
              value={form.fecha_hora}
              onChange={(value) => setField('fecha_hora', value)}
              min={dateChanged ? minDate : undefined}
              invalid={Boolean(errors.fecha_hora)}
              describedBy={errors.fecha_hora ? 'activity-fecha_hora-error' : undefined}
            />
            {fieldError('fecha_hora')}
            {activity?.fecha_hora_postergada && !dateChanged && (
              <span className="activity-form-hint">
                Postergada. Fecha original: {formatDateTime(activity.fecha_hora)}. Si volvés a esa fecha se deshace la
                postergación.
              </span>
            )}
            {result.postponing && result.status === 'postergada' && (
              <span className="activity-form-notice" role="status">
                Al guardar, la actividad queda <strong>postergada</strong>: los clientes van a ver la fecha original (
                {formatDateTime(activity.fecha_hora)}) tachada.
              </span>
            )}
            {result.postponing && result.status === 'cancelada' && (
              <span className="activity-form-notice" role="status">
                La actividad sigue cancelada. Si la reactivás, queda postergada a esta nueva fecha.
              </span>
            )}
            {result.undoing && (
              <span className="activity-form-notice" role="status">
                Volviste a la fecha original: al guardar se deshace la postergación.
              </span>
            )}
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="activity-duracion">DURACIÓN (MIN) *</label>
              <input {...numberInputProps} min={1} className={`form-input ${invalid('duracion')}`} {...fieldProps('duracion')} />
              {fieldError('duracion')}
            </div>
            <div className="form-group">
              <label htmlFor="activity-cupo">CUPO *</label>
              <input {...numberInputProps} min={1} className={`form-input ${invalid('cupo')}`} {...fieldProps('cupo')} />
              {fieldError('cupo')}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="activity-edad_minima">EDAD MÍNIMA *</label>
              <input {...numberInputProps} min={0} className={`form-input ${invalid('edad_minima')}`} {...fieldProps('edad_minima')} />
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

          {showScope && (
            <div className="form-group">
              <span className="section-small-label" id="activity-alcance-label">
                {cancelling ? '¿QUÉ SE CANCELA?' : '¿QUÉ SE POSTERGA?'}
              </span>
              <div className="filter-pills-row" role="radiogroup" aria-labelledby="activity-alcance-label">
                {SCOPES.map((scope) => (
                  <button
                    key={scope.value}
                    type="button"
                    role="radio"
                    aria-checked={form.alcance === scope.value}
                    className={`filter-pill ${form.alcance === scope.value ? 'active' : ''}`}
                    onClick={() => setField('alcance', scope.value)}
                  >
                    {scope.label.toUpperCase()}
                  </button>
                ))}
              </div>
              {fieldError('alcance')}
            </div>
          )}

          {showReason && (
            <div className="form-group">
              <label htmlFor="activity-motivo">
                MOTIVO DE LA {result.status === 'cancelada' ? 'CANCELACIÓN' : 'POSTERGACIÓN'} (OPCIONAL)
              </label>
              <AutoResizeTextarea
                className={`form-textarea ${invalid('motivo')}`}
                rows={2}
                maxLength={REASON_MAX_LENGTH}
                placeholder={result.status === 'cancelada' ? 'Ej: Se suspende por lluvia' : 'Ej: Cambio de sede'}
                {...fieldProps('motivo')}
              />
              <span className="activity-form-hint">
                Lo ven los clientes. {form.motivo.length}/{REASON_MAX_LENGTH}
              </span>
              {fieldError('motivo')}
            </div>
          )}
        </section>

        <section className="retro-panel form-section">
          <h3>
            <span className="step-number pink">4</span> IMAGEN
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

      {typesOpen && (
        <ActivityTypesModal
          types={types}
          onCreated={handleTypeCreated}
          onUpdated={onTypeUpdated}
          onDeleted={handleTypeDeleted}
          onClose={() => setTypesOpen(false)}
        />
      )}
    </div>
  );
}
