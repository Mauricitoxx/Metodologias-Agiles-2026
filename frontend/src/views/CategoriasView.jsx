import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, Tags, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { categoriaService } from '../services/categoriaService';
import { CategoryCard } from '../components/cards/CategoryCard';
import { CategoriaFormModal } from '../components/modals/CategoriaFormModal';
import { ConfirmDeleteCategoryModal } from '../components/modals/ConfirmDeleteCategoryModal';

export const CategoriasView = () => {
  const { showToast } = useAdmin();

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('todas'); // 'todas' | 'con_juegos' | 'libres'

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Persistent / prominent alert state for blocked actions
  const [alertMessage, setAlertMessage] = useState(null);

  // Cargar categorías desde el Backend
  const cargarCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoriaService.listar();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || 'Error al cargar las categorías', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  // Manejo de Alta y Modificación
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
    setAlertMessage(null);
  };

  const handleOpenEdit = (categoria) => {
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
    return true;
  };

  // Manejo de Eliminación
  const handleOpenDelete = (categoria) => {
    const juegosCount = categoria.juegos_count || (categoria.juegos ? categoria.juegos.length : 0);
    if (juegosCount > 0) {
      // Bloqueo y alerta requerida por criterio de aceptación:
      // "Dado que una categoría este asignada a varios juegos, cuando el administrador intente eliminarla,
      // entonces el sistema bloquea la acción y muestra una alerta: 'No se puede eliminar esta categoría porque hay juegos usándola'."
      const msg = 'No se puede eliminar esta categoría porque hay juegos usándola';
      setAlertMessage(msg);
      showToast(msg, 'error');
    } else {
      setAlertMessage(null);
    }
    setDeletingCategory(categoria);
  };

  const handleConfirmDelete = async (categoria) => {
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

  // Filtrado y Búsqueda
  const filteredCategorias = useMemo(() => {
    return categorias.filter((cat) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        cat.nombre.toLowerCase().includes(query) ||
        (cat.descripcion && cat.descripcion.toLowerCase().includes(query));

      if (!matchesQuery) return false;

      const juegosCount = cat.juegos_count || (cat.juegos ? cat.juegos.length : 0);
      if (filterType === 'con_juegos') return juegosCount > 0;
      if (filterType === 'libres') return juegosCount === 0;

      return true;
    });
  }, [categorias, searchQuery, filterType]);

  const counts = useMemo(() => {
    const conJuegos = categorias.filter(
      (c) => (c.juegos_count || (c.juegos ? c.juegos.length : 0)) > 0
    ).length;
    return {
      total: categorias.length,
      conJuegos,
      libres: categorias.length - conJuegos,
    };
  }, [categorias]);

  return (
    <div className="view-content-wrapper categorias-view">
      {/* 1. Alerta persistente si hubo bloqueo */}
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

      {/* 2. Banner de Cabecera */}
      <section className="retro-panel staff-banner categorias-banner">
        <div className="admin-hub-icon-square icon-categorias">
          <Tags size={26} strokeWidth={2.3} />
        </div>
        <div>
          <h2>GESTIÓN DE CATEGORÍAS</h2>
          <p>Clasificá y organizá los juegos de mesa de La Frikioteca con nombres y descripciones claras.</p>
        </div>
      </section>

      {/* 3. Botón Principal de Alta */}
      <button
        type="button"
        className="primary-cta-yellow-btn"
        onClick={handleOpenCreate}
      >
        <span className="cta-icon-circle">
          <Plus size={18} strokeWidth={3} />
        </span>
        NUEVA CATEGORÍA
      </button>

      {/* 4. Barra de Búsqueda */}
      <div className="search-bar-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o descripción de categoría..."
          className="search-input"
          aria-label="Buscar categoría"
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

      {/* 5. Filtros Rápidos */}
      <div className="filter-pills-row">
        <button
          type="button"
          className={`filter-pill ${filterType === 'todas' ? 'active' : ''}`}
          onClick={() => setFilterType('todas')}
        >
          TODAS ({counts.total})
        </button>
        <button
          type="button"
          className={`filter-pill ${filterType === 'con_juegos' ? 'active' : ''}`}
          onClick={() => setFilterType('con_juegos')}
        >
          CON JUEGOS ({counts.conJuegos})
        </button>
        <button
          type="button"
          className={`filter-pill ${filterType === 'libres' ? 'active' : ''}`}
          onClick={() => setFilterType('libres')}
        >
          SIN JUEGOS / LIBRES ({counts.libres})
        </button>
      </div>

      {/* 6. Encabezado de Listado */}
      <div className="catalog-header-bar">
        <h3 className="catalog-active-title">
          <Tags size={18} /> CATEGORÍAS DISPONIBLES
        </h3>
        <button
          type="button"
          className="refresh-mini-btn"
          onClick={cargarCategorias}
          title="Recargar categorías"
          aria-label="Recargar categorías"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Cargando…' : `${counts.total} TOTAL`}</span>
        </button>
      </div>

      {/* 7. Listado de Cards */}
      <div className="cards-stack">
        {loading ? (
          <div className="category-loading-box">
            <RefreshCw size={24} className="spin" />
            <p>Cargando categorías desde la base de datos…</p>
          </div>
        ) : filteredCategorias.length === 0 ? (
          <div className="empty-state-box">
            <p>
              {searchQuery
                ? `No se encontraron categorías con "${searchQuery}".`
                : 'Aún no hay categorías registradas.'}
            </p>
          </div>
        ) : (
          filteredCategorias.map((categoria) => (
            <CategoryCard
              key={categoria.id}
              categoria={categoria}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))
        )}
      </div>

      {/* 8. Modales */}
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
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
