import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmBajaModal = ({ isOpen, onClose, item, entityType, onConfirm }) => {
  if (!isOpen || !item) return null;

  const isAlreadyBaja = item.status === 'baja' || item.status === 'inactivo';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window modal-window-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon-title">
            <div className={`alert-circle-icon ${isAlreadyBaja ? 'restore' : 'danger'}`}>
              <AlertTriangle size={20} />
            </div>
            <h3 className="modal-title">
              {isAlreadyBaja ? 'Reactivar Elemento' : 'Confirmar Baja'}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">
            {isAlreadyBaja ? (
              <>¿Deseas restaurar y dar de alta nuevamente a <strong>{item.title || item.name}</strong> ({item.code})?</>
            ) : (
              <>
                ¿Estás seguro de que deseas dar de baja a <strong>{item.title || item.name}</strong> ({item.code})?
                El elemento cambiará su estado a <em>Baja / Inactivo</em> y no estará disponible para préstamos o ventas activas.
              </>
            )}
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className={`btn-confirm ${isAlreadyBaja ? 'btn-confirm-restore' : 'btn-confirm-danger'}`}
            onClick={() => {
              onConfirm(entityType, item);
              onClose();
            }}
          >
            {isAlreadyBaja ? 'Sí, Reactivar' : 'Sí, Dar de Baja'}
          </button>
        </div>
      </div>
    </div>
  );
};
