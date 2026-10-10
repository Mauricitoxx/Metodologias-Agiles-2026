import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';

const getInitialFormData = (initialItem, mode, entityType) => {
  if (initialItem && mode === 'edit') {
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
      title: '',
      category: 'Estrategia',
      minPlayers: 2,
      maxPlayers: 4,
      duration: '45 min',
      shelf: 'ESTANTE A-1',
      status: 'disponible',
      image:
        'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=400&q=80',
      description: '',
      notes: '',
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    } else {
      if (!formData.title?.trim()) {
        newErrors.title = 'El título es obligatorio.';
      }

      if (entityType === 'comics') {
        for (const field of ['volume_number', 'pages', 'copies']) {
          const value = Number(formData[field]);

          if (!Number.isInteger(value) || value < 1) {
            newErrors[field] =
              'Ingresá un número entero mayor que cero.';
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
        ...(formData.title !== undefined
          ? { title: formData.title.trim() }
          : {}),
        ...(formData.name !== undefined
          ? { name: formData.name.trim() }
          : {}),
        ...(formData.email !== undefined
          ? { email: formData.email.trim() }
          : {}),
        ...(formData.price !== undefined
          ? { price: Number(formData.price) }
          : {}),
        ...(formData.minPlayers !== undefined
          ? { minPlayers: Number(formData.minPlayers) }
          : {}),
        ...(formData.maxPlayers !== undefined
          ? { maxPlayers: Number(formData.maxPlayers) }
          : {}),
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
    comics: 'Cómic o Manga',
    cards: 'Juego de Cartas (TCG)',
    buffet: 'Producto de Buffet',
    admins: 'Usuario Administrativo',
  };

  const entityTitle = titles[entityType] || 'Elemento';
  const isEditing = mode === 'edit';

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
                    value={formData.role || 'Staff Buffet'}
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

                  {entityType === 'boardgames' && (
                    <div className="form-group">
                      <label htmlFor="item-shelf">Ubicación / Estante</label>
                      <input
                        id="item-shelf"
                        type="text"
                        name="shelf"
                        value={formData.shelf || ''}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="ESTANTE B-1"
                      />
                    </div>
                  )}

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

                {entityType === 'boardgames' && (
                  <div className="form-row-3">
                    {[
                      ['minPlayers', 'Mínimo de jugadores', 1],
                      ['maxPlayers', 'Máximo de jugadores', 4],
                    ].map(([name, label, fallback]) => (
                      <div className="form-group" key={name}>
                        <label htmlFor={`item-${name}`}>{label}</label>
                        <input
                          id={`item-${name}`}
                          type="number"
                          min="1"
                          name={name}
                          value={formData[name] ?? fallback}
                          onChange={handleChange}
                          className="form-input"
                        />
                      </div>
                    ))}

                    <div className="form-group">
                      <label htmlFor="item-duration">Duración</label>
                      <input
                        id="item-duration"
                        type="text"
                        name="duration"
                        value={formData.duration || '60 min'}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

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