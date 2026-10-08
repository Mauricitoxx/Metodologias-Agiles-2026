import React from 'react';
import { X, Calendar, Clock, Users, MapPin, Award, FileText } from 'lucide-react';
import { StatusBadge, CategoryTag } from '../common/Badge';

export const ItemDetailModal = ({ isOpen, onClose, item, entityType, onEdit, onToggleBaja }) => {
  if (!isOpen || !item) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-code-badge">{item.code}</span>
            <h3 className="modal-title">{item.title || item.name}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {item.image && (
            <div className="modal-image-wrapper">
              <img src={item.image} alt={item.title || item.name} className="modal-image" />
              {item.shelf && <span className="modal-image-tag">{item.shelf}</span>}
            </div>
          )}

          <div className="modal-status-row">
            <StatusBadge status={item.status} tableNumber={item.tableNumber} />
            {item.category && <CategoryTag>{item.category}</CategoryTag>}
          </div>

          <div className="modal-details-grid">
            {item.minPlayers && (
              <div className="detail-item">
                <Users size={16} />
                <span>Jugadores: <strong>{item.minPlayers}-{item.maxPlayers}</strong></span>
              </div>
            )}
            {item.duration && (
              <div className="detail-item">
                <Clock size={16} />
                <span>Tiempo: <strong>{item.duration}</strong></span>
              </div>
            )}
            {item.shelf && (
              <div className="detail-item">
                <MapPin size={16} />
                <span>Ubicación: <strong>{item.shelf}</strong></span>
              </div>
            )}
            {item.loansCount !== undefined && (
              <div className="detail-item">
                <Award size={16} />
                <span>Préstamos: <strong>{item.loansCount}</strong></span>
              </div>
            )}
            {item.price && (
              <div className="detail-item">
                <span>Precio: <strong>${item.price.toLocaleString()}</strong></span>
              </div>
            )}
            {item.date && (
              <div className="detail-item">
                <Calendar size={16} />
                <span>Fecha: <strong>{item.date} {item.time}</strong></span>
              </div>
            )}
            {item.role && (
              <div className="detail-item">
                <span>Rol: <strong>{item.role}</strong></span>
              </div>
            )}
            {item.email && (
              <div className="detail-item">
                <span>Email: <strong>{item.email}</strong></span>
              </div>
            )}
          </div>

          {item.notes && (
            <div className="modal-warning-box">
              <strong>Nota interna:</strong> {item.notes}
            </div>
          )}

          {item.description && (
            <div className="modal-description-box">
              <div className="section-label">
                <FileText size={14} /> Resumen y Descripción
              </div>
              <p>{item.description}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="action-btn edit-action-btn"
            onClick={() => {
              onClose();
              onEdit(entityType, item);
            }}
          >
            ✏️ Editar Datos
          </button>
          <button
            className={`action-btn ${item.status === 'baja' || item.status === 'inactivo' ? 'restore-action-btn' : 'baja-action-btn'}`}
            onClick={() => {
              onClose();
              onToggleBaja(entityType, item);
            }}
          >
            {item.status === 'baja' || item.status === 'inactivo' ? '🔄 Reactivar' : '🗑️ Dar de Baja'}
          </button>
        </div>
      </div>
    </div>
  );
};
