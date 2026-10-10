import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const getInitialFormData = (initialItem, mode, entityType) => {
  if (initialItem && mode === 'edit') {
    if (entityType === 'boardgames' || entityType === 'juegos') {
      return {
        ...initialItem,
        nombre: initialItem.nombre || initialItem.title || '',
        duracion_min: initialItem.duracion_min || 45,
        jugadores_min: initialItem.jugadores_min || initialItem.minPlayers || 1,
        jugadores_max: initialItem.jugadores_max || initialItem.maxPlayers || 4,
        edad_recomendada: initialItem.edad_recomendada || 8,
        cantidad: initialItem.cantidad || 1,
        video_url: initialItem.video_url || '',
        descripcion: initialItem.descripcion || initialItem.description || ''
      };
    }

    if (entityType === 'comics') {
      return {
        ...initialItem,
        title: initialItem.title || '',
        volume_number: initialItem.volume_number ?? initialItem.volumes ?? 1,
        pages: initialItem.pages ?? 1,
        copies: initialItem.copies ?? 1,
        synopsis: initialItem.synopsis || initialItem.description || '',
      };
    }

    return { ...initialItem };
  }

  const defaults = {
    boardgames: {
      nombre: '',
      descripcion: '',
      cantidad: 1,
      duracion_min: 45,
      edad_recomendada: 8,
      jugadores_min: 1,
      jugadores_max: 4,
      video_url: '',
      categoria_ids: [],
      dificultad_id: ''
    },
    juegos: {
      nombre: '',
      descripcion: '',
      cantidad: 1,
      duracion_min: 45,
      edad_recomendada: 8,
      jugadores_min: 1,
      jugadores_max: 4,
      video_url: '',
      categoria_ids: [],
      dificultad_id: ''
    },
    comics: {
      title: '',
      volume_number: 1,
      pages: 1,
      copies: 1,
      synopsis: '',
    },
    cards: {
      title: '',
      category: 'TCG / Mazos',
      format: 'Commander',
      shelf: 'VITRINA 1',
      status: 'disponible',
      image:
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
      description: '',
    },
    buffet: {
      title: '',
      category: 'Comidas',
      price: 5000,
      status: 'disponible',
      image:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
      description: '',
    },
    admins: {
      name: '',
      email: '',
      role: 'Gestor de Inventario',
      status: 'activo',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    },
  };

  return defaults[entityType] || {};
};

