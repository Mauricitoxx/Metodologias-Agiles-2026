import React from 'react';
import { Eye, Edit3, Trash2, RotateCcw, Users, Clock } from 'lucide-react';
import { StatusBadge, CategoryTag, ShelfBadge } from '../common/Badge';

export const GameCard = ({ item, entityType, onOpenDetail, onOpenEdit, onOpenConfirmBaja }) => {
  // Manejo de estado de baja compatible con API (activo: false) y mock (status: 'baja')
  const isBaja = item.status === 'baja' || item.activo === false;

  // Fallbacks de propiedades API vs Frontend Mock
  const title = item.title || item.nombre || 'Sin título';
  const minPlayers = item.minPlayers ?? item.jugadores_min;
  const maxPlayers = item.maxPlayers ?? item.jugadores_max;
  
  // Duración: si viene de API es número (ej: 45), le agregamos "min"
  const duration = item.duration || (item.duracion_min ? `${item.duracion_min} min` : null);
  
  // Categorías: si vienen de API es un array, o si viene como string
  const categoryName = item.category || (Array.isArray(item.categorias) 
    ? item.categorias.map(c => c.nombre).join(', ') 
    : null);

  const code = item.code || `#BG-${String(item.id || 0).padStart(3, '0')}`;
  const status = item.activo === false ? 'baja' : (item.status || 'disponible');

  return (
    <div className={`catalog-item-card ${isBaja ? 'is-baja-state' : ''}`}>
      <div className="card-main-content">
        {/* Thumbnail with shelf tag */}
        <div className="card-thumb-container">
          {item.image || item.imagen ? (
            <img src={item.image || item.imagen} alt={title} className="card-thumb-img" />
          ) : (
            <span className="staff-avatar-emoji" aria-label="Sin portada">🎲</span>
          )}
          {item.shelf && <ShelfBadge>{item.shelf}</ShelfBadge>}
        </div>

        {/* Card Info */}
        <div className="card-info-container">
          <div className="card-header-row">
            <span className="item-code-chip">{code}</span>
            <StatusBadge status={status} tableNumber={item.tableNumber} />
          </div>

          <h3 className="card-item-title">{title}</h3>

          <div className="card-meta-row">
            {minPlayers !== undefined && maxPlayers !== undefined && (
              <span className="meta-spec">
                <Users size={13} className="meta-icon" />
                {minPlayers}-{maxPlayers} jug.
              </span>
            )}
            {duration && (
              <span className="meta-spec">
                • <Clock size={13} className="meta-icon" />
                {duration}
              </span>
            )}
            {item.author && <span className="meta-spec">por {item.author}</span>}
          </div>

          <div className="card-footer-chips">
            {categoryName && <CategoryTag>{categoryName}</CategoryTag>}
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