import React from 'react';
import { Eye, Edit3, Trash2, RotateCcw, Users, Clock } from 'lucide-react';
import { StatusBadge, CategoryTag, ShelfBadge } from '../common/Badge';

export const GameCard = ({ item, entityType, onOpenDetail, onOpenEdit, onOpenConfirmBaja }) => {
  const isBaja = item.status === 'baja';

  return (
    <div className={`catalog-item-card ${isBaja ? 'is-baja-state' : ''}`}>
      <div className="card-main-content">
        {/* Thumbnail with shelf tag */}
        <div className="card-thumb-container">
          <img src={item.image} alt={item.title} className="card-thumb-img" />
          {item.shelf && <ShelfBadge>{item.shelf}</ShelfBadge>}
        </div>

        {/* Card Info */}
        <div className="card-info-container">
          <div className="card-header-row">
            <span className="item-code-chip">{item.code}</span>
            <StatusBadge status={item.status} tableNumber={item.tableNumber} />
          </div>

          <h3 className="card-item-title">{item.title}</h3>

          <div className="card-meta-row">
            {item.minPlayers && (
              <span className="meta-spec">
                <Users size={13} className="meta-icon" />
                {item.minPlayers}-{item.maxPlayers} jug.
              </span>
            )}
            {item.duration && (
              <span className="meta-spec">
                • <Clock size={13} className="meta-icon" />
                {item.duration}
              </span>
            )}
            {item.author && <span className="meta-spec">por {item.author}</span>}
          </div>

          <div className="card-footer-chips">
            {item.category && <CategoryTag>{item.category}</CategoryTag>}
            {item.loansCount !== undefined && (
              <span className="loans-count-text">{item.loansCount} préstamos</span>
            )}
            {item.notes && (
              <span className="warning-note-chip">{item.notes}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions Row: FICHA, EDITAR, BAJA */}
      <div className="card-actions-bar">
        <button
          className="btn-card-action btn-ficha"
          onClick={() => onOpenDetail(entityType, item)}
          title="Ver Ficha Técnica"
        >
          <Eye size={15} /> FICHA
        </button>

        <button
          className="btn-card-action btn-edit"
          onClick={() => onOpenEdit(entityType, item)}
          title="Editar Datos"
        >
          <Edit3 size={15} /> EDITAR
        </button>

        <button
          className={`btn-card-action btn-icon-baja ${isBaja ? 'btn-icon-restore' : ''}`}
          onClick={() => onOpenConfirmBaja(entityType, item)}
          title={isBaja ? 'Reactivar' : 'Dar de Baja'}
          aria-label={isBaja ? 'Reactivar' : 'Dar de Baja'}
        >
          {isBaja ? <RotateCcw size={15} /> : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  );
};
