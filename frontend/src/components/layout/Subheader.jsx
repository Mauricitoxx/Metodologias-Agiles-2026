import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAdmin } from '../../context/useAdmin';

export const Subheader = () => {
  const { currentTab, setCurrentTab } = useAdmin();

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'inventario':
      case 'catalogo':
        return 'GESTOR DE INVENTARIO';
      case 'staff':
      case 'admin':
        return 'GESTOR DE STAFF';
      default:
        return 'ADMIN CENTRAL';
    }
  };

  const handleBack = () => {
    setCurrentTab('hub');
  };

  return (
    <div className="subheader-container">
      <button 
        className="back-btn" 
        onClick={handleBack}
        title="Volver al catálogo"
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
