import React from 'react';
import { Edit3, Trash2, RotateCcw, ShieldCheck, Mail } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

export const AdminUserCard = ({ item, isCurrentLoggedUser, onOpenEdit, onOpenConfirmBaja }) => {
  const isInactivo = item.status === 'inactivo';

  return (
    <div className={`catalog-item-card ${isInactivo ? 'is-baja-state' : ''}`}>
      <div className="card-main-content">
        <div className="card-thumb-container card-thumb-avatar" aria-hidden="true">
          <ShieldCheck size={30} className="staff-card-icon" />
        </div>

        <div className="card-info-container">
          <div className="card-header-row">
            <span className="item-code-chip">{item.code}</span>
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
        </div>
      </div>

      <div className="card-actions-bar">
        <button
          className="btn-card-action btn-edit"
          onClick={() => onOpenEdit('admins', item)}
          title="Editar usuario"
        >
          <Edit3 size={15} /> EDITAR
        </button>

        {/* No se puede dar de baja a uno mismo: perdería el acceso al instante */}
        {!isCurrentLoggedUser && (
          <button
            className={`btn-card-action btn-icon-baja ${isInactivo ? 'btn-icon-restore' : ''}`}
            onClick={() => onOpenConfirmBaja('admins', item)}
            title={isInactivo ? 'Reactivar usuario' : 'Dar de baja'}
            aria-label={isInactivo ? `Reactivar a ${item.name}` : `Dar de baja a ${item.name}`}
          >
            {isInactivo ? <RotateCcw size={15} /> : <Trash2 size={15} />}
          </button>
        )}
      </div>
    </div>
  );
};
