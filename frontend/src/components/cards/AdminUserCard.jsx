import React from 'react';
import { Eye, Edit3, Trash2, RotateCcw, Shield, Mail, Calendar } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

export const AdminUserCard = ({ item, isCurrentLoggedUser, onOpenDetail, onOpenEdit, onOpenConfirmBaja }) => {
  const isInactivo = item.status === 'inactivo';

  return (
    <div className={`catalog-item-card ${isInactivo ? 'is-baja-state' : ''}`}>
      <div className="card-main-content">
        <div className="card-thumb-container card-thumb-avatar">
          <img src={item.avatar} alt={item.name} className="card-avatar-img" />
          <span className="role-tag-badge">
            <Shield size={10} /> {item.role}
          </span>
        </div>

        <div className="card-info-container">
          <div className="card-header-row">
            <span className="item-code-chip">{item.code || '#USR'}</span>
            <StatusBadge status={item.status} />
          </div>

          <h3 className="card-item-title">
            {item.name} {isCurrentLoggedUser && <span className="you-indicator">(Tú)</span>}
          </h3>

          <div className="card-meta-row">
            <span className="meta-spec">
              <Mail size={12} className="meta-icon" /> {item.email}
            </span>
          </div>

          <div className="card-footer-chips">
            <span className="joined-date">
              <Calendar size={11} /> Desde {item.createdAt}
            </span>
          </div>
        </div>
      </div>

      <div className="card-actions-bar">
        <button
          className="btn-card-action btn-ficha"
          onClick={() => onOpenDetail('admins', item)}
          title="Ver Perfil"
        >
          <Eye size={15} /> FICHA
        </button>

        <button
          className="btn-card-action btn-edit"
          onClick={() => onOpenEdit('admins', item)}
          title="Editar Usuario"
        >
          <Edit3 size={15} /> EDITAR
        </button>

        <button
          className={`btn-card-action btn-icon-baja ${isInactivo ? 'btn-icon-restore' : ''}`}
          onClick={() => onOpenConfirmBaja('admins', item)}
          title={isInactivo ? 'Reactivar Usuario' : 'Desactivar / Dar de Baja'}
        >
          {isInactivo ? <RotateCcw size={15} /> : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  );
};
