import { Eye, Edit3, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import { formatPrecio, porcentajeDescuento } from '../../utils/precio';

export const BuffetCard = ({ item, onOpenDetail, onOpenEdit, onOpenConfirmBaja }) => {
  const isBaja = item.status === 'baja';
  // HU-13: con oferta se muestra el precio original tachado junto al de oferta
  const hasOffer = item.offerPrice !== null && item.offerPrice !== undefined;

  return (
    <div className={`catalog-item-card ${isBaja ? 'is-baja-state' : ''}`}>
      <div className="card-main-content">
        <div className="card-thumb-container">
          {item.image ? (
            <img src={item.image} alt={item.title} className="card-thumb-img" />
          ) : (
            <span className="staff-avatar-emoji" aria-label="Sin imagen">🍔</span>
          )}
          <span className="shelf-badge">{item.category}</span>
        </div>

        <div className="card-info-container">
          <div className="card-header-row">
            <span className="item-code-chip">{item.code}</span>
            <StatusBadge status={isBaja ? 'inactivo' : 'activo'} />
          </div>

          <h3 className="card-item-title">{item.title}</h3>

          <div className="card-meta-row">
            {hasOffer ? (
              <>
                <s className="meta-price-original" aria-label={`Precio original ${formatPrecio(item.price)}`}>
                  {formatPrecio(item.price)}
                </s>
                <span className="meta-price-offer" aria-label={`Precio de oferta ${formatPrecio(item.offerPrice)}`}>
                  {formatPrecio(item.offerPrice)}
                </span>
                <span className="offer-badge">-{porcentajeDescuento(item.price, item.offerPrice)}% OFF</span>
              </>
            ) : (
              <span className="meta-price-tag">{formatPrecio(item.price)}</span>
            )}
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
