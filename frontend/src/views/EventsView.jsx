import React, { useMemo, useState } from 'react';
import { Search, Plus, Trophy } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { EventCard } from '../components/cards/EventCard';

export const EventsView = () => {
  const {
    data,
    searchQuery,
    setSearchQuery,
    openCreateModal,
    openDetailModal,
    openEditModal,
    openConfirmBajaModal
  } = useAdmin();

  const [filter, setFilter] = useState('todos');
  const eventsList = useMemo(() => data.events || [], [data.events]);

  const filteredItems = useMemo(() => {
    return eventsList.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (filter === 'todos') return true;
      if (filter === 'programados') return item.status === 'programado';
      if (filter === 'baja') return item.status === 'baja' || item.status === 'cancelado';
      return true;
    });
  }, [eventsList, searchQuery, filter]);

  const counts = useMemo(() => {
    return {
      todos: eventsList.length,
      programados: eventsList.filter((i) => i.status === 'programado').length,
      baja: eventsList.filter((i) => i.status === 'baja' || i.status === 'cancelado').length
    };
  }, [eventsList]);

  return (
    <div className="view-content-wrapper">
      {/* Banner */}
      <div className="module-banner-box">
        <div className="module-banner-icon">
          <Trophy size={24} />
        </div>
        <div>
          <h4 className="module-banner-title">Gestor de Eventos & Torneos</h4>
          <p className="module-banner-desc">Programa competencias, partidas de rol y administra cupos de inscripción.</p>
        </div>
      </div>

      {/* Botón Principal de Alta */}
      <button
        className="primary-cta-yellow-btn"
        onClick={() => openCreateModal('events')}
      >
        <span className="cta-icon-circle">
          <Plus size={18} strokeWidth={3} />
        </span>
        NUEVO EVENTO / TORNEO
      </button>

      {/* Buscador */}
      <div className="search-bar-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar evento por nombre o código..."
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
          className={`filter-pill ${filter === 'programados' ? 'active' : ''}`}
          onClick={() => setFilter('programados')}
        >
          PROGRAMADOS ({counts.programados})
        </button>
        <button
          className={`filter-pill ${filter === 'baja' ? 'active' : ''}`}
          onClick={() => setFilter('baja')}
        >
          CANCELADOS / BAJA ({counts.baja})
        </button>
      </div>

      {/* Encabezado */}
      <div className="catalog-header-bar">
        <h3 className="catalog-active-title">CALENDARIO DE EVENTOS</h3>
        <span className="catalog-order-caption">{filteredItems.length} programados</span>
      </div>

      {/* Lista */}
      <div className="cards-stack">
        {filteredItems.length === 0 ? (
          <div className="empty-state-box">
            <p>No hay eventos registrados con estos filtros.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <EventCard
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
