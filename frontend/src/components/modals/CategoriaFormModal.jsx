import React, { useState, useEffect } from 'react';
import { X, Check, Tags, AlertCircle } from 'lucide-react';

export const CategoriaFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialCategory,
  existingCategories = [],
}) => {
  const isEditing = Boolean(initialCategory && initialCategory.id);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setFormData({
          nombre: initialCategory.nombre || '',
          descripcion: initialCategory.descripcion || '',
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
        });
      }
      setErrors({});
      setSubmitError('');
      setSaving(false);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (submitError) setSubmitError('');
  };

  const validate = () => {
    const newErrors = {};
    const nombreLimpio = formData.nombre.trim();
    const descripcionLimpia = formData.descripcion.trim();

    // 1. Campo obligatorio nombre
    if (!nombreLimpio) {
      newErrors.nombre = 'El nombre es obligatorio.';
    } else if (nombreLimpio.length > 100) {
      newErrors.nombre = 'El nombre no puede superar los 100 caracteres.';
    } else {
      // 2. Nombre único
      const esDuplicado = existingCategories.some(
        (cat) =>
          cat.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase() &&
          cat.id !== initialCategory?.id
      );
      if (esDuplicado) {
        newErrors.nombre = 'El nombre ya está en uso.';
      }
    }

    // 3. Campo obligatorio descripción
    if (!descripcionLimpia) {
      newErrors.descripcion = 'La descripción es obligatoria.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) {
      return;
    }

    const payload = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
    };

    try {
      setSaving(true);
      const success = await onSave(payload);
      if (success !== false) {
        onClose();
      }
    } catch (err) {
      const msg = err.message || 'No se pudo guardar la categoría.';
      if (
        msg.toLowerCase().includes('ya existe') ||
        msg.toLowerCase().includes('en uso') ||
        msg.toLowerCase().includes('unique')
      ) {
        setErrors((prev) => ({ ...prev, nombre: 'El nombre ya está en uso.' }));
        setSubmitError('El nombre ya está en uso.');
      } else {
        setSubmitError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window modal-window-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-icon-title">
            <div className="category-modal-icon-badge">
              <Tags size={20} strokeWidth={2.5} />
            </div>
            <h3 id="category-modal-title" className="modal-title">
              {isEditing ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <div className="modal-body">
            {submitError && (
              <div className="category-form-alert" role="alert">
                <AlertCircle size={18} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Campo Nombre (Obligatorio y único) */}
            <div className="form-group">
              <label htmlFor="categoria-nombre">
                NOMBRE DE LA CATEGORÍA <span className="field-required">*</span>
              </label>
              <input
                id="categoria-nombre"
                name="nombre"
                type="text"
                className={`form-input ${errors.nombre ? 'form-input-error' : ''}`}
                placeholder="Ej. Estrategia, Cooperativo, Party Game..."
                value={formData.nombre}
                onChange={handleChange}
                maxLength={100}
                required
                autoFocus
              />
              {errors.nombre && (
                <span className="error-text" role="alert">
                  {errors.nombre}
                </span>
              )}
            </div>

            {/* Campo Descripción (Obligatorio) */}
            <div className="form-group">
              <label htmlFor="categoria-descripcion">
                DESCRIPCIÓN <span className="field-required">*</span>
              </label>
              <textarea
                id="categoria-descripcion"
                name="descripcion"
                className={`form-textarea ${errors.descripcion ? 'form-input-error' : ''}`}
                rows={4}
                placeholder="Explicá brevemente qué mecánicas, dinámicas o estilos de juegos abarca esta categoría..."
                value={formData.descripcion}
                onChange={handleChange}
                required
              />
              {errors.descripcion && (
                <span className="error-text" role="alert">
                  {errors.descripcion}
                </span>
              )}
            </div>

            <p className="form-helper-note">
              * Ambos campos son obligatorios. El nombre debe ser único para evitar clasificaciones duplicadas.
            </p>
          </div>

          {/* Footer con botones */}
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
              <Check size={16} strokeWidth={2.5} />
              {saving
                ? 'Guardando...'
                : isEditing
                ? 'Guardar Cambios'
                : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
