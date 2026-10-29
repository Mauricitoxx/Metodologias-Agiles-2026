import React, { useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { GameCard } from '../components/cards/GameCard';
import { BuffetCard } from '../components/cards/BuffetCard';
import { ActivitiesView } from './ActivitiesView';

export const CatalogView = () => {
  const {
    data,
    catalogSubTab,
    setCatalogSubTab,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    openCreateModal,
    openDetailModal,
    openEditModal,
    openConfirmBajaModal
  } = useAdmin();

  // Counts for entity tabs
  const boardgamesCount = data.boardgames?.length || 0;
  const comicsCount = data.comics?.length || 0;
  const cardsCount = data.cards?.length || 0;

  // Active items list
  const currentList = useMemo(() => data[catalogSubTab] || [], [data, catalogSubTab]);

  // Filter and search
  const filteredItems = useMemo(() => {
    return currentList.filter((item) => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.shelf?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Filter
      if (filterStatus === 'todos') return true;
      if (filterStatus === 'disponibles') return item.status === 'disponible';
      if (filterStatus === 'en_mesa') return item.status === 'en_mesa';
      if (filterStatus === 'baja') return item.status === 'baja' || item.status === 'en_reparacion';

      return true;
    }).sort((a, b) => a.code.localeCompare(b.code, 'es', { numeric: true }));
  }, [currentList, searchQuery, filterStatus]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      todos: currentList.length,
      disponibles: currentList.filter((i) => i.status === 'disponible').length,
      en_mesa: currentList.filter((i) => i.status === 'en_mesa').length,
      baja: currentList.filter((i) => i.status === 'baja' || i.status === 'en_reparacion').length
    };
  }, [currentList]);

  const getSubTabLabel = () => {
    if (catalogSubTab === 'boardgames') return 'JUEGO DE MESA';
    if (catalogSubTab === 'comics') return 'CÓMIC / MANGA';
    if (catalogSubTab === 'buffet') return 'PRODUCTO DE BUFFET';
    return 'MAZO DE CARTAS';
  };

  // 1. SELECCIONA ENTIDAD (Tabs superiores horizontales)
  const entitySelector = (
    <div className="entity-selector-section">
      <span className="section-small-label">SELECCIONA ENTIDAD (5)</span>
      <div className="entity-pills-scroll">
        <button
          className={`entity-pill-btn ${catalogSubTab === 'boardgames' ? 'active' : ''}`}
          onClick={() => setCatalogSubTab('boardgames')}
        >
          <span className="entity-pill-emoji">🎲</span>
          <div className="entity-pill-texts">
            <span className="entity-pill-title">JUEGOS DE MESA</span>
            <span className="entity-pill-subtitle">{boardgamesCount} items</span>
          </div>
        </button>

        <button
          className={`entity-pill-btn ${catalogSubTab === 'comics' ? 'active' : ''}`}
          onClick={() => setCatalogSubTab('comics')}
        >
          <span className="entity-pill-emoji">📖</span>
          <div className="entity-pill-texts">
            <span className="entity-pill-title">MANGAS & CÓMICS</span>
            <span className="entity-pill-subtitle">{comicsCount} vols</span>
          </div>
        </button>

        <button
          className={`entity-pill-btn ${catalogSubTab === 'cards' ? 'active' : ''}`}
          onClick={() => setCatalogSubTab('cards')}
        >
          <span className="entity-pill-emoji">🃏</span>
          <div className="entity-pill-texts">
            <span className="entity-pill-title">JUEGOS DE CARTAS</span>
            <span className="entity-pill-subtitle">{cardsCount} mazos</span>
          </div>
        </button>
        <button className={`entity-pill-btn ${catalogSubTab === 'buffet' ? 'active' : ''}`} onClick={() => setCatalogSubTab('buffet')}><span className="entity-pill-emoji">🍔</span><div className="entity-pill-texts"><span className="entity-pill-title">BUFFET</span><span className="entity-pill-subtitle">{data.buffet.length} productos</span></div></button>
        <button
          className={`entity-pill-btn ${catalogSubTab === 'actividades' ? 'active' : ''}`}
          onClick={() => setCatalogSubTab('actividades')}
        >
          <span className="entity-pill-emoji">📅</span>
          <div className="entity-pill-texts">
            <span className="entity-pill-title">ACTIVIDADES</span>
            <span className="entity-pill-subtitle">cronograma</span>
          </div>
        </button>
      </div>
    </div>
  );

  // Activities come from the API and have their own list, filters and form
  if (catalogSubTab === 'actividades') return <ActivitiesView header={entitySelector} />;

  return (
    <div className="view-content-wrapper">
      {entitySelector}

      {/* 2. BOTÓN PRINCIPAL DE ALTA (Amarillo Stitch) */}
      <button
        className="primary-cta-yellow-btn"
        onClick={() => openCreateModal(catalogSubTab)}
      >
        <span className="cta-icon-circle">
          <Plus size={18} strokeWidth={3} />
        </span>
        NUEVO {getSubTabLabel()}
      </button>

      {/* 3. BARRA DE BÚSQUEDA */}
      <div className="search-bar-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por código (#BG-001) o título..."
          className="search-input"
        />
        <button className="search-btn-blue" aria-label="Buscar">
          <Search size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* 4. FILTROS RÁPIDOS POR PÍLDORA */}
      <div className="filter-pills-row">
        <button
          className={`filter-pill ${filterStatus === 'todos' ? 'active' : ''}`}
          onClick={() => setFilterStatus('todos')}
        >
          TODOS ({counts.todos})
        </button>
        <button
          className={`filter-pill ${filterStatus === 'disponibles' ? 'active' : ''}`}
          onClick={() => setFilterStatus('disponibles')}
        >
          DISPONIBLES ({counts.disponibles})
        </button>
        <button
          className={`filter-pill ${filterStatus === 'en_mesa' ? 'active' : ''}`}
          onClick={() => setFilterStatus('en_mesa')}
        >
          EN MESA ({counts.en_mesa})
        </button>
        <button
          className={`filter-pill ${filterStatus === 'baja' ? 'active' : ''}`}
          onClick={() => setFilterStatus('baja')}
        >
          BAJA / TALLER ({counts.baja})
        </button>
      </div>

      {/* 5. ENCABEZADO DE LISTADO ACTIVO */}
      <div className="catalog-header-bar">
        <h3 className="catalog-active-title">CATÁLOGO ACTIVO</h3>
        <span className="catalog-order-caption">Orden: Código asc.</span>
      </div>

      {/* 6. LISTADO DE TARJETAS */}
      <div className="cards-stack">
        {filteredItems.length === 0 ? (
          <div className="empty-state-box">
            <p>No se encontraron elementos con los filtros actuales.</p>
          </div>
        ) : (
          filteredItems.map((item) => catalogSubTab === 'buffet' ? <BuffetCard key={item.id} item={item} onOpenDetail={openDetailModal} onOpenEdit={openEditModal} onOpenConfirmBaja={openConfirmBajaModal} /> : (
            <GameCard
              key={item.id}
              item={item}
              entityType={catalogSubTab}
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
