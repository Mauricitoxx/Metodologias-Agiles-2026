import React, { useEffect, useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

/**
 * Confirmación de eliminación reutilizable, en lugar de window.confirm.
 *
 * `onConfirm` puede ser async: mientras corre se deshabilitan los botones, y si lanza un error se
 * muestra en el modal sin cerrarlo. Si termina bien, el modal se cierra.
 */
export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar eliminación',
  message,
  note = 'Esta acción es definitiva y no se puede deshacer.',
  confirmLabel = 'Sí, eliminar',
}) => {
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Escape cierra solo este modal, no los que están debajo
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !deleting) {
        event.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, deleting, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (deleting) return;
    setErrorMessage('');
    onClose();
  };

  const handleConfirm = async () => {
    try {
      setDeleting(true);
      setErrorMessage('');
      await onConfirm();
      onClose();
    } catch (err) {
      setErrorMessage(err?.message || 'No se pudo eliminar. Intentá de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-window modal-window-sm"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-modal-title"
        aria-describedby="confirm-delete-modal-message"
      >
        <div className="modal-header">
          <div className="modal-header-icon-title">
            <div className="alert-circle-icon danger">
              <AlertTriangle size={22} />
            </div>
            <h3 id="confirm-delete-modal-title" className="modal-title">{title}</h3>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            disabled={deleting}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="confirm-delete-content">
            <p id="confirm-delete-modal-message" className="confirm-message">{message}</p>
            {note && <p className="confirm-warning-note">{note}</p>}
          </div>

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
            onClick={handleClose}
            disabled={deleting}
            autoFocus
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-confirm btn-confirm-danger"
            onClick={handleConfirm}
            disabled={deleting}
          >
            <Trash2 size={16} />
            {deleting ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
