
import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';

const types = {
  boardgames: '🎲 Juego de Mesa',
  comics: '📖 Manga y Cómic',
  cards: '🃏 Cartas',
  buffet: '🍔 Buffet',
};

const prefixes = {
  boardgames: '#BG-',
  comics: '#MC-',
  cards: '#TCG-',
  buffet: '#BF-',
};

const nextCode = (type, data) =>
  `${prefixes[type]}${String(
    Math.max(
      0,
      ...(data[type] || []).map(
        item => Number(item.code?.match(/(\d+)$/)?.[1]) || 0
      )
    ) + 1
  ).padStart(3, '0')}`;

export function EntityFormView() {
  const { modalState, closeModal, data, addItem, updateItem } = useAdmin();

  const [type, setType] = useState(modalState.entityType);
  const editing = modalState.mode === 'edit';

  const [form, setForm] = useState(() => ({
    code: nextCode(modalState.entityType, data),
    title: '',
    category: 'Estrategia & Civilización',
    shelf: 'Estante A-3 · Nivel Central',
    minPlayers: 2,
    maxPlayers: 4,
    duration: '30 min',
    complexity: 3,
    volume_number: 1,
    pages: 1,
    copies: 1,
    synopsis: '',
    status: 'disponible',
    image: '',
    description: '',
    ...modalState.item,
  }));

  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const escape = event => {
      if (event.key === 'Escape') closeModal();
    };

    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [closeModal]);

  const change = event => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const field = (name, label, inputType = 'text', required = false) => (
    <div className="form-group" key={name}>
      <label htmlFor={`entity-${name}`}>
        {label}{required && ' *'}
      </label>
      <input
        className="form-input"
        id={`entity-${name}`}
        name={name}
        type={inputType}
        required={required}
        min={inputType === 'number' ? 1 : undefined}
        value={form[name] ?? ''}
        onChange={change}
      />
    </div>
  );

  function save(event) {
    event.preventDefault();
    setError('');

    if (!form.title.trim()) {
      setError('Ingresá el nombre de la entidad.');
      return;
    }

    if (
      (data[type] || []).some(
        item =>
          item.code?.toLowerCase() === form.code.trim().toLowerCase() &&
          item.id !== form.id
      )
    ) {
      setError('El código ya está registrado. Regenerá el SKU o ingresá otro.');
      return;
    }

    if (
      type === 'boardgames' &&
      Number(form.minPlayers) > Number(form.maxPlayers)
    ) {
      setError('El máximo de jugadores debe ser mayor o igual al mínimo.');
      return;
    }

    if (
      type === 'comics' &&
      (!Number.isInteger(Number(form.volume_number)) ||
        Number(form.volume_number) < 1 ||
        !Number.isInteger(Number(form.pages)) ||
        Number(form.pages) < 1 ||
        !Number.isInteger(Number(form.copies)) ||
        Number(form.copies) < 1)
    ) {
      setError('Volumen, páginas y ejemplares deben ser números enteros positivos.');
      return;
    }

    const item = {
      ...form,
      code: form.code.trim(),
      title: form.title.trim(),
      minPlayers: Number(form.minPlayers),
      maxPlayers: Number(form.maxPlayers),
      price: Number(form.price || 0),
    };

    if (type === 'comics') {
      item.volume_number = Number(form.volume_number);
      item.pages = Number(form.pages);
      item.copies = Number(form.copies);
      item.synopsis = form.synopsis?.trim() || '';
      item.volumes = item.volume_number;
      item.description = item.synopsis;
    }

    const saved = editing
      ? updateItem(type, item)
      : addItem(type, item);

    if (saved) closeModal();
  }

  function upload(file) {
    if (!file) return;

    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError('Seleccioná una imagen PNG, JPG o WebP de hasta 5 MB.');
      return;
    }

    setUploading(true);

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const scale = Math.min(
          1,
          600 / Math.max(image.width, image.height)
        );

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        canvas.getContext('2d').drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        setForm(prev => ({
          ...prev,
          image: canvas.toDataURL('image/jpeg', 0.8),
        }));

        setUploading(false);
        setError('');
      };

      image.onerror = () => {
        setUploading(false);
        setError('No se pudo leer la imagen.');
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      setUploading(false);
      setError('No se pudo abrir el archivo.');
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="entity-form-view">
      <button className="small-back" type="button" onClick={closeModal}>
        <ArrowLeft size={15} /> Cancelar
      </button>

      <section className="retro-panel entity-intro">
        <span className="section-small-label">ADMIN PANEL | GESTIÓN MAESTRA</span>
        <h2>{editing ? 'EDICIÓN DE ENTIDAD' : 'REGISTRO DE ENTIDAD'}</h2>
        <p>Control de inventario, estado de mesas y catálogo friki en tiempo real.</p>
        <div className="dashed-divider" />
        <span className="section-small-label">TIPO DE ENTIDAD A GESTIONAR:</span>

        <div className="type-tabs">
          {Object.entries(types).map(([key, label]) => (
            <button
              key={key}
              type="button"
              disabled={editing && type !== key}
              className={type === key ? 'selected' : ''}
              onClick={() => {
                setType(key);
                setForm(prev => ({
                  ...prev,
                  code: nextCode(key, data),
                }));
                setError('');
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={save}>
        <section className="retro-panel form-section">
          <h3>
            <span className="step-number blue">1</span>
            {' '}DATOS {type === 'boardgames' ? 'DEL JUEGO' : 'DE LA ENTIDAD'}
            <small>FICHA OFICIAL</small>
          </h3>

          <div className="sku-heading">
            <label htmlFor="entity-code">CÓDIGO / SKU *</label>
            <button
              type="button"
              className="text-link"
              onClick={() =>
                setForm(prev => ({
                  ...prev,
                  code: nextCode(type, data),
                }))
              }
            >
              <RefreshCw size={12} /> REGENERAR SKU
            </button>
          </div>

          <input
            id="entity-code"
            className="form-input sku-input"
            name="code"
            value={form.code}
            required
            onChange={change}
          />

          {field(
            'title',
            type === 'boardgames' ? 'NOMBRE DEL JUEGO' : 'NOMBRE DE LA ENTIDAD',
            'text',
            true
          )}

          {field('category', 'CATEGORÍA PRINCIPAL', 'text', true)}
          {field('shelf', 'UBICACIÓN EN LA FRIKIOTECA')}

          {type === 'comics' && (
            <>
              {field('volume_number', 'NÚMERO DE VOLUMEN', 'number', true)}
              {field('pages', 'CANTIDAD DE PÁGINAS', 'number', true)}
              {field('copies', 'CANTIDAD DE EJEMPLARES', 'number', true)}

              <div className="form-group">
                <label htmlFor="entity-synopsis">SINOPSIS</label>
                <textarea
                  id="entity-synopsis"
                  className="form-textarea"
                  name="synopsis"
                  value={form.synopsis ?? ''}
                  onChange={change}
                  rows={4}
                  placeholder="Escribí una breve descripción del manga o cómic..."
                />
              </div>
            </>
          )}

          {type === 'comics' && field('author', 'AUTOR / AUTORA')}
          {type === 'cards' && field('format', 'FORMATO')}
          {type === 'buffet' && field('price', 'PRECIO ($)', 'number', true)}

          <div className="form-group">
            <label htmlFor="entity-status">ESTADO</label>
            <select
              id="entity-status"
              className="form-select"
              name="status"
              value={form.status}
              onChange={change}
            >
              <option value="disponible">Disponible</option>
              {type !== 'buffet' && (
                <>
                  <option value="en_mesa">En mesa</option>
                  <option value="en_reparacion">En reparación</option>
                </>
              )}
              <option value="baja">Baja</option>
            </select>
          </div>

          {form.status === 'en_mesa' &&
            field('tableNumber', 'MESA ASIGNADA', 'text', true)}
          {form.status === 'en_reparacion' &&
            field('notes', 'DETALLE DE REPARACIÓN')}
        </section>

        {type === 'boardgames' && (
          <section className="retro-panel form-section">
            <h3>
              <span className="step-number yellow">2</span>
              {' '}STATS DE MESA
              <small>HUD TÁCTICO</small>
            </h3>

            <div className="form-row-2">
              {field('minPlayers', 'MÍN. JUGADORES', 'number', true)}
              {field('maxPlayers', 'MÁX. JUGADORES', 'number', true)}
            </div>

            {field('duration', 'DURACIÓN', 'text', true)}

            <label className="section-small-label">
              COMPLEJIDAD DE REGLAS · {form.complexity}/5
            </label>

            <div className="complexity-buttons">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  type="button"
                  key={n}
                  aria-pressed={Number(form.complexity) === n}
                  className={Number(form.complexity) === n ? 'selected' : ''}
                  onClick={() =>
                    setForm(prev => ({ ...prev, complexity: n }))
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="retro-panel form-section">
          <h3>
            <span className="step-number pink">3</span>
            {' '}CARÁTULA DE PORTADA
            <small>Máx. 5 MB</small>
          </h3>

          <div
            className="cover-upload"
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
              event.preventDefault();
              upload(event.dataTransfer.files[0]);
            }}
          >
            <div className="cover-preview">
              {form.image
                ? <img src={form.image} alt="Vista previa de portada" />
                : <span>🎲</span>}
            </div>

            <label className="upload-target">
              <Upload size={22} />
              <span>ARRASTRÁ O SELECCIONÁ</span>
              <span className="upload-button">Subir nueva</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={event => upload(event.target.files[0])}
              />
            </label>
          </div>

          {type !== 'comics' && (
            <div className="form-group">
              <label htmlFor="entity-description">OBSERVACIONES</label>
              <textarea
                id="entity-description"
                className="form-textarea"
                name="description"
                value={form.description || ''}
                onChange={change}
                rows={3}
              />
            </div>
          )}
        </section>

        {error && (
          <p className="error-text form-error" role="alert">{error}</p>
        )}

        <div className="retro-panel form-save-bar">
          <button
            type="button"
            className="btn-secondary"
            onClick={closeModal}
          >
            <Trash2 size={15} /> Descartar
          </button>

          <button
            className="btn-primary"
            disabled={uploading}
            type="submit"
          >
            <Save size={16} />
            {uploading ? 'Procesando…' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </form>
    </div>
  );
}
