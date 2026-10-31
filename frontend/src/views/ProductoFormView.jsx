import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, Save } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { productoService, TIPOS_PRODUCTO } from '../services/productoService';

// Límites del backend (schemas/producto.py)
const NOMBRE_MAX_LENGTH = 50;
const DESCRIPCION_MAX_LENGTH = 500;

const ESTADOS = [
  { value: true, label: 'ACTIVO', hint: 'Los clientes lo ven en la carta.' },
  { value: false, label: 'INACTIVO', hint: 'No se muestra en la carta. Podés reactivarlo cuando quieras.' }
];

const formFromProducto = (producto) => ({
  nombre: producto?.nombre ?? '',
  descripcion: producto?.descripcion ?? '',
  tipo: producto?.tipo ?? '',
  // Mismo formato que el diseño: 8500,00
  precio: producto ? Number(producto.precio).toFixed(2).replace('.', ',') : '',
  activo: producto?.activo ?? true
});

const validate = (form) => {
  const errors = {};
  ['nombre', 'descripcion', 'tipo', 'precio'].forEach((field) => {
    if (!String(form[field]).trim()) errors[field] = 'Campo obligatorio';
  });

  if (form.nombre.trim().length > NOMBRE_MAX_LENGTH) errors.nombre = `Máximo ${NOMBRE_MAX_LENGTH} caracteres`;
  if (form.descripcion.trim().length > DESCRIPCION_MAX_LENGTH) {
    errors.descripcion = `Máximo ${DESCRIPCION_MAX_LENGTH} caracteres`;
  }
  if (!errors.precio) {
    const precio = form.precio.trim().replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(precio)) errors.precio = 'Ingresá un importe con hasta dos decimales';
    else if (Number(precio) <= 0) errors.precio = 'El precio debe ser mayor a cero';
  }
  return errors;
};

