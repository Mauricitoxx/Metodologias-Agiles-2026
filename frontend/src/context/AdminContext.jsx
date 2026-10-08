import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import { AdminContext } from './adminContextInstance';

export const AdminProvider = ({ children }) => {
  const [data, setData] = useState(() => storage.get());
  const [currentTab, setCurrentTab] = useState('hub'); // 'hub' | 'inventario' | 'staff'
  const [catalogSubTab, setCatalogSubTab] = useState('boardgames'); // 'boardgames' | 'comics' | 'cards'
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
    setData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      storage.set(next);
      return next;
    });
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3200);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Current active user
  const currentUser = useMemo(() => {
    return data.admins.find((a) => a.isCurrentUser) || data.admins[0];
  }, [data.admins]);

  // CRUD Operations
  const addItem = (entityType, itemData) => {
    let newCode = '';
    const prefixMap = {
      boardgames: '#BG-',
      comics: '#MC-',
      cards: '#TCG-',
      buffet: '#BF-',
      events: '#EV-',
      admins: '#USR-'
    };

    const count = (data[entityType]?.length || 0) + 1;
    newCode = `${prefixMap[entityType] || '#IT-'}${String(count).padStart(3, '0')}`;

    const newItem = {
      ...itemData,
      id: `${entityType}-${Date.now()}`,
      code: itemData.code || newCode,
      createdAt: new Date().toISOString().split('T')[0],
      loansCount: 0,
      status: itemData.status || (entityType === 'admins' ? 'activo' : 'disponible')
    };

    persistData((prev) => ({
      ...prev,
      [entityType]: [newItem, ...(prev[entityType] || [])]
    }));

    showToast(`Elemento ${newItem.code} dado de alta con éxito`);
  };

  const updateItem = (entityType, updatedItem) => {
    persistData((prev) => ({
      ...prev,
      [entityType]: (prev[entityType] || []).map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      )
    }));
    showToast(`Registro ${updatedItem.code || updatedItem.title || updatedItem.name} actualizado`);
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

    persistData((prev) => ({
      ...prev,
      [entityType]: (prev[entityType] || []).map((el) =>
        el.id === item.id ? { ...el, status: newStatus } : el
      )
    }));

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
