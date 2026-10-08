import { Eye, Edit3, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

export const BuffetCard = ({ item, onOpenDetail, onOpenEdit, onOpenConfirmBaja }) => {
  const isBaja = item.status === 'baja';

  return (
    <div className={`catalog-item-card ${isBaja ? 'is-baja-state' : ''}`}>
      <div className="card-main-content">
        <div className="card-thumb-container">
          <img src={item.image} alt={item.title} className="card-thumb-img" />
          <span className="shelf-badge">{item.category}</span>
        </div>

        <div className="card-info-container">
          <div className="card-header-row">
            <span className="item-code-chip">{item.code}</span>
            <StatusBadge status={item.status} />
          </div>

          <h3 className="card-item-title">{item.title}</h3>

          <div className="card-meta-row">
            <span className="meta-price-tag">${item.price?.toLocaleString()}</span>
            {item.isPopular && (
              <span className="popular-badge">
                <Sparkles size={12} /> Popular
              </span>
            )}
          </div>

          <div className="card-footer-chips">
            <p className="card-description-snippet">{item.description}</p>
          </div>
        </div>
      </div>

      <div className="card-actions-bar">
        <button
          className="btn-card-action btn-ficha"
          onClick={() => onOpenDetail('buffet', item)}
          title="Ver Ficha"
        >
          <Eye size={15} /> FICHA
        </button>

        <button
          className="btn-card-action btn-edit"
          onClick={() => onOpenEdit('buffet', item)}
          title="Editar Producto"
        >
          <Edit3 size={15} /> EDITAR
        </button>

        <button
          className={`btn-card-action btn-icon-baja ${isBaja ? 'btn-icon-restore' : ''}`}
          onClick={() => onOpenConfirmBaja('buffet', item)}
          title={isBaja ? 'Reactivar en Menú' : 'Dar de Baja del Menú'}
        >
          {isBaja ? <RotateCcw size={15} /> : <Trash2 size={15} />}
        </button>
      </div>
    </div>
  );
};
