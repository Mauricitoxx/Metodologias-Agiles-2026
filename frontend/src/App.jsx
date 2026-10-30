import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './styles/theme.css';
import './styles/admin.css';
import './styles/screens.css';
import './styles/activities.css';
import { AdminProvider } from './context/AdminContext';
import { useAdmin } from './context/useAdmin';
import { Header } from './components/layout/Header';
import { Subheader } from './components/layout/Subheader';
import { AdminHubView } from './views/AdminHubView';
import { CatalogView } from './views/CatalogView';
import { AdminUsersView } from './views/AdminUsersView';
import { LoginView } from './views/LoginView';
import { EntityFormView } from './views/EntityFormView';
import { ProductoFormView } from './views/ProductoFormView';
import { ItemDetailModal } from './components/modals/ItemDetailModal';
import { ItemFormModal } from './components/modals/ItemFormModal';
import { ConfirmBajaModal } from './components/modals/ConfirmBajaModal';

const ActivitiesRedirect = () => {
  const { setCatalogSubTab } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    setCatalogSubTab('actividades');
    navigate('/admin/inventario', { replace: true });
  }, [setCatalogSubTab, navigate]);

  return null;
};

const AdminDashboard = () => {
  const location = useLocation();
  const {
    session,
    authLoading,
    authError,
    retryAuth,
    modalState,
    closeModal,
    addItem,
    updateItem,
    toggleBajaItem,
    openEditModal,
    openConfirmBajaModal,
    notification
  } = useAdmin();

  if (authLoading) return <div className="login-screen"><p role="status" className="login-content">Verificando sesión…</p></div>;
  if (location.pathname === '/login') return <LoginView />;
  if (authError) return <div className="login-screen"><div className="login-content"><p role="alert">{authError}</p><button className="login-submit" onClick={retryAuth}>Reintentar</button></div></div>;
  if (!session) return <Navigate to="/login" replace />;

  const isEntityForm =
    modalState.isOpen &&
    ['create', 'edit'].includes(modalState.mode) &&
    ['boardgames', 'comics', 'cards'].includes(modalState.entityType);

  // El buffet tiene su propio formulario ("Registro de carta" del Figma)
  const isProductoForm =
    modalState.isOpen &&
    ['create', 'edit'].includes(modalState.mode) &&
    modalState.entityType === 'buffet';

  const isSubheaderRoute =
    !isEntityForm &&
    !isProductoForm &&
    (location.pathname === '/admin/inventario' ||
      location.pathname === '/admin/catalogo' ||
      location.pathname === '/admin/staff');

  return (
    <div className="app-container">
      {/* 1. Header con identidad de marca y usuario */}
      <Header />

      {/* 2. Subheader con botón atrás solo en rutas internas de gestión */}
      {isSubheaderRoute && <Subheader />}

      {/* 3. Contenedor de Vistas Enrutadas */}
      <main className="main-content">
        {isProductoForm ? (
          <ProductoFormView key={`${modalState.mode}-${modalState.item?.id || 'new'}`} />
        ) : isEntityForm ? (
          <EntityFormView
            key={`${modalState.mode}-${modalState.item?.id || 'new'}-${modalState.entityType}`}
          />
        ) : (
          <Routes>
            {/* Admin Central Hub */}
            <Route path="/admin" element={<AdminHubView />} />

            {/* Gestor de Inventario */}
            <Route path="/admin/inventario" element={<CatalogView />} />

            {/* Alias /admin/catalogo */}
            <Route path="/admin/catalogo" element={<Navigate to="/admin/inventario" replace />} />

            {/* Gestor de Staff */}
            <Route path="/admin/staff" element={<AdminUsersView />} />

            {/* Alias /admin/actividades: pestaña Actividades del inventario */}
            <Route path="/admin/actividades" element={<ActivitiesRedirect />} />

            {/* Redirección por defecto a /admin */}
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
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
        // HU-12: la baja de un producto del buffet siempre pide confirmación
        onToggleBaja={(type, item) =>
          type === 'buffet' ? openConfirmBajaModal(type, item) : toggleBajaItem(type, item)
        }
      />

      <ItemFormModal
        key={`${modalState.mode}-${modalState.item?.id || 'new'}-${modalState.entityType}`}
        isOpen={
          !isEntityForm &&
          !isProductoForm &&
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
