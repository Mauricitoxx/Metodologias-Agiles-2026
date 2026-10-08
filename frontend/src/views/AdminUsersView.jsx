import React, { useMemo, useState } from 'react';
import { Search, Plus, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { AdminUserCard } from '../components/cards/AdminUserCard';

export const AdminUsersView = () => {
  const {
    data,
    searchQuery,
    setSearchQuery,
    currentUser,
    openCreateModal,
    openDetailModal,
    openEditModal,
    openConfirmBajaModal
  } = useAdmin();

  const [filter, setFilter] = useState('todos');
  const adminsList = useMemo(() => data.admins || [], [data.admins]);

  const filteredItems = useMemo(() => {
    return adminsList.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.role?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (filter === 'todos') return true;
      if (filter === 'activos') return item.status === 'activo';
      if (filter === 'inactivos') return item.status === 'inactivo';
      return true;
    });
  }, [adminsList, searchQuery, filter]);

  const counts = useMemo(() => {
    return {
      todos: adminsList.length,
      activos: adminsList.filter((i) => i.status === 'activo').length,
      inactivos: adminsList.filter((i) => i.status === 'inactivo').length
    };
  }, [adminsList]);

  return (
    <div className="view-content-wrapper">
      {/* Banner de Seguridad & Control */}
      <div className="module-banner-box">
        <div className="module-banner-icon admin-banner-icon">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="module-banner-title">Control de Acceso y Roles</h4>
          <p className="module-banner-desc">Administra permisos de personal, altas de cuenta y bajas de administradores.</p>
        </div>
      </div>

      {/* Alerta de regla de seguridad */}
      <div className="security-notice-box">
        <AlertCircle size={15} />
        <span><strong>Seguridad activa:</strong> No está permitido dar de baja al único Superadministrador del sistema.</span>
      </div>

      {/* Botón Principal de Alta */}
      <button
        className="primary-cta-yellow-btn"
        onClick={() => openCreateModal('admins')}
      >
        <span className="cta-icon-circle">
          <Plus size={18} strokeWidth={3} />
        </span>
        NUEVO ADMINISTRADOR
      </button>

      {/* Buscador */}
      <div className="search-bar-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar administrador por nombre o email..."
          className="search-input"
        />
        <button className="search-btn-blue" aria-label="Buscar">
          <Search size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Filtros */}
      <div className="filter-pills-row">
        <button
          className={`filter-pill ${filter === 'todos' ? 'active' : ''}`}
          onClick={() => setFilter('todos')}
        >
          TODOS ({counts.todos})
        </button>
        <button
          className={`filter-pill ${filter === 'activos' ? 'active' : ''}`}
          onClick={() => setFilter('activos')}
        >
          ACTIVOS ({counts.activos})
        </button>
        <button
          className={`filter-pill ${filter === 'inactivos' ? 'active' : ''}`}
          onClick={() => setFilter('inactivos')}
        >
          INACTIVOS ({counts.inactivos})
        </button>
      </div>

      {/* Encabezado */}
      <div className="catalog-header-bar">
        <h3 className="catalog-active-title">PERSONAL CON ACCESO</h3>
        <span className="catalog-order-caption">{filteredItems.length} registrados</span>
      </div>

      {/* Lista */}
      <div className="cards-stack">
        {filteredItems.length === 0 ? (
          <div className="empty-state-box">
            <p>No se encontraron administradores con estos filtros.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <AdminUserCard
              key={item.id}
              item={item}
              isCurrentLoggedUser={item.id === currentUser?.id}
              onOpenDetail={openDetailModal}
              onOpenEdit={openEditModal}
              onOpenConfirmBaja={openConfirmBajaModal}
            />
          ))
        )}
      </div>
    </div>
  );
};
