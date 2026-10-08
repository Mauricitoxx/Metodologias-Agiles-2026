import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const getInitialFormData = (initialItem, mode, entityType) => {
  if (initialItem && mode === 'edit') {
    return initialItem;
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
      image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=400&q=80',
      description: '',
      notes: ''
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
    events: {
      title: '',
      category: 'Torneo de Juegos',
      date: new Date().toISOString().split('T')[0],
      time: '19:00 hs',
      fee: '$3.500',
      maxSlots: 16,
      bookedSlots: 0,
      status: 'programado',
      description: '',
      reward: ''
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

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (entityType === 'admins') {
      if (!formData.name?.trim()) newErrors.name = 'El nombre es obligatorio';
      if (!formData.email?.trim() || !formData.email.includes('@')) newErrors.email = 'Email inválido';
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
      comics: 'Cómic o Manga',
      cards: 'Juego de Cartas (TCG)',
      buffet: 'Producto de Buffet',
      events: 'Evento / Torneo',
      admins: 'Usuario Administrativo'
    };
    return titles[entityType] || 'Elemento';
  };

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
                    value={formData.role || 'Staff Buffet'}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="Superadmin">Superadmin (Acceso Total)</option>
                    <option value="Gestor de Inventario">Gestor de Inventario</option>
                    <option value="Staff Buffet">Staff Buffet</option>
                  </select>
                </div>
              </>
            ) : (
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

                  {entityType === 'boardgames' && (
                    <div className="form-group">
                      <label>Ubicación / Estante</label>
                      <input
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

                {entityType === 'boardgames' && (
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>Min Jug.</label>
                      <input
                        type="number"
                        name="minPlayers"
                        value={formData.minPlayers || 1}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Jug.</label>
                      <input
                        type="number"
                        name="maxPlayers"
                        value={formData.maxPlayers || 4}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Duración</label>
                      <input
                        type="text"
                        name="duration"
                        value={formData.duration || '60 min'}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                {entityType === 'events' && (
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Fecha</label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date || ''}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Hora</label>
                      <input
                        type="text"
                        name="time"
                        value={formData.time || '19:00 hs'}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

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
                    placeholder="Detalles adicionales, componentes, etc..."
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
