import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const getInitialFormData = (initialItem, mode, entityType) => {
  if (initialItem && mode === 'edit') {
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
      author: '',
      category: 'Shonen',
      shelf: 'MANGA-SECCIÓN A',
      status: 'disponible',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      description: ''
    },
    cards: {
      title: '',
      category: 'TCG / Mazos',
      format: 'Commander',
      shelf: 'VITRINA 1',
      status: 'disponible',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
      description: ''
    },
    buffet: {
      title: '',
      category: 'Comidas',
      price: 5000,
      status: 'disponible',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
      description: ''
    },
    admins: {
      name: '',
      email: '',
      role: 'Gestor de Inventario',
      status: 'activo',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    }
  };
  return defaults[entityType] || {};
};

export const ItemFormModal = ({ isOpen, onClose, mode, entityType, initialItem, onSave }) => {
  const [formData, setFormData] = useState(() => getInitialFormData(initialItem, mode, entityType));
  const [errors, setErrors] = useState({});

  // Sincronizar el formulario cada vez que abre o cambian las props
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(initialItem, mode, entityType));
      setErrors({});
    }
  }, [isOpen, initialItem, mode, entityType]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (entityType === 'admins') {
      if (!formData.name?.trim()) newErrors.name = 'El nombre es obligatorio';
      if (!formData.email?.trim() || !formData.email.includes('@')) newErrors.email = 'Email inválido';
    } else if (entityType === 'boardgames' || entityType === 'juegos') {
      if (!formData.nombre?.trim()) newErrors.nombre = 'El nombre del juego es obligatorio';
      if (!formData.duracion_min || formData.duracion_min <= 0) newErrors.duracion_min = 'Duración inválida';
      if (!formData.jugadores_min || formData.jugadores_min < 1) newErrors.jugadores_min = 'Mínimo 1 jugador';
      if (formData.jugadores_max < formData.jugadores_min) newErrors.jugadores_max = 'Max jugadores debe ser mayor o igual al mínimo';
    } else {
      if (!formData.title?.trim()) newErrors.title = 'El título/nombre es obligatorio';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(entityType, formData);
    onClose();
  };

  const getEntityTitle = () => {
    const titles = {
      boardgames: 'Juego de Mesa',
      juegos: 'Juego de Mesa',
      comics: 'Cómic o Manga',
      cards: 'Juego de Cartas (TCG)',
      buffet: 'Producto de Buffet',
      admins: 'Usuario Administrativo'
    };
    return titles[entityType] || 'Elemento';
  };

  const isBoardgame = entityType === 'boardgames' || entityType === 'juegos';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {mode === 'edit' ? `Editar ${getEntityTitle()}` : `Nuevo ${getEntityTitle()}`}
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            {entityType === 'admins' ? (
              <>
                <div className="form-group">
                  <label>Nombre y Apellido *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Ej. Martín Páez"
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Correo Electrónico *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="martin@frikioteca.com"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Rol de Acceso</label>
                  <select
                    name="role"
                    value={formData.role || 'Gestor de Inventario'}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="Superadmin">Superadmin (Acceso Total)</option>
                    <option value="Gestor de Inventario">Gestor de Inventario</option>
                    <option value="Staff Buffet">Staff Buffet</option>
                  </select>
                </div>
              </>
            ) : isBoardgame ? (
              <>
                {/* CAMPOS ESPECÍFICOS PARA JUEGOS DE MESA (BACKEND FASTAPI) */}
                <div className="form-group">
                  <label>Nombre del Juego *</label>
                  <input
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
                    <label>Min Jugadores *</label>
                    <input
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
                    <label>Max Jugadores *</label>
                    <input
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
                    <label>Duración (min) *</label>
                    <input
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
                    <label>Edad Recomendada (+Años)</label>
                    <input
                      type="number"
                      name="edad_recomendada"
                      value={formData.edad_recomendada || 8}
                      onChange={handleChange}
                      className="form-input"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cantidad (Stock local)</label>
                    <input
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
                  <label>URL de Video Tutorial (Opcional)</label>
                  <input
                    type="url"
                    name="video_url"
                    value={formData.video_url || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div className="form-group">
                  <label>Descripción / Reglas resumidas</label>
                  <textarea
                    name="descripcion"
                    rows="3"
                    value={formData.descripcion || ''}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Descripción rápida del juego..."
                  />
                </div>
              </>
            ) : (
              /* RESTO DE ENTIDADES (COMICS, BUFFET, CARDS) */
              <>
                <div className="form-group">
                  <label>Título o Nombre *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder={`Nombre del ${getEntityTitle().toLowerCase()}...`}
                  />
                  {errors.title && <span className="error-text">{errors.title}</span>}
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Categoría</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category || ''}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Ej. Estrategia, Bebidas, etc."
                    />
                  </div>

                  {entityType === 'buffet' && (
                    <div className="form-group">
                      <label>Precio ($)</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price || 0}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>URL de Imagen</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://..."
                  />
                </div>

                <div className="form-group">
                  <label>Descripción / Observaciones</label>
                  <textarea
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
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} /> {mode === 'edit' ? 'Guardar Cambios' : 'Dar de Alta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};