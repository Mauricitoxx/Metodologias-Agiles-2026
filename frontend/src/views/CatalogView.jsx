import React, { useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { GameCard } from '../components/cards/GameCard';
import { BuffetCard } from '../components/cards/BuffetCard';
import { ActivitiesView } from './ActivitiesView';
import { JuegosView } from './JuegosView';

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

  // Conteo de elementos de inventario
  const gamesCount = (data.boardgames?.length || 0) + (data.cards?.length || 0);
  const comicsCount = data.comics?.length || 0;
  const buffetCount = data.buffet?.length || 0;

  // Active items list
  const currentList = useMemo(() => data[catalogSubTab] || [], [data, catalogSubTab]);

  // Filter and search
  const filteredItems = useMemo(() => {
    const items = currentList.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.shelf?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (filterStatus === 'todos') return true;
      if (filterStatus === 'disponibles') return item.status === 'disponible';
      if (filterStatus === 'en_mesa') return item.status === 'en_mesa';
      if (filterStatus === 'baja') return item.status === 'baja' || item.status === 'en_reparacion';

      return true;
    });

    // El buffet ya llega de la API ordenado por categoría y nombre
    if (catalogSubTab === 'buffet') return items;
    return items.sort((a, b) => (a.code || '').localeCompare(b.code || '', 'es', { numeric: true }));
  }, [currentList, searchQuery, filterStatus, catalogSubTab]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      todos: currentList.length,
      disponibles: currentList.filter((i) => i.status === 'disponible').length,
      en_mesa: currentList.filter((i) => i.status === 'en_mesa').length,
      baja: currentList.filter((i) => i.status === 'baja' || i.status === 'en_reparacion').length
    };
  }, [currentList]);

  const isBuffet = catalogSubTab === 'buffet';

  const getSubTabLabel = () => {
    if (catalogSubTab === 'comics') return 'CÓMIC / MANGA';
    if (catalogSubTab === 'buffet') return 'PRODUCTO DE BUFFET';
    if (catalogSubTab === 'actividades') return 'ACTIVIDAD';
    return 'ELEMENTO';
  };

  // Selector de Entidad de Inventario
  const entitySelector = (
    <div className="entity-selector-section">
      <span className="section-small-label">SELECCIONA ENTIDAD DE INVENTARIO</span>
      <div className="entity-pills-scroll">
        <button
          type="button"
          className={`entity-pill-btn ${catalogSubTab === 'boardgames' ? 'active' : ''}`}
          onClick={() => setCatalogSubTab('boardgames')}
        >
          <span className="entity-pill-emoji">🎲</span>
          <div className="entity-pill-texts">
            <span className="entity-pill-title">JUEGOS DE MESA</span>
            <span className="entity-pill-subtitle">{gamesCount} juegos</span>
          </div>
        </button>

        <button
          type="button"
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
          type="button"
          className={`entity-pill-btn ${catalogSubTab === 'buffet' ? 'active' : ''}`}
          onClick={() => {
            setCatalogSubTab('buffet');
            if (filterStatus === 'en_mesa') setFilterStatus('todos');
          }}
        >
          <span className="entity-pill-emoji">🍔</span>
          <div className="entity-pill-texts">
            <span className="entity-pill-title">CARTA</span>
            <span className="entity-pill-subtitle">{buffetCount} productos</span>
          </div>
        </button>

        <button
          type="button"
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

  // Subtabs con vista propia
  if (catalogSubTab === 'boardgames') return <JuegosView header={entitySelector} />;
  if (catalogSubTab === 'actividades') return <ActivitiesView header={entitySelector} />;

  return (
    <div className="view-content-wrapper">
      {entitySelector}

      {/* Botón de Alta */}
      <div className="catalog-action-row">
        <button
          type="button"
          className="primary-cta-yellow-btn"
          onClick={() => openCreateModal(catalogSubTab)}
        >
          <span className="cta-icon-circle">
            <Plus size={18} strokeWidth={3} />
          </span>
          NUEVO {getSubTabLabel()}
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="search-bar-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por código (#MC-001) o título..."
          className="search-input"
        />
        <button type="button" className="search-btn-blue" aria-label="Buscar">
          <Search size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Filtros Rápidos */}
      <div className="filter-pills-row">
        <button
          type="button"
          className={`filter-pill ${filterStatus === 'todos' ? 'active' : ''}`}
          onClick={() => setFilterStatus('todos')}
        >
          TODOS ({counts.todos})
        </button>
        <button
          type="button"
          className={`filter-pill ${filterStatus === 'disponibles' ? 'active' : ''}`}
          onClick={() => setFilterStatus('disponibles')}
        >
          {isBuffet ? 'ACTIVOS' : 'DISPONIBLES'} ({counts.disponibles})
        </button>
        {/* El buffet solo tiene productos activos o inactivos */}
        {!isBuffet && (
          <button
            type="button"
            className={`filter-pill ${filterStatus === 'en_mesa' ? 'active' : ''}`}
            onClick={() => setFilterStatus('en_mesa')}
          >
            EN MESA ({counts.en_mesa})
          </button>
        )}
        <button
          type="button"
          className={`filter-pill ${filterStatus === 'baja' ? 'active' : ''}`}
          onClick={() => setFilterStatus('baja')}
        >
          {isBuffet ? 'INACTIVOS' : 'BAJA / TALLER'} ({counts.baja})
        </button>
      </div>

      {/* Encabezado */}
      <div className="catalog-header-bar">
        <h3 className="catalog-active-title">CATÁLOGO ACTIVO</h3>
        <span className="catalog-order-caption">
          {isBuffet ? 'Orden: Categoría y nombre' : 'Orden: Código asc.'}
        </span>
      </div>

      {/* Tarjetas */}
      <div className="cards-stack">
        {filteredItems.length === 0 ? (
          <div className="empty-state-box">
            <p>No se encontraron elementos con los filtros actuales.</p>
          </div>
        ) : (
          filteredItems.map((item) =>
            catalogSubTab === 'buffet' ? (
              <BuffetCard
                key={item.id}
                item={item}
                onOpenDetail={openDetailModal}
                onOpenEdit={openEditModal}
                onOpenConfirmBaja={openConfirmBajaModal}
              />
            ) : (
              <GameCard
                key={item.id}
                item={item}
                entityType={catalogSubTab}
                onOpenDetail={openDetailModal}
                onOpenEdit={openEditModal}
                onOpenConfirmBaja={openConfirmBajaModal}
              />
            )
          )
        )}
      </div>
    </div>
  );
};
