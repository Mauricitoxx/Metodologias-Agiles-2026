import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../services/storage';
import { AdminContext } from './adminContextInstance';
import { auth, getSessionToken, clearSessionToken } from '../services/auth';
import { mangaComicService } from '../services/mangaComicService';

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
  
useEffect(() => {
  let cancelled = false;

  const loadComics = async () => {
    try {
      const result = await mangaComicService.listAllAdmin();

      const comics = (Array.isArray(result) ? result : []).map((item) => ({
        ...item,
        code: `#MC-${String(item.id).padStart(3, '0')}`,
        status: item.is_active ? 'disponible' : 'baja',
        volumes: item.volume_number,
        description: item.synopsis || '',
        image: item.image || '',
      }));

      if (!cancelled) {
        setData((prev) => ({
          ...prev,
          comics,
        }));
      }
    } catch (error) {
      if (!cancelled) {
        showToast(
          `No se pudieron cargar los mangas y cómics: ${error.message}`,
          'error'
        );
      }
    }
  };

  loadComics();

  return () => {
    cancelled = true;
  };
}, []);


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

const addItem = async (entityType, itemData) => {
  if (entityType === 'comics') {
    try {
      const created = await mangaComicService.create(itemData);

      const newItem = {
        ...created,
        code: `#MC-${String(created.id).padStart(3, '0')}`,
        status: created.is_active ? 'disponible' : 'baja',
        volumes: created.volume_number,
        description: created.synopsis || '',
        image: created.image || '',
      };

      setData((prev) => ({
        ...prev,
        comics: [newItem, ...(prev.comics || []).filter((item) => item.id !== created.id)],
      }));

      showToast(`Manga/cómic "${created.title}" creado correctamente`);
      return true;
    } catch (error) {
      showToast(error.message || 'No se pudo crear el manga/cómic.', 'error');
      return false;
    }
  }

  const prefixMap = {
    boardgames: '#BG-',
    cards: '#TCG-',
    buffet: '#BF-',
    admins: '#USR-',
  };

  const count = (data[entityType]?.length || 0) + 1;
  const newCode = `${prefixMap[entityType] || '#IT-'}${String(count).padStart(3, '0')}`;

  const newItem = {
    ...itemData,
    id: `${entityType}-${crypto.randomUUID()}`,
    code: itemData.code || newCode,
    createdAt: new Date().toLocaleDateString('en-CA'),
    loansCount: 0,
    status: itemData.status || (entityType === 'admins' ? 'activo' : 'disponible'),
  };

  const saved = persistData((prev) => ({
    ...prev,
    [entityType]: [newItem, ...(prev[entityType] || [])],
  }));

  if (!saved) return false;

  showToast(`Elemento ${newItem.code} dado de alta con éxito`);
  return true;
};



const updateItem = async (entityType, updatedItem) => {
  if (entityType === 'comics') {
    try {
        const updated = await mangaComicService.update(updatedItem.id, {
        title: updatedItem.title,
        volume_number: Number(updatedItem.volume_number),
        pages: Number(updatedItem.pages),
        copies: Number(updatedItem.copies),
        synopsis: updatedItem.synopsis || null,
        image: updatedItem.image || null,
      });

      const normalized = {
        ...updated,
        code: `#MC-${String(updated.id).padStart(3, '0')}`,
        status: updated.is_active ? 'disponible' : 'baja',
        volumes: updated.volume_number,
        description: updated.synopsis || '',
        image: updated.image || '',
      };

      setData((prev) => ({
        ...prev,
        comics: (prev.comics || []).map((item) =>
          item.id === normalized.id ? normalized : item
        ),
      }));

      showToast(`Registro "${updated.title}" actualizado`);
      return true;
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar el manga/cómic.', 'error');
      return false;
    }
  }

  const saved = persistData((prev) => ({
    ...prev,
    [entityType]: (prev[entityType] || []).map((item) =>
      item.id === updatedItem.id ? { ...item, ...updatedItem } : item
    ),
  }));

  if (!saved) return false;

  showToast(`Registro ${updatedItem.code || updatedItem.title || updatedItem.name} actualizado`);
  return true;
};


  // Toggle Baja / Desactivar y reactivar
 

const toggleBajaItem = async (entityType, item) => {
  if (entityType === 'comics') {
    const isBaja = item.status === 'baja' || item.is_active === false;

    try {
      // Si está dado de baja, lo reactivamos desde el backend.
      if (isBaja) {
        const result = await mangaComicService.reactivate(item.id);

        const updated = {
          ...item,
          ...(result && typeof result === 'object' ? result : {}),
          status: 'disponible',
          is_active: true,
        };

        setData((prev) => ({
          ...prev,
          comics: (prev.comics || []).map((comic) =>
            comic.id === item.id ? updated : comic
          ),
        }));

        showToast(`Reactivado: ${item.title}`, 'success');
        return true;
      }

      // Si está activo, lo damos de baja desde el backend.
      const result = await mangaComicService.deactivate(item.id);

      const updated = {
        ...item,
        ...(result && typeof result === 'object' ? result : {}),
        status: 'baja',
        is_active: false,
      };

      setData((prev) => ({
        ...prev,
        comics: (prev.comics || []).map((comic) =>
          comic.id === item.id ? updated : comic
        ),
      }));

      showToast(`Dado de baja: ${item.title}`, 'warning');
      return true;
    } catch (error) {
      showToast(
        error.message || (
          isBaja
            ? 'No se pudo reactivar el manga/cómic.'
            : 'No se pudo dar de baja el manga/cómic.'
        ),
        'error'
      );
      return false;
    }
  }

  // Mantener la protección del único Superadministrador activo.
  if (entityType === 'admins') {
    const activeSuperadmins = data.admins.filter(
      (admin) => admin.role === 'Superadmin' && admin.status === 'activo'
    );

    if (
      item.role === 'Superadmin' &&
      item.status === 'activo' &&
      activeSuperadmins.length <= 1
    ) {
      showToast(
        'No puedes dar de baja al único Superadministrador activo.',
        'error'
      );
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
    [entityType]: (prev[entityType] || []).map((element) =>
      element.id === item.id
        ? { ...element, status: newStatus }
        : element
    ),
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
