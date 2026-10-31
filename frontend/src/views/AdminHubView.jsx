import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield,
  Plus,
  Tags,
  Search,
  RefreshCw,
  X,
  ShieldAlert,
  Pencil,
  Trash2,
  Dices,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Utensils,
  CalendarDays,
  IdCard,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/useAdmin';
import { categoriaService } from '../services/categoriaService';
import { GameCard } from '../components/cards/GameCard';
import { CategoriaFormModal } from '../components/modals/CategoriaFormModal';
import { ConfirmDeleteCategoryModal } from '../components/modals/ConfirmDeleteCategoryModal';

export const AdminHubView = () => {
  const navigate = useNavigate();
  const {
    data,
    showToast,
    openCreateModal,
    openDetailModal,
    openEditModal,
    openConfirmBajaModal,
    cargarJuegosBackend,
    loadingJuegos,
    setCatalogSubTab
  } = useAdmin();

  // Estados locales de categorías
  const [categorias, setCategorias] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos' | 'disponibles' | 'en_mesa' | 'baja'

  // Modales de categoría
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Alerta persistente si hubo bloqueo
  const [alertMessage, setAlertMessage] = useState(null);

  // Colapso individual de cajitas (por defecto todas abiertas)
  const [collapsedCajitas, setCollapsedCajitas] = useState({});

  // Cargar categorías del backend
  const cargarCategorias = useCallback(async () => {
    setLoadingCats(true);
    try {
      const result = await categoriaService.listar();
      setCategorias(Array.isArray(result) ? result : []);
    } catch (err) {
      showToast(err.message || 'Error al cargar las categorías', 'error');
    } finally {
      setLoadingCats(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargarCategorias();
    cargarJuegosBackend();
  }, [cargarCategorias, cargarJuegosBackend]);

  // Manejo de Alta y Modificación de Categoría
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
    setAlertMessage(null);
  };

  const handleOpenEditCategory = (categoria) => {
    setEditingCategory(categoria);
    setIsFormOpen(true);
    setAlertMessage(null);
  };

  const handleSaveCategory = async (formData) => {
    if (editingCategory) {
      const updated = await categoriaService.actualizar(editingCategory.id, formData);
      showToast(`Categoría "${updated.nombre}" actualizada con éxito`, 'success');
    } else {
      const created = await categoriaService.crear(formData);
      showToast(`Categoría "${created.nombre}" creada con éxito`, 'success');
    }
    setIsFormOpen(false);
    setEditingCategory(null);
    await cargarCategorias();
    await cargarJuegosBackend();
    return true;
  };

  // Manejo de Eliminación de Categoría con bloqueo estricto si tiene juegos
  const handleOpenDeleteCategory = (categoria, tieneJuegos) => {
    if (tieneJuegos) {
      const msg = 'No se puede eliminar esta categoría porque hay juegos usándola';
      setAlertMessage(msg);
      showToast(msg, 'error');
      return;
    }
    setAlertMessage(null);
    setDeletingCategory(categoria);
  };

  const handleConfirmDeleteCategory = async (categoria) => {
    const juegosCount = categoria.juegos_count || (categoria.juegos ? categoria.juegos.length : 0);
    if (juegosCount > 0) {
      const msg = 'No se puede eliminar esta categoría porque hay juegos usándola';
      setAlertMessage(msg);
      showToast(msg, 'error');
      throw new Error(msg);
    }

    try {
      await categoriaService.eliminar(categoria.id);
      showToast(`Categoría "${categoria.nombre}" eliminada con éxito`, 'warning');
      setDeletingCategory(null);
      setAlertMessage(null);
      await cargarCategorias();
    } catch (err) {
      const msg = err.message || 'No se puede eliminar esta categoría porque hay juegos usándola';
      setAlertMessage(msg);
      showToast(msg, 'error');
      throw err;
    }
  };

  const toggleCollapse = (id) => {
    setCollapsedCajitas((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Unificación de todos los juegos (Mesa + Cartas)
  const allGames = useMemo(() => {
    const bg = (data.boardgames || []).map((g) => ({
      ...g,
      entityType: 'boardgames',
      gameKind: 'Juego de Mesa'
    }));
    const cd = (data.cards || []).map((c) => ({
      ...c,
      entityType: 'cards',
      gameKind: 'Juego de Cartas'
    }));
    return [...bg, ...cd];
  }, [data.boardgames, data.cards]);

  // Filtrado de juegos por búsqueda y estado
  const filteredGames = useMemo(() => {
    return allGames.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.code?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.shelf?.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (filterStatus === 'todos') return true;
      if (filterStatus === 'disponibles') return item.status === 'disponible';
      if (filterStatus === 'en_mesa') return item.status === 'en_mesa';
      if (filterStatus === 'baja') return item.status === 'baja' || item.status === 'en_reparacion';

      return true;
    }).sort((a, b) => (a.code || '').localeCompare(b.code || '', 'es', { numeric: true }));
  }, [allGames, searchQuery, filterStatus]);

  // Agrupamiento en "Cajitas" (Las Categorías y sus Juegos dentro)
  const cajitas = useMemo(() => {
    // 1. Cada categoría registrada en la BD
    const list = categorias.map((cat) => {
      const catName = cat.nombre.toLowerCase().trim();
      const catGames = filteredGames.filter((game) => {
        // Coincidencia por array de categorias del backend
        if (game.categorias && Array.isArray(game.categorias) && game.categorias.length > 0) {
          return game.categorias.some((c) => c.id === cat.id || c.nombre?.toLowerCase().trim() === catName);
        }
        // Coincidencia por string category
        return (game.category || '').toLowerCase().includes(catName);
      });

      // Conteo oficial de juegos en esta categoría
      const officialCount = cat.juegos_count || (cat.juegos ? cat.juegos.length : catGames.length);

      return {
        id: cat.id,
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        rawCategory: cat,
        games: catGames,
        hasGamesOfficial: officialCount > 0,
        officialCount
      };
    });

    // 2. Juegos que no caen en ninguna categoría
    const unassignedGames = filteredGames.filter((game) => {
      if (game.categorias && Array.isArray(game.categorias) && game.categorias.length > 0) {
        return false;
      }
      const catStr = (game.category || '').toLowerCase().trim();
      if (!catStr || catStr === 'sin categoría') return true;
      return !categorias.some((cat) => catStr.includes(cat.nombre.toLowerCase().trim()));
    });

    if (unassignedGames.length > 0) {
      list.push({
        id: 'unassigned',
        nombre: 'Otros Juegos / Sin Categoría Asignada',
        descripcion: 'Juegos que aún no tienen una categoría oficial vinculada.',
        rawCategory: null,
        games: unassignedGames,
        hasGamesOfficial: unassignedGames.length > 0,
        officialCount: unassignedGames.length
      });
    }

    return list;
  }, [categorias, filteredGames]);

  // Estadísticas globales de juegos
  const counts = useMemo(() => {
    return {
      todos: allGames.length,
      disponibles: allGames.filter((i) => i.status === 'disponible').length,
      en_mesa: allGames.filter((i) => i.status === 'en_mesa').length,
      baja: allGames.filter((i) => i.status === 'baja' || i.status === 'en_reparacion').length
    };
  }, [allGames]);

  return (
    <div className="admin-hub-container">
      {/* 1. Badge Modo Admin Conectado */}
      <div className="admin-connected-badge">
        <Shield size={14} strokeWidth={2.5} />
        <span>MODO ADMIN CONECTADO</span>
      </div>

      {/* 2. Hero Título & Subtítulo */}
      <div className="admin-hub-hero">
        <h2 className="admin-hub-title">ADMIN CENTRAL</h2>
        <p className="admin-hub-subtitle">
          Base de operaciones de La Frikioteca. Gestioná las <strong>categorías</strong>, los <strong>juegos</strong> y el resto del catálogo friki.
        </p>
      </div>

      {/* 3. Barra de Acceso Rápido a Otros Módulos */}
      <div className="admin-hub-quick-nav" aria-label="Accesos rápidos">
        <button
          type="button"
          className="quick-nav-item"
          onClick={() => {
            setCatalogSubTab('comics');
            navigate('/admin/inventario');
          }}
          title="Ver Cómics y Mangas"
        >
          <BookOpen size={15} color="#0284c7" />
          <span>MANGAS & CÓMICS</span>
          <span className="quick-nav-badge">{data.comics?.length || 0}</span>
        </button>

        <button
          type="button"
          className="quick-nav-item"
          onClick={() => {
            setCatalogSubTab('buffet');
            navigate('/admin/inventario');
          }}
          title="Ver Buffet"
        >
          <Utensils size={15} color="#f59e0b" />
          <span>BUFFET</span>
          <span className="quick-nav-badge">{data.buffet?.length || 0}</span>
        </button>

        <button
          type="button"
          className="quick-nav-item"
          onClick={() => {
            setCatalogSubTab('actividades');
            navigate('/admin/inventario');
          }}
          title="Ver Cronograma de Actividades"
        >
          <CalendarDays size={15} color="#8b5cf6" />
          <span>ACTIVIDADES</span>
          <span className="quick-nav-badge">Eventos</span>
        </button>

        <button
          type="button"
          className="quick-nav-item"
          onClick={() => navigate('/admin/staff')}
          title="Administrar Staff"
        >
          <IdCard size={15} color="#10b981" />
          <span>STAFF</span>
          <span className="quick-nav-badge">Equipo</span>
        </button>
      </div>

      {/* 4. Alerta Persistente si hubo Bloqueo de Eliminación */}
      {alertMessage && (
        <div className="category-view-alert-banner" role="alert">
          <div className="alert-content-wrap">
            <ShieldAlert size={20} className="alert-icon" />
            <span className="alert-text">{alertMessage}</span>
          </div>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setAlertMessage(null)}
            aria-label="Cerrar alerta"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 5. ZONA PRINCIPAL DE JUEGOS Y CATEGORÍAS */}
      <section className="admin-games-zone">
        {/* Banner de Cabecera con Botones de Acción */}
        <div className="admin-games-zone-banner">
          <div className="admin-games-banner-left">
            <div className="admin-games-banner-icon">
              🎲
            </div>
            <div className="admin-games-banner-texts">
              <h3>ZONA JUEGOS & CATEGORÍAS</h3>
              <p>
                Juegos de mesa y cartas organizados en sus <strong>cajitas de categorías</strong>. Modificá, creá y gestioná en tiempo real.
              </p>
            </div>
          </div>

          <div className="admin-games-banner-actions">
            <button
              type="button"
              className="btn-new-category-cta"
              onClick={handleOpenCreateCategory}
            >
              <Plus size={18} strokeWidth={3} />
              <span>NUEVA CATEGORÍA</span>
            </button>

            <button
              type="button"
              className="btn-new-game-cta"
              onClick={() => openCreateModal('boardgames')}
            >
              <Dices size={17} strokeWidth={2.5} />
              <span>NUEVO JUEGO</span>
            </button>
          </div>
        </div>

        {/* Controles: Búsqueda, Filtros y Estadísticas */}
        <div className="admin-games-controls-row">
          {/* Barra de Búsqueda */}
          <div className="search-bar-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar juego por título, código (#BG-001), categoría o descripción..."
              className="search-input"
              aria-label="Buscar juegos"
            />
            <button
              type="button"
              className="search-btn-blue"
              onClick={() => {}}
              aria-label="Buscar"
            >
              <Search size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Filtros Rápidos por Estado */}
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
              DISPONIBLES ({counts.disponibles})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterStatus === 'en_mesa' ? 'active' : ''}`}
              onClick={() => setFilterStatus('en_mesa')}
            >
              EN MESA ({counts.en_mesa})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterStatus === 'baja' ? 'active' : ''}`}
              onClick={() => setFilterStatus('baja')}
            >
              BAJA / TALLER ({counts.baja})
            </button>
          </div>

          {/* Estadísticas Compactas & Recarga */}
          <div className="admin-games-stats-strip">
            <div className="admin-stat-chip">
              <span>Categorías:</span>
              <strong>{categorias.length}</strong>
            </div>
            <div className="admin-stat-chip">
              <span>Juegos Filtrados:</span>
              <strong>{filteredGames.length}</strong>
            </div>
            <button
              type="button"
              className="refresh-mini-btn"
              onClick={() => {
                cargarCategorias();
                cargarJuegosBackend();
              }}
              title="Recargar datos"
              aria-label="Recargar"
            >
              <RefreshCw size={13} className={loadingCats || loadingJuegos ? 'spin' : ''} />
              <span>{loadingCats || loadingJuegos ? 'Cargando…' : 'Sincronizado'}</span>
            </button>
          </div>
        </div>

        {/* 6. LAS CAJITAS (CATEGORÍAS Y DENTRO SUS JUEGOS) */}
        <div className="admin-cajitas-stack">
          {loadingCats && categorias.length === 0 ? (
            <div className="category-loading-box">
              <RefreshCw size={26} className="spin" />
              <p>Cargando categorías y catálogo de juegos…</p>
            </div>
          ) : cajitas.length === 0 ? (
            <div className="empty-state-box">
              <p>No se encontraron categorías ni juegos coincidentes con los filtros.</p>
            </div>
          ) : (
            cajitas.map((cajita) => {
              const isCollapsed = Boolean(collapsedCajitas[cajita.id]);
              const esCategoriaReal = Boolean(cajita.rawCategory);
              const tieneJuegos = cajita.hasGamesOfficial || cajita.games.length > 0;

              return (
                <article
                  key={cajita.id}
                  className="admin-cajita-card"
                  data-category-id={cajita.id}
                >
                  {/* Cabecera de la Cajita */}
                  <header className="admin-cajita-header">
                    <div className="cajita-header-left">
                      <div className="cajita-icon-bubble">
                        <Tags size={18} strokeWidth={2.4} />
                      </div>
                      <div className="cajita-header-info">
                        <div className="cajita-title-line">
                          <h4 className="cajita-title">{cajita.nombre}</h4>
                          {esCategoriaReal && (
                            <span className="cajita-id-chip">
                              #CAT-{String(cajita.id).padStart(2, '0')}
                            </span>
                          )}
                          <span
                            className={`cajita-games-count-badge ${
                              tieneJuegos ? 'badge-has-games' : 'badge-empty'
                            }`}
                          >
                            <Dices size={13} />
                            <span>
                              {cajita.officialCount}{' '}
                              {cajita.officialCount === 1 ? 'juego' : 'juegos'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones de Categoría sobre la Cajita */}
                    <div className="cajita-header-actions">
                      {esCategoriaReal && (
                        <>
                          <button
                            type="button"
                            className="cajita-action-btn cajita-action-btn-edit"
                            onClick={() => handleOpenEditCategory(cajita.rawCategory)}
                            title={`Editar categoría "${cajita.nombre}"`}
                          >
                            <Pencil size={13} />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            className={`cajita-action-btn cajita-action-btn-delete ${
                              tieneJuegos ? 'btn-disabled-hint' : ''
                            }`}
                            onClick={() =>
                              handleOpenDeleteCategory(cajita.rawCategory, tieneJuegos)
                            }
                            title={
                              tieneJuegos
                                ? 'No se puede eliminar esta categoría porque hay juegos usándola'
                                : `Eliminar categoría "${cajita.nombre}"`
                            }
                          >
                            <Trash2 size={13} />
                            <span>Eliminar</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        className="cajita-collapse-btn"
                        onClick={() => toggleCollapse(cajita.id)}
                        title={isCollapsed ? 'Desplegar cajita' : 'Colapsar cajita'}
                        aria-label={isCollapsed ? 'Desplegar cajita' : 'Colapsar cajita'}
                      >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </header>

                  {/* Franja de Descripción */}
                  {cajita.descripcion && (
                    <div className="cajita-desc-strip">
                      <span>"{cajita.descripcion}"</span>
                    </div>
                  )}

                  {/* Cuerpo de la Cajita: Sus Juegos */}
                  {!isCollapsed && (
                    <div className="cajita-body">
                      {cajita.games.length === 0 ? (
                        <div className="cajita-empty-box">
                          <p>Esta categoría no tiene juegos registrados con los filtros actuales.</p>
                          <button
                            type="button"
                            className="btn-cajita-add-game"
                            onClick={() => openCreateModal('boardgames')}
                          >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>Agregar juego a esta categoría</span>
                          </button>
                        </div>
                      ) : (
                        <div className="cajita-games-grid">
                          {cajita.games.map((item) => (
                            <GameCard
                              key={item.id}
                              item={item}
                              entityType={item.entityType || 'boardgames'}
                              onOpenDetail={openDetailModal}
                              onOpenEdit={openEditModal}
                              onOpenConfirmBaja={openConfirmBajaModal}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* 7. Modales de Gestión de Categorías */}
      <CategoriaFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        initialCategory={editingCategory}
        existingCategories={categorias}
      />

      <ConfirmDeleteCategoryModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        categoria={deletingCategory}
        onConfirm={handleConfirmDeleteCategory}
      />
    </div>
  );
};
