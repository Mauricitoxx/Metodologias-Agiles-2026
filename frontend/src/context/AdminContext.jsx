import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import { AdminContext } from './adminContextInstance';
import { auth, getSessionToken, clearSessionToken } from '../services/auth';

export const AdminProvider = ({ children }) => {
  const [data, setData] = useState(() => storage.get());
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getSessionToken()));
  const [authError, setAuthError] = useState('');
  const [authRetry, setAuthRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const token = getSessionToken();
    if (!token) return;
    auth.me(token).then((admin) => {
      if (!cancelled) setSession(admin);
    }).catch((error) => {
      if (cancelled) return;
      if ([401, 403].includes(error.status)) clearSessionToken();
      else setAuthError(error.message);
    }).finally(() => { if (!cancelled) setAuthLoading(false); });
    return () => { cancelled = true; };
  }, [authRetry]);
  const [currentTab, setCurrentTab] = useState('hub'); // 'hub' | 'inventario' | 'staff'
  const [catalogSubTab, setCatalogSubTab] = useState('boardgames'); // 'boardgames' | 'comics' | 'cards' | 'buffet' | 'actividades'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos' | 'disponibles' | 'en_mesa' | 'baja'
  const [theme, setTheme] = useState(() => localStorage.getItem('frikioteca_theme') || 'light');

  // Modal State for Create, Edit, Detail (Ficha), Confirm Baja
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit' | 'detail' | 'confirm_baja'
    entityType: 'boardgames',
    item: null
  });

  const [notification, setNotification] = useState(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('frikioteca_theme', theme);
  }, [theme]);

  // Persist data on change
  const persistData = (updater) => {
    try {
      const next = typeof updater === 'function' ? updater(data) : updater;
      storage.set(next);
      setData(next);
      return true;
    } catch {
      showToast('No se pudo guardar: el almacenamiento local está lleno o no está disponible.', 'error');
      return false;
    }
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3200);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const login = async (email, password) => {
    const result = await auth.login(email, password);
    setSession(result.administrador);
    setAuthError('');
    setCurrentTab('hub');
  };
  const logout = async () => {
    const token = getSessionToken();
    try {
      if (token) await auth.logout(token);
    } catch (error) {
      if (![401, 403].includes(error.status)) {
        showToast('No se pudo cerrar la sesión en el servidor. Intentá nuevamente.', 'error');
        return false;
      }
    }
    clearSessionToken();
    setSession(null);
    closeModal();
    setCurrentTab('hub');
    return true;
  };

  // Current active user
  const currentUser = useMemo(() => {
    const demo = data.admins.find((a) => a.isCurrentUser) || data.admins[0];
    return session ? { ...demo, name: session.nombre, email: session.email, role: 'Administrador' } : demo;
  }, [data.admins, session]);

  // CRUD Operations
  const addItem = (entityType, itemData) => {
    let newCode = '';
    const prefixMap = {
      boardgames: '#BG-',
      comics: '#MC-',
      cards: '#TCG-',
      buffet: '#BF-',
      admins: '#USR-'
    };

    const count = (data[entityType]?.length || 0) + 1;
    newCode = `${prefixMap[entityType] || '#IT-'}${String(count).padStart(3, '0')}`;

    const newItem = {
      ...itemData,
      id: `${entityType}-${crypto.randomUUID()}`,
      code: itemData.code || newCode,
      createdAt: new Date().toLocaleDateString('en-CA'),
      loansCount: 0,
      status: itemData.status || (entityType === 'admins' ? 'activo' : 'disponible')
    };

    const saved = persistData((prev) => ({
      ...prev,
      [entityType]: [newItem, ...(prev[entityType] || [])]
    }));

    if (!saved) return false;
    showToast(`Elemento ${newItem.code} dado de alta con éxito`);
    return true;
  };

  const updateItem = (entityType, updatedItem) => {
    const saved = persistData((prev) => ({
      ...prev,
      [entityType]: (prev[entityType] || []).map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      )
    }));
    if (!saved) return false;
    showToast(`Registro ${updatedItem.code || updatedItem.title || updatedItem.name} actualizado`);
    return true;
  };

  // Toggle Baja / Desactivar
  const toggleBajaItem = (entityType, item) => {
    // Safety check for admins: cannot delete/deactivate self if last active superadmin
    if (entityType === 'admins') {
      const activeSuperadmins = data.admins.filter(
        (a) => a.role === 'Superadmin' && a.status === 'activo'
      );
      if (
        item.role === 'Superadmin' &&
        item.status === 'activo' &&
        activeSuperadmins.length <= 1
      ) {
        showToast('No puedes dar de baja al único Superadministrador activo.', 'error');
        return false;
      }
    }

    const isBaja = item.status === 'baja' || item.status === 'inactivo';
    const newStatus = isBaja
      ? entityType === 'admins'
        ? 'activo'
        : 'disponible'
      : entityType === 'admins'
      ? 'inactivo'
      : 'baja';

    const saved = persistData((prev) => ({
      ...prev,
      [entityType]: (prev[entityType] || []).map((el) =>
        el.id === item.id ? { ...el, status: newStatus } : el
      )
    }));

    if (!saved) return false;
    showToast(
      isBaja
        ? `Reactivado: ${item.title || item.name}`
        : `Dado de baja: ${item.title || item.name}`,
      isBaja ? 'success' : 'warning'
    );
    return true;
  };

  // Modal helpers
  const openCreateModal = (entityType) => {
    setModalState({
      isOpen: true,
      mode: 'create',
      entityType: entityType || (currentTab === 'staff' ? 'admins' : catalogSubTab),
      item: null
    });
  };

  const openEditModal = (entityType, item) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      entityType,
      item
    });
  };

  const openDetailModal = (entityType, item) => {
    setModalState({
      isOpen: true,
      mode: 'detail',
      entityType,
      item
    });
  };

  const openConfirmBajaModal = (entityType, item) => {
    setModalState({
      isOpen: true,
      mode: 'confirm_baja',
      entityType,
      item
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <AdminContext.Provider
      value={{
        session,
        authLoading,
        authError,
        retryAuth: () => {
          setAuthLoading(true);
          setAuthError('');
          setAuthRetry((value) => value + 1);
        },
        login,
        logout,
        data,
        currentTab,
        setCurrentTab,
        catalogSubTab,
        setCatalogSubTab,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        theme,
        toggleTheme,
        currentUser,
        notification,
        showToast,
        addItem,
        updateItem,
        toggleBajaItem,
        modalState,
        openCreateModal,
        openEditModal,
        openDetailModal,
        openConfirmBajaModal,
        closeModal
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
