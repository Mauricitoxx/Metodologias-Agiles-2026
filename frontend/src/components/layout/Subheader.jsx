import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAdmin } from '../../context/useAdmin';

export const Subheader = () => {
  const { currentTab, setCurrentTab } = useAdmin();

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'catalogo':
        return 'GESTOR DE INVENTARIO';
      case 'buffet':
        return 'GESTOR DE BUFFET';
      case 'eventos':
        return 'GESTOR DE EVENTOS';
      case 'admin':
        return 'ADMINISTRACIÓN Y USUARIOS';
      default:
        return 'PANEL ADMINISTRATIVO';
    }
  };

  const handleBack = () => {
    if (currentTab !== 'catalogo') {
      setCurrentTab('catalogo');
    }
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
