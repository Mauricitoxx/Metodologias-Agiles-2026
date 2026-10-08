import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Subheader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getSectionTitle = () => {
    if (location.pathname.includes('/staff')) {
      return 'GESTOR DE STAFF';
    }
    if (location.pathname.includes('/actividades')) {
      return 'GESTOR DE ACTIVIDADES';
    }
    if (location.pathname.includes('/inventario') || location.pathname.includes('/catalogo')) {
      return 'GESTOR DE INVENTARIO';
    }
    return 'ADMIN CENTRAL';
  };

  const handleBack = () => {
    navigate('/admin');
  };

  return (
    <div className="subheader-container">
      <button 
        className="back-btn" 
        onClick={handleBack}
        title="Volver a Admin Central"
        aria-label="Atrás"
      >
        <ArrowLeft size={18} strokeWidth={2.5} />
      </button>

      <div className="subheader-content">
        <span className="subheader-kicker">ADMIN CENTRAL •</span>
        <h2 className="subheader-title">{getSectionTitle()}</h2>
      </div>

      <div className="subheader-pill-indicator">
        <span className="indicator-dot-inner" />
      </div>
    </div>
  );
};
