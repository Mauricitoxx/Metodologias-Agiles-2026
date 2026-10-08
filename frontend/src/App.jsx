import React from 'react';
import './styles/theme.css';
import './styles/admin.css';
import { AdminProvider } from './context/AdminContext';
import { useAdmin } from './context/useAdmin';
import { Header } from './components/layout/Header';
import { Subheader } from './components/layout/Subheader';
import { BottomNav } from './components/layout/BottomNav';
import { CatalogView } from './views/CatalogView';
import { AdminUsersView } from './views/AdminUsersView';
import { ItemDetailModal } from './components/modals/ItemDetailModal';
import { ItemFormModal } from './components/modals/ItemFormModal';
import { ConfirmBajaModal } from './components/modals/ConfirmBajaModal';

const AdminDashboard = () => {
  const {
    currentTab,
    modalState,
    closeModal,
    addItem,
    updateItem,
    toggleBajaItem,
    openEditModal,
    notification
  } = useAdmin();

  const renderActiveView = () => {
    switch (currentTab) {
      case 'catalogo':
        return <CatalogView />;
      case 'staff':
      case 'admin':
        return <AdminUsersView />;
      default:
        return <CatalogView />;
    }
  };

  return (
    <div className="app-container">
      {/* 1. Encabezado de Marca & Usuario */}
      <Header />

      {/* 2. Sub-encabezado con Breadcrumbs */}
      <Subheader />

      {/* 3. Contenido Principal del Módulo Activo */}
      <main className="main-content">
        {renderActiveView()}
      </main>

      {/* 4. Barra de Navegación Inferior (4 Accesos) */}
      <BottomNav />

      {/* 5. Modales Operativos */}
      <ItemDetailModal
        isOpen={modalState.isOpen && modalState.mode === 'detail'}
        onClose={closeModal}
        item={modalState.item}
        entityType={modalState.entityType}
        onEdit={openEditModal}
        onToggleBaja={toggleBajaItem}
      />

      <ItemFormModal
        key={`${modalState.mode}-${modalState.item?.id || 'new'}-${modalState.entityType}`}
        isOpen={modalState.isOpen && (modalState.mode === 'create' || modalState.mode === 'edit')}
        onClose={closeModal}
        mode={modalState.mode}
        entityType={modalState.entityType}
        initialItem={modalState.item}
        onSave={(type, itemData) => {
          if (modalState.mode === 'edit') {
            updateItem(type, itemData);
          } else {
            addItem(type, itemData);
          }
        }}
      />

      <ConfirmBajaModal
        isOpen={modalState.isOpen && modalState.mode === 'confirm_baja'}
        onClose={closeModal}
        item={modalState.item}
        entityType={modalState.entityType}
        onConfirm={toggleBajaItem}
      />

      {/* 6. Notificaciones Toast */}
      {notification && (
        <div className={`toast-notification ${notification.type || ''}`}>
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <AdminDashboard />
    </AdminProvider>
  );
}
