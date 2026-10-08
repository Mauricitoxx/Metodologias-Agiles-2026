import React, { useMemo, useState } from 'react';
import { Search, Plus, Utensils } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { BuffetCard } from '../components/cards/BuffetCard';

export const BuffetView = () => {
  const {
    data,
    searchQuery,
    setSearchQuery,
    openCreateModal,
    openDetailModal,
    openEditModal,
    openConfirmBajaModal
  } = useAdmin();

  const [categoryFilter, setCategoryFilter] = useState('todos');
  const buffetList = useMemo(() => data.buffet || [], [data.buffet]);

  const filteredItems = useMemo(() => {
    return buffetList.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (categoryFilter === 'todos') return true;
      if (categoryFilter === 'disponibles') return item.status === 'disponible';
      if (categoryFilter === 'baja') return item.status === 'baja';
      return item.category?.toLowerCase() === categoryFilter.toLowerCase();
    });
  }, [buffetList, searchQuery, categoryFilter]);

  const counts = useMemo(() => {
    return {
      todos: buffetList.length,
      disponibles: buffetList.filter((i) => i.status === 'disponible').length,
      baja: buffetList.filter((i) => i.status === 'baja').length
    };
  }, [buffetList]);

  return (
    <div className="view-content-wrapper">
      {/* Resumen del Buffet */}
      <div className="module-banner-box">
        <div className="module-banner-icon">
          <Utensils size={24} />
        </div>
        <div>
          <h4 className="module-banner-title">Gestión de Cocina & Buffet</h4>
          <p className="module-banner-desc">Administra platos, snacks, bebidas y su disponibilidad en barra.</p>
        </div>
      </div>

      {/* Botón Principal de Alta */}
      <button
        className="primary-cta-yellow-btn"
        onClick={() => openCreateModal('buffet')}
      >
        <span className="cta-icon-circle">
          <Plus size={18} strokeWidth={3} />
        </span>
        NUEVO PLATO / BEBIDA
      </button>

      {/* Buscador */}
      <div className="search-bar-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar plato por código o nombre..."
          className="search-input"
        />
        <button className="search-btn-blue" aria-label="Buscar">
          <Search size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Filtros */}
      <div className="filter-pills-row">
        <button
          className={`filter-pill ${categoryFilter === 'todos' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('todos')}
        >
          TODOS ({counts.todos})
        </button>
        <button
          className={`filter-pill ${categoryFilter === 'disponibles' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('disponibles')}
        >
          EN CARTA ({counts.disponibles})
        </button>
        <button
          className={`filter-pill ${categoryFilter === 'baja' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('baja')}
        >
          DADOS DE BAJA ({counts.baja})
        </button>
      </div>

      {/* Encabezado */}
      <div className="catalog-header-bar">
        <h3 className="catalog-active-title">MENÚ BUFFET ACTIVO</h3>
        <span className="catalog-order-caption">{filteredItems.length} productos</span>
      </div>

      {/* Lista */}
      <div className="cards-stack">
        {filteredItems.length === 0 ? (
          <div className="empty-state-box">
            <p>No se encontraron productos en el buffet con estos filtros.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <BuffetCard
              key={item.id}
              item={item}
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
