import React from 'react';

export const StatusBadge = ({ status, text, tableNumber }) => {
  let label = text;
  let className = 'status-badge';

  switch (status) {
    case 'disponible':
      label = label || 'Disponible';
      className += ' status-disponible';
      break;
    case 'en_mesa':
      label = label || (tableNumber ? `En ${tableNumber}` : 'En Mesa');
      className += ' status-en-mesa';
      break;
    case 'en_reparacion':
      label = label || 'En Reparación';
      className += ' status-reparacion';
      break;
    case 'baja':
    case 'inactivo':
      label = label || (status === 'inactivo' ? 'Inactivo' : 'Baja');
      className += ' status-baja';
      break;
    case 'activo':
      label = label || 'Activo';
      className += ' status-disponible';
      break;
    // Estados de las actividades
    case 'activa':
      label = label || 'Activa';
      className += ' status-disponible';
      break;
    case 'postergada':
      label = label || 'Postergada';
      className += ' status-en-mesa';
      break;
    case 'cancelada':
      label = label || 'Cancelada';
      className += ' status-reparacion';
      break;
    case 'inactiva':
      label = label || 'Inactiva';
      className += ' status-baja';
      break;
    default:
      label = label || status;
  }

  return (
    <span className={className}>
      <span className="status-dot">●</span> {label}
    </span>
  );
};

export const CategoryTag = ({ children, variant = 'default' }) => {
  return <span className={`category-tag category-${variant}`}>{children}</span>;
};

export const ShelfBadge = ({ children }) => {
  return <span className="shelf-badge">{children}</span>;
};
