
import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, X, Trash2 } from 'lucide-react';

export const ConfirmDeleteCategoryModal = ({
  isOpen,
  onClose,
  categoria,
  onConfirm,
  entityLabel = 'juego',
  countField = 'juegos_count',
}) => {
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !categoria) return null;

  const count = categoria[countField] ?? 0;
  const tieneElementos = count > 0;
  const entityLabelPlural = entityLabel === 'manga o cómic'
    ? 'mangas o cómics'
    : `${entityLabel}s`;

  const handleConfirm = async () => {
    if (tieneElementos) {
      setErrorMessage(
        `No se puede eliminar esta categoría porque hay ${entityLabelPlural} usándola.`
      );
      return;
    }

    try {
      setDeleting(true);
      setErrorMessage('');
      await onConfirm(categoria);
      onClose();
    } catch (err) {
      setErrorMessage(
        err.message || `No se puede eliminar esta categoría porque hay ${entityLabelPlural} usándola.`
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
        <div className="modal-header">
          <div className="modal-header-icon-title">
            <div className={`alert-circle-icon ${tieneElementos ? 'warning' : 'danger'}`}>
              {tieneElementos
                ? <AlertOctagon size={22} />
                : <AlertTriangle size={22} />}
            </div>
            <h3 id="confirm-delete-title" className="modal-title">
              {tieneElementos ? 'Acción Bloqueada' : 'Confirmar Eliminación'}
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

        <div className="modal-body">
          {tieneElementos ? (
            <div className="category-blocked-alert" role="alert">
              <div className="category-blocked-banner">
                <AlertOctagon size={20} className="blocked-icon" />
                <p className="blocked-title">
                  No se puede eliminar esta categoría porque hay {entityLabelPlural} usándola.
                </p>
              </div>

              <p className="blocked-detail">
                La categoría <strong>"{categoria.nombre}"</strong> tiene{' '}
                <strong>{count}</strong>{' '}
                {count === 1
                  ? `${entityLabel} asignado`
                  : `${entityLabelPlural} asignados`}.
                Debes desvincularlos o reasignarlos antes de eliminar la categoría.
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

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={deleting}
          >
            {tieneElementos ? 'Entendido / Cerrar' : 'Cancelar'}
          </button>

          {!tieneElementos && (
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