export const ItemFormModal = ({
  isOpen,
  onClose,
  mode,
  entityType,
  initialItem,
  onSave,
}) => {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialItem, mode, entityType)
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(initialItem, mode, entityType));
      setErrors({});
      setSaving(false);
    }
  }, [isOpen, initialItem, mode, entityType]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      delete next.submit;
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const newErrors = {};

    if (entityType === 'admins') {
      if (!formData.name?.trim()) {
        newErrors.name = 'El nombre es obligatorio.';
      }

      if (!formData.email?.trim() || !formData.email.includes('@')) {
        newErrors.email = 'Ingresá un correo válido.';
      }
    } else if (entityType === 'boardgames' || entityType === 'juegos') {
      if (!formData.nombre?.trim()) {
        newErrors.nombre = 'El nombre del juego es obligatorio.';
      }
      if (!formData.duracion_min || formData.duracion_min <= 0) {
        newErrors.duracion_min = 'Duración inválida.';
      }
      if (!formData.jugadores_min || formData.jugadores_min < 1) {
        newErrors.jugadores_min = 'Mínimo 1 jugador.';
      }
      if (formData.jugadores_max < formData.jugadores_min) {
        newErrors.jugadores_max = 'Max jugadores debe ser mayor o igual al mínimo.';
      }
    } else {
      if (!formData.title?.trim()) {
        newErrors.title = 'El título es obligatorio.';
      }

      if (entityType === 'comics') {
        for (const field of ['volume_number', 'pages', 'copies']) {
          const value = Number(formData[field]);

          if (!Number.isInteger(value) || value < 1) {
            newErrors[field] = 'Ingresá un número entero mayor que cero.';
          }
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let payload;

    if (entityType === 'comics') {
      payload = {
        title: formData.title.trim(),
        volume_number: Number(formData.volume_number),
        pages: Number(formData.pages),
        copies: Number(formData.copies),
        synopsis: formData.synopsis?.trim() || null,
      };
    } else {
      payload = {
        ...formData,
        ...(formData.nombre !== undefined ? { nombre: formData.nombre.trim() } : {}),
        ...(formData.title !== undefined ? { title: formData.title.trim() } : {}),
        ...(formData.name !== undefined ? { name: formData.name.trim() } : {}),
        ...(formData.email !== undefined ? { email: formData.email.trim() } : {}),
        ...(formData.price !== undefined ? { price: Number(formData.price) } : {}),
        ...(formData.minPlayers !== undefined ? { minPlayers: Number(formData.minPlayers) } : {}),
        ...(formData.maxPlayers !== undefined ? { maxPlayers: Number(formData.maxPlayers) } : {}),
      };
    }

    try {
      setSaving(true);
      const result = await onSave(entityType, payload);

      if (result === false) return;

      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'No se pudo guardar el registro.',
      });
    } finally {
      setSaving(false);
    }
  };

  const titles = {
    boardgames: 'Juego de Mesa',
    juegos: 'Juego de Mesa',
    comics: 'Cómic o Manga',
    cards: 'Juego de Cartas (TCG)',
    buffet: 'Producto de Buffet',
    admins: 'Usuario Administrativo',
  };

  const entityTitle = titles[entityType] || 'Elemento';
  const isEditing = mode === 'edit';
  const isBoardgame = entityType === 'boardgames' || entityType === 'juegos';

  const renderNumberField = (name, label) => (
    <div className="form-group" key={name}>
      <label htmlFor={`comic-${name}`}>{label} *</label>
      <input
        id={`comic-${name}`}
        type="number"
        name={name}
        min="1"
        step="1"
        required
        value={formData[name] ?? 1}
        onChange={handleChange}
        className="form-input"
      />
      {errors[name] && (
        <span className="error-text">{errors[name]}</span>
      )}
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditing ? `Editar ${entityTitle}` : `Nuevo ${entityTitle}`}
          </h3>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            {entityType === 'admins' ? (
              <>
                <div className="form-group">
                  <label htmlFor="admin-name">Nombre y apellido *</label>
                  <input
                    id="admin-name"
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Ej. Martín Páez"
                    required
                  />
                  {errors.name && (
                    <span className="error-text">{errors.name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="admin-email">Correo electrónico *</label>
                  <input
                    id="admin-email"
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="martin@frikioteca.com"
                    required
                  />
                  {errors.email && (
                    <span className="error-text">{errors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="admin-role">Rol de acceso</label>
                  <select
                    id="admin-role"
                    name="role"
                    value={formData.role || 'Gestor de Inventario'}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="Superadmin">
                      Superadmin (Acceso Total)
                    </option>
                    <option value="Gestor de Inventario">
                      Gestor de Inventario
                    </option>
                    <option value="Staff Buffet">Staff Buffet</option>
                  </select>
                </div>
              </>
            ) : isBoardgame ? (
              <>
                <div className="form-group">
                  <label htmlFor="boardgame-nombre">Nombre del Juego *</label>
                  <input
                    id="boardgame-nombre"
                    type="text"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Ej. Catan, Carcassonne..."
                  />
                  {errors.nombre && <span className="error-text">{errors.nombre}</span>}
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label htmlFor="boardgame-jmin">Min Jugadores *</label>
                    <input
                      id="boardgame-jmin"
                      type="number"
                      name="jugadores_min"
                      value={formData.jugadores_min || 1}
                      onChange={handleChange}
                      className="form-input"
                      min="1"
                    />
                    {errors.jugadores_min && <span className="error-text">{errors.jugadores_min}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="boardgame-jmax">Max Jugadores *</label>
                    <input
                      id="boardgame-jmax"
                      type="number"
                      name="jugadores_max"
                      value={formData.jugadores_max || 4}
                      onChange={handleChange}
                      className="form-input"
                      min="1"
                    />
                    {errors.jugadores_max && <span className="error-text">{errors.jugadores_max}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="boardgame-dur">Duración (min) *</label>
                    <input
                      id="boardgame-dur"
                      type="number"
                      name="duracion_min"
                      value={formData.duracion_min || 45}
                      onChange={handleChange}
                      className="form-input"
                      min="1"
                    />
                    {errors.duracion_min && <span className="error-text">{errors.duracion_min}</span>}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="boardgame-edad">Edad Recomendada (+Años)</label>
                    <input
                      id="boardgame-edad"
                      type="number"
                      name="edad_recomendada"
                      value={formData.edad_recomendada || 8}
                      onChange={handleChange}
                      className="form-input"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="boardgame-cant">Cantidad (Stock local)</label>
                    <input
                      id="boardgame-cant"
                      type="number"
                      name="cantidad"
                      value={formData.cantidad || 1}
                      onChange={handleChange}
                      className="form-input"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="boardgame-video">URL de Video Tutorial (Opcional)</label>
                  <input
                    id="boardgame-video"
                    type="url"
                    name="video_url"
                    value={formData.video_url || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="boardgame-desc">Descripción / Reglas resumidas</label>
                  <textarea
                    id="boardgame-desc"
                    name="descripcion"
                    rows="3"
                    value={formData.descripcion || ''}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Descripción rápida del juego..."
                  />
                </div>
              </>
            ) : entityType === 'comics' ? (
              <>
                <div className="form-group">
                  <label htmlFor="comic-title">Título *</label>
                  <input
                    id="comic-title"
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Ej. Berserk Deluxe Edition Vol. 1"
                    maxLength={200}
                    required
                  />
                  {errors.title && (
                    <span className="error-text">{errors.title}</span>
                  )}
                </div>

                <div className="form-row-3">
                  {renderNumberField('volume_number', 'Número de volumen')}
                  {renderNumberField('pages', 'Páginas')}
                  {renderNumberField('copies', 'Ejemplares')}
                </div>

                <div className="form-group">
                  <label htmlFor="comic-synopsis">Sinopsis</label>
                  <textarea
                    id="comic-synopsis"
                    name="synopsis"
                    rows="4"
                    value={formData.synopsis || ''}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Descripción del manga o cómic..."
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="item-title">Título o nombre *</label>
                  <input
                    id="item-title"
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder={`Nombre del ${entityTitle.toLowerCase()}...`}
                    required
                  />
                  {errors.title && (
                    <span className="error-text">{errors.title}</span>
                  )}
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="item-category">Categoría</label>
                    <input
                      id="item-category"
                      type="text"
                      name="category"
                      value={formData.category || ''}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Ej. Estrategia, Bebidas..."
                    />
                  </div>

                  {entityType === 'buffet' && (
                    <div className="form-group">
                      <label htmlFor="item-price">Precio ($)</label>
                      <input
                        id="item-price"
                        type="number"
                        min="0"
                        name="price"
                        value={formData.price ?? 0}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="item-image">URL de imagen</label>
                  <input
                    id="item-image"
                    type="url"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="item-description">
                    Descripción / Observaciones
                  </label>
                  <textarea
                    id="item-description"
                    name="description"
                    rows="3"
                    value={formData.description || ''}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Detalles adicionales..."
                  />
                </div>
              </>
            )}

            {errors.submit && (
              <p className="error-text" role="alert">
                {errors.submit}
              </p>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              <Check size={16} />
              {saving
                ? 'Guardando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Dar de alta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};