// HU-11 / HU-12: alta y edición de productos de la carta, según "Registro de carta" del Figma
export function ProductoFormView() {
  const { modalState, closeModal, cargarProductosBackend, showToast } = useAdmin();
  const producto = modalState.item;
  const editing = modalState.mode === 'edit';

  const [form, setForm] = useState(() => formFromProducto(editing ? producto : null));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleEscape = (event) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeModal]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const save = async (event) => {
    event.preventDefault();
    setFormError('');
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setFormError('Faltan completar campos obligatorios o hay valores inválidos.');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo,
      precio: Number(form.precio.trim().replace(',', '.')),
      activo: form.activo
    };

    setSaving(true);
    try {
      const saved = editing
        ? await productoService.update(producto.id, payload)
        : await productoService.create(payload);
      showToast(editing ? `Producto "${saved.nombre}" actualizado` : `Producto "${saved.nombre}" dado de alta con éxito`);
      // Recarga para respetar el orden por tipo y nombre
      await cargarProductosBackend();
      closeModal();
    } catch (error) {
      setErrors(error.fieldErrors || {});
      setFormError(error.message);
      setSaving(false);
    }
  };

  const invalid = (name) => (errors[name] ? 'is-invalid' : '');
  const fieldError = (name) =>
    errors[name] && (
      <span id={`producto-${name}-error`} className="error-text" role="alert">
        {errors[name]}
      </span>
    );
  const fieldProps = (name) => ({
    id: `producto-${name}`,
    name,
    value: form[name],
    onChange: (event) => setField(name, event.target.value),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `producto-${name}-error` : undefined
  });

  const estadoActual = ESTADOS.find((estado) => estado.value === form.activo);

  return (
    <div className="entity-form-view">
      <button className="small-back" onClick={closeModal}>
        <ArrowLeft size={15} /> Cancelar
      </button>

      <section className="retro-panel entity-intro">
        <span className="section-small-label">ADMIN PANEL | GESTIÓN MAESTRA</span>
        <h2>{editing ? 'EDICIÓN DE CARTA' : 'REGISTRO DE CARTA'}</h2>
        <p>
          {editing ? 'Modificá' : 'Alta de'} productos en la carta gastronómica. Campos marcados con * son obligatorios.
        </p>
      </section>

      <form onSubmit={save} noValidate>
        <section className="retro-panel form-section">
          <h3>
            <span className="step-number blue">1</span> DATOS DEL PRODUCTO
          </h3>

          <div className="form-group">
            <label htmlFor="producto-id">ID DE PRODUCTO · SISTEMA</label>
            <div className="producto-id-field">
              <input
                id="producto-id"
                className="form-input"
                value={editing ? `#${producto.id}` : ''}
                placeholder="Se asignará al guardar"
                readOnly
              />
              <Lock size={15} aria-hidden="true" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="producto-nombre">NOMBRE *</label>
            <input
              type="text"
              className={`form-input ${invalid('nombre')}`}
              placeholder="Ej.: Hamburguesa de la casa"
              maxLength={NOMBRE_MAX_LENGTH}
              {...fieldProps('nombre')}
            />
            <span className="activity-form-hint">Máx. {NOMBRE_MAX_LENGTH} caracteres · Debe ser único</span>
            {fieldError('nombre')}
          </div>

          <div className="form-group">
            <label htmlFor="producto-descripcion">DESCRIPCIÓN *</label>
            <textarea
              className={`form-textarea ${invalid('descripcion')}`}
              rows={4}
              placeholder="Describí el producto de la carta..."
              maxLength={DESCRIPCION_MAX_LENGTH}
              {...fieldProps('descripcion')}
            />
            <span className="activity-form-hint">
              Máx. {DESCRIPCION_MAX_LENGTH} caracteres · {form.descripcion.length}/{DESCRIPCION_MAX_LENGTH}
            </span>
            {fieldError('descripcion')}
          </div>

          <div className="form-group">
            <label htmlFor="producto-tipo">TIPO DE PRODUCTO *</label>
            <select className={`form-select ${invalid('tipo')}`} {...fieldProps('tipo')}>
              <option value="" disabled>
                Seleccioná un tipo de producto
              </option>
              {Object.entries(TIPOS_PRODUCTO).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <span className="activity-form-hint">Elegí un tipo del catálogo de tipos de producto.</span>
            {fieldError('tipo')}
          </div>
        </section>

        <section className="retro-panel form-section">
          <h3>
            <span className="step-number yellow">2</span> PRECIOS
          </h3>

          <div className="form-group">
            <label htmlFor="producto-precio">PRECIO *</label>
            <input
              type="text"
              inputMode="decimal"
              className={`form-input ${invalid('precio')}`}
              placeholder="Ej.: 8500,00"
              {...fieldProps('precio')}
            />
            <span className="activity-form-hint">Importe con dos decimales.</span>
            {fieldError('precio')}
          </div>
        </section>

        <section className="retro-panel form-section">
          <h3>
            <span className="step-number pink">3</span> ESTADO DEL PRODUCTO
          </h3>

          <div className="form-group">
            <span className="section-small-label" id="producto-estado-label">
              ESTADO *
            </span>
            <div className="filter-pills-row" role="radiogroup" aria-labelledby="producto-estado-label">
              {ESTADOS.map((estado) => (
                <button
                  key={estado.label}
                  type="button"
                  role="radio"
                  aria-checked={form.activo === estado.value}
                  className={`filter-pill ${form.activo === estado.value ? 'active' : ''}`}
                  onClick={() => setField('activo', estado.value)}
                >
                  {estado.label}
                </button>
              ))}
            </div>
            <span className="activity-form-hint">{estadoActual.hint}</span>
          </div>
        </section>

        {formError && (
          <p className="error-text form-error" role="alert">
            {formError}
          </p>
        )}

        <div className="retro-panel form-save-bar">
          <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
            Descartar
          </button>
          <button className="btn-primary" type="submit" disabled={saving}>
            <Save size={16} /> {saving ? 'Guardando…' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </form>
    </div>
  );
}
