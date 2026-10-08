import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/theme.css';
import './styles/admin.css';
import './styles/screens.css';
import { AdminProvider } from './context/AdminContext';
import { useAdmin } from './context/useAdmin';
import { Header } from './components/layout/Header';
import { Subheader } from './components/layout/Subheader';
import { AdminView } from './views/AdminView';
import { CatalogView } from './views/CatalogView';
import { AdminUsersView } from './views/AdminUsersView';
import { LoginView } from './views/LoginView';
import { EntityFormView } from './views/EntityFormView';
import { ItemDetailModal } from './components/modals/ItemDetailModal';
import { ItemFormModal } from './components/modals/ItemFormModal';
import { ConfirmBajaModal } from './components/modals/ConfirmBajaModal';

const AdminDashboard = () => {
  const location = useLocation();
  const {
    session,
    modalState,
    closeModal,
    addItem,
    updateItem,
    toggleBajaItem,
    openEditModal,
    notification
  } = useAdmin();

  const isEntityForm =
    session &&
    modalState.isOpen &&
    ['create', 'edit'].includes(modalState.mode) &&
    ['boardgames', 'comics', 'cards', 'buffet'].includes(modalState.entityType);

  const isSubheaderRoute =
    session &&
    !isEntityForm &&
    (location.pathname === '/admin/inventario' ||
      location.pathname === '/admin/catalogo' ||
      location.pathname === '/admin/staff');

  return (
    <div className="app-container">
      {/* 1. Header con identidad de marca y botón salir */}
      <Header />

      {/* 2. Subheader con botón atrás solo en rutas internas de gestión */}
      {isSubheaderRoute && <Subheader />}

      {/* 3. Contenedor de Vistas Enrutadas */}
      <main className="main-content">
        {isEntityForm ? (
          <EntityFormView
            key={`${modalState.mode}-${modalState.item?.id || 'new'}-${modalState.entityType}`}
          />
        ) : (
          <Routes>
            {/* Login */}
            <Route
              path="/login"
              element={session ? <Navigate to="/admin" replace /> : <LoginView />}
            />

            {/* Ruta /admin (reservada para implementación del equipo) */}
            <Route
              path="/admin"
              element={
                !session ? <Navigate to="/login" replace /> : <AdminView />
              }
            />

            {/* Gestor de Inventario */}
            <Route
              path="/admin/inventario"
              element={
                !session ? <Navigate to="/login" replace /> : <CatalogView />
              }
            />

            {/* Alias /admin/catalogo */}
            <Route
              path="/admin/catalogo"
              element={<Navigate to="/admin/inventario" replace />}
            />

            {/* Gestor de Staff */}
            <Route
              path="/admin/staff"
              element={
                !session ? <Navigate to="/login" replace /> : <AdminUsersView />
              }
            />

            {/* Redirección por defecto */}
            <Route
              path="/"
              element={<Navigate to={session ? "/admin" : "/login"} replace />}
            />
            <Route
              path="*"
              element={<Navigate to={session ? "/admin" : "/login"} replace />}
            />
          </Routes>
        )}
      </main>

      {/* 4. Modales Operativos */}
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
        isOpen={
          !isEntityForm &&
          modalState.isOpen &&
          (modalState.mode === 'create' || modalState.mode === 'edit')
        }
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

      {/* 5. Notificaciones Toast */}
      {notification && (
        <div role="status" className={`toast-notification ${notification.type || ''}`}>
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
