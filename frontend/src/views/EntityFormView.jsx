import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';

const types = { boardgames: '🎲 Juego de Mesa', comics: '📖 Manga y Cómic', cards: '🃏 Cartas', buffet: '🍔 Buffet' };
const prefixes = { boardgames: '#BG-', comics: '#MC-', cards: '#TCG-', buffet: '#BF-' };
const nextCode = (type, data) => `${prefixes[type]}${String(Math.max(0, ...(data[type] || []).map(item => Number(item.code?.match(/(\d+)$/)?.[1]) || 0)) + 1).padStart(3, '0')}`;

export function EntityFormView() {
  const { modalState, closeModal, data, addItem, updateItem } = useAdmin();
  const [type, setType] = useState(modalState.entityType);
  const editing = modalState.mode === 'edit';

  const [form, setForm] = useState(() => ({
    code: nextCode(type, data),
    title: '',
    nombre: '',
    category: 'Estrategia & Civilización',
    shelf: 'Estante A-3 · Nivel Central',
    minPlayers: 2,
    maxPlayers: 4,
    jugadores_min: 2,
    jugadores_max: 4,
    duration: '30 min',
    duracion_min: 30,
    complexity: 3,
    status: 'disponible',
    image: '',
    description: '',
    ...modalState.item,
    // Aseguramos que conserve el nombre tanto en title como en nombre
    title: modalState.item?.title || modalState.item?.nombre || '',
    nombre: modalState.item?.nombre || modalState.item?.title || ''
  }));

  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const escape = event => { if (event.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [closeModal]);

  const change = event => {
    const { name, value } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      // Sincronizar title y nombre dinámicamente
      ...(name === 'title' ? { nombre: value } : {}),
      ...(name === 'nombre' ? { title: value } : {})
    }));
  };

  const field = (name, label, inputType = 'text', required = false) => (
    <div className="form-group">
      <label htmlFor={`entity-${name}`}>{label}{required && ' *'}</label>
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

  async function save(event) {
    event.preventDefault();
    const titleVal = form.title?.trim() || form.nombre?.trim();
    if (!titleVal) return setError('Ingresá el nombre de la entidad.');

    if (data[type]?.some(item => item.code?.toLowerCase() === form.code?.trim().toLowerCase() && item.id !== form.id)) {
      return setError('El código ya está registrado. Regenerá el SKU o ingresá otro.');
    }

    const minP = Number(form.minPlayers || form.jugadores_min || 1);
    const maxP = Number(form.maxPlayers || form.jugadores_max || 1);

    if (type === 'boardgames' && minP > maxP) {
      return setError('El máximo de jugadores debe ser mayor o igual al mínimo.');
    }

    // Extraer número entero de minutos del campo duration (ej: "45 min" -> 45)
    const durParsed = parseInt(String(form.duration || form.duracion_min || '30').replace(/\D/g, ''), 10) || 30;

    // Objeto normalizado con las claves que entienden tanto FastAPI como el Frontend
    const itemPayload = {
      ...form,
      id: form.id, // Mantiene el ID original intacto
      code: form.code?.trim(),
      title: titleVal,
      nombre: titleVal,
      descripcion: form.description || form.descripcion || '',
      minPlayers: minP,
      maxPlayers: maxP,
      jugadores_min: minP,
      jugadores_max: maxP,
      duration: `${durParsed} min`,
      duracion_min: durParsed,
      price: Number(form.price || 0)
    };

    setSaving(true);
    setError('');

    try {
      // LLAMADA ASÍNCRONA OBLIGATORIA
      const success = editing ? await updateItem(type, itemPayload) : await addItem(type, itemPayload);
      if (success) {
        closeModal();
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar en el servidor.');
    } finally {
      setSaving(false);
    }
  }

  function upload(file) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      return setError('Seleccioná una imagen PNG, JPG o WebP de hasta 5 MB.');
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 600 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        setForm(prev => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.8) }));
        setUploading(false);
        setError('');
      };
      image.onerror = () => { setUploading(false); setError('No se pudo leer la imagen.'); };
      image.src = reader.result;
    };
    reader.onerror = () => { setUploading(false); setError('No se pudo abrir el archivo.'); };
    reader.readAsDataURL(file);
  }

  return (
    <div className="entity-form-view">
      <button className="small-back" onClick={closeModal}><ArrowLeft size={15} /> Cancelar</button>
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
              disabled={editing && type !== key}
              className={type === key ? 'selected' : ''}
              onClick={() => { setType(key); setForm(prev => ({ ...prev, code: nextCode(key, data) })); }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={save}>
        <section className="retro-panel form-section">
          <h3>
            <span className="step-number blue">1</span> DATOS {type === 'boardgames' ? 'DEL JUEGO' : 'DE LA ENTIDAD'} <small>FICHA OFICIAL</small>
          </h3>
          <div className="sku-heading">
            <label htmlFor="entity-code">CÓDIGO / SKU *</label>
            <button type="button" className="text-link" onClick={() => setForm(prev => ({ ...prev, code: nextCode(type, data) }))}>
              <RefreshCw size={12} /> REGENERAR SKU
            </button>
          </div>
          <input id="entity-code" className="form-input sku-input" name="code" value={form.code || ''} required onChange={change} />
          {field('title', type === 'boardgames' ? 'NOMBRE DEL JUEGO' : 'NOMBRE DE LA ENTIDAD', 'text', true)}
          {field('category', 'CATEGORÍA PRINCIPAL', 'text', true)}
          {field('shelf', 'UBICACIÓN EN LA FRIKIOTECA')}
          {type === 'comics' && field('author', 'AUTOR / AUTORA')}
          {type === 'cards' && field('format', 'FORMATO')}
          {type === 'buffet' && field('price', 'PRECIO ($)', 'number', true)}

          <div className="form-group">
            <label htmlFor="entity-status">ESTADO</label>
            <select id="entity-status" className="form-select" name="status" value={form.status || 'disponible'} onChange={change}>
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
          {form.status === 'en_mesa' && field('tableNumber', 'MESA ASIGNADA', 'text', true)}
          {form.status === 'en_reparacion' && field('notes', 'DETALLE DE REPARACIÓN')}
        </section>

        {type === 'boardgames' && (
          <section className="retro-panel form-section">
            <h3><span className="step-number yellow">2</span> STATS DE MESA <small>HUD TÁCTICO</small></h3>
            <div className="form-row-2">
              {field('minPlayers', 'MÍN. JUGADORES', 'number', true)}
              {field('maxPlayers', 'MÁX. JUGADORES', 'number', true)}
            </div>
            {field('duration', 'DURACIÓN (ej: 45 min)', 'text', true)}
            <label className="section-small-label">COMPLEJIDAD DE REGLAS · {form.complexity}/5</label>
            <div className="complexity-buttons">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  type="button"
                  key={n}
                  aria-pressed={form.complexity === n}
                  className={form.complexity === n ? 'selected' : ''}
                  onClick={() => setForm(prev => ({ ...prev, complexity: n }))}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="retro-panel form-section">
          <h3><span className="step-number pink">3</span> CARÁTULA DE PORTADA <small>Máx. 5 MB</small></h3>
          <div
            className="cover-upload"
            onDragOver={event => event.preventDefault()}
            onDrop={event => { event.preventDefault(); upload(event.dataTransfer.files[0]); }}
          >
            <div className="cover-preview">
              {form.image ? <img src={form.image} alt="Vista previa de portada" /> : <span>🎲</span>}
            </div>
            <label className="upload-target">
              <Upload size={22} />
              <span>ARRASTRÁ O SELECCIONÁ</span>
              <span className="upload-button">Subir nueva</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => upload(event.target.files[0])} />
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="entity-description">OBSERVACIONES</label>
            <textarea id="entity-description" className="form-textarea" name="description" value={form.description || ''} onChange={change} rows={3} />
          </div>
        </section>

        {error && <p className="error-text form-error" role="alert">{error}</p>}

        <div className="retro-panel form-save-bar">
          <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
            <Trash2 size={15} /> Descartar
          </button>
          <button className="btn-primary" disabled={uploading || saving} type="submit">
            <Save size={16} /> {saving ? 'Guardando en Servidor…' : uploading ? 'Procesando…' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </form>
    </div>
  );
}