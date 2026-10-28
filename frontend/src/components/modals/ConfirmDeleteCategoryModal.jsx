import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, X, Trash2 } from 'lucide-react';

export const ConfirmDeleteCategoryModal = ({
  isOpen,
  onClose,
  categoria,
  onConfirm,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !categoria) return null;

  const juegosCount = categoria.juegos_count || (categoria.juegos ? categoria.juegos.length : 0);
  const tieneJuegos = juegosCount > 0;

  const handleConfirm = async () => {
    if (tieneJuegos) {
      setErrorMessage('No se puede eliminar esta categoría porque hay juegos usándola');
      return;
    }

    try {
      setDeleting(true);
      setErrorMessage('');
      await onConfirm(categoria);
      onClose();
    } catch (err) {
      setErrorMessage(
        err.message || 'No se puede eliminar esta categoría porque hay juegos usándola'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window modal-window-sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-icon-title">
            <div className={`alert-circle-icon ${tieneJuegos ? 'warning' : 'danger'}`}>
              {tieneJuegos ? <AlertOctagon size={22} /> : <AlertTriangle size={22} />}
            </div>
            <h3 id="confirm-delete-title" className="modal-title">
              {tieneJuegos ? 'Acción Bloqueada' : 'Confirmar Eliminación'}
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

        {/* Body */}
        <div className="modal-body">
          {tieneJuegos ? (
            <div className="category-blocked-alert" role="alert">
              <div className="category-blocked-banner">
                <AlertOctagon size={20} className="blocked-icon" />
                <p className="blocked-title">
                  No se puede eliminar esta categoría porque hay juegos usándola
                </p>
              </div>
              <p className="blocked-detail">
                La categoría <strong>"{categoria.nombre}"</strong> tiene{' '}
                <strong>{juegosCount}</strong> {juegosCount === 1 ? 'juego asignado' : 'juegos asignados'}.
                Debes desvincularla o reasignar esos juegos antes de poder eliminarla del sistema.
              </p>
            </div>
          ) : (
            <div className="confirm-delete-content">
              <p className="confirm-message">
                ¿Estás seguro de que deseas eliminar la categoría{' '}
                <strong>"{categoria.nombre}"</strong>?
              </p>
              <p className="confirm-warning-note">
                Esta acción es definitiva y no se puede deshacer.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="category-error-alert" role="alert">
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={deleting}
          >
            {tieneJuegos ? 'Entendido / Cerrar' : 'Cancelar'}
          </button>

          {!tieneJuegos && (
            <button
              type="button"
              className="btn-confirm btn-confirm-danger"
              onClick={handleConfirm}
              disabled={deleting}
            >
              <Trash2 size={16} />
              {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
