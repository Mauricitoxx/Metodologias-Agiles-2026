import React, { useState, useEffect, useMemo } from 'react';
import { Search, Dices, Utensils, Trophy, Star, ArrowRight, X, Clock, Users, Shield, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { juegoService } from '../services/juegoService';
import { categoriaService } from '../services/categoriaService';

// Imágenes ilustrativas para juegos populares
const GAME_COVERS = {
  'catan: el juego': 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=500&q=80',
  'wingspan': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=500&q=80',
  'virus! 2 evolution': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=500&q=80',
  'carcassonne': 'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=500&q=80',
  'dixit': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=500&q=80',
};

export const ClientCatalogView = () => {
  const navigate = useNavigate();

  const [juegos, setJuegos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedJuego, setSelectedJuego] = useState(null);
  const [activeNav, setActiveNav] = useState('catalogo');

  // Cargar catálogo de juegos y categorías desde el backend
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        const [juegosData, categoriasData] = await Promise.all([
          juegoService.listar({ solo_activos: true }),
          categoriaService.listar(),
        ]);

        if (!cancelled) {
          setJuegos(Array.isArray(juegosData) ? juegosData : []);
          setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        }
      } catch (err) {
        console.error('Error al cargar datos públicos:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtrado de juegos según búsqueda y categoría seleccionada
  const filteredJuegos = useMemo(() => {
    return juegos.filter((juego) => {
      // 1. Filtro de búsqueda
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        juego.nombre.toLowerCase().includes(query) ||
        (juego.descripcion && juego.descripcion.toLowerCase().includes(query)) ||
        juego.categorias?.some((c) => c.nombre.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Filtro de categoría
      if (selectedCategoria === 'todos') return true;

      return juego.categorias?.some(
        (c) => c.nombre.toLowerCase() === selectedCategoria.toLowerCase()
      );
    });
  }, [juegos, searchQuery, selectedCategoria]);

  const getCoverImage = (juego) => {
    if (juego.video_url && juego.video_url.startsWith('http')) return juego.video_url;
    const key = juego.nombre?.toLowerCase();
    return GAME_COVERS[key] || 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=500&q=80';
  };

  return (
    <div className="client-app-container">
      {/* 1. Header Oficial de La Frikioteca */}
      <header className="client-header">
        <div className="client-brand-row">
          <div className="client-logo-icon">🎲</div>
          <div className="client-brand-text">
            <h1 className="client-brand-name">LA FRIKIOTECA</h1>
            <span className="client-brand-tagline">COMIC · BUFFET · GAMES</span>
          </div>
        </div>

        {/* Acceso a Admin */}
        <button
          type="button"
          className="client-admin-access-btn"
          onClick={() => navigate('/admin')}
          title="Acceso Administración"
          aria-label="Acceso Administración"
        >
          <Shield size={16} />
          <span>Admin</span>
        </button>
      </header>

      {/* 2. Barra de Búsqueda de Usuario */}
      <div className="client-search-section">
        <div className="client-search-wrapper">
          <Search size={18} className="client-search-icon" />
          <input
            type="text"
            className="client-search-input"
            placeholder="Buscar por título, autor o jugadores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" className="client-search-btn">
            Buscar
          </button>
        </div>
      </div>

      {/* 3. Píldoras de Categorías (Filtros Clasificatorios) */}
      <div className="client-category-pills-bar">
        <button
          type="button"
          className={`client-cat-pill ${selectedCategoria === 'todos' ? 'active' : ''}`}
          onClick={() => setSelectedCategoria('todos')}
        >
          <span>Todos</span>
          <span className="pill-count">{juegos.length}</span>
        </button>

        {categorias.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`client-cat-pill ${
              selectedCategoria === cat.nombre ? 'active' : ''
            }`}
            onClick={() => setSelectedCategoria(cat.nombre)}
          >
            <span>{cat.nombre}</span>
            {cat.juegos_count > 0 && (
              <span className="pill-count">{cat.juegos_count}</span>
            )}
          </button>
        ))}
      </div>

      {/* 4. Subheader: Conteo y Ordenación */}
      <div className="client-subheading-row">
        <div className="client-showing-title">
          <span className="showing-label">MOSTRANDO</span>
          <span className="showing-count">{filteredJuegos.length} TÍTULOS</span>
        </div>

        <div className="client-sort-pill">
          <SlidersHorizontal size={14} />
          <span>Popularidad</span>
        </div>
      </div>

      {/* 5. Catálogo en Grilla (2 Columnas - Idéntico a Mockup) */}
      <div className="client-catalog-grid">
        {loading ? (
          <div className="client-loading-state">
            <p>Cargando catálogo de juegos…</p>
          </div>
        ) : filteredJuegos.length === 0 ? (
          <div className="client-empty-state">
            <p>No se encontraron juegos en esta categoría.</p>
          </div>
        ) : (
          filteredJuegos.map((juego) => {
            const categoriaPrincipal =
              juego.categorias?.[0]?.nombre || 'JUEGO DE MESA';

            return (
              <article key={juego.id} className="client-game-card">
                {/* Imagen y Badges */}
                <div className="client-card-image-wrap">
                  <div className="client-card-status-badge">
                    <span>⚡ ¡DISPONIBLE!</span>
                  </div>
                  <div className="client-card-rating">
                    <Star size={11} fill="#FFCB05" color="#FFCB05" />
                    <span>4.9</span>
                  </div>
                  <img
                    src={getCoverImage(juego)}
                    alt={juego.nombre}
                    className="client-card-img"
                    loading="lazy"
                  />
                </div>

                {/* Contenido de la Ficha */}
                <div className="client-card-body">
                  <span className="client-card-category">
                    {categoriaPrincipal.toUpperCase()}
                  </span>

                  <h3 className="client-card-title">{juego.nombre}</h3>

                  <div className="client-card-meta">
                    <span className="meta-item">
                      <Users size={12} />
                      {juego.jugadores_min}-{juego.jugadores_max} jug.
                    </span>
                    <span className="meta-dot">•</span>
                    <span className="meta-item">
                      <Clock size={12} />
                      {juego.duracion_min}m
                    </span>
                  </div>

                  {/* Botón Ver Detalles */}
                  <button
                    type="button"
                    className="client-btn-details"
                    onClick={() => setSelectedJuego(juego)}
                  >
                    <span>Ver Detalles</span>
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* 6. Barra de Navegación Inferior Móvil (Catálogo / Buffet / Eventos) */}
      <nav className="client-bottom-nav">
        <button
          type="button"
          className={`client-nav-btn ${activeNav === 'catalogo' ? 'active' : ''}`}
          onClick={() => setActiveNav('catalogo')}
        >
          <Dices size={20} strokeWidth={2.5} />
          <span>Catálogo</span>
        </button>

        <button
          type="button"
          className={`client-nav-btn ${activeNav === 'buffet' ? 'active' : ''}`}
          onClick={() => setActiveNav('buffet')}
        >
          <Utensils size={20} strokeWidth={2.2} />
          <span>Buffet</span>
        </button>

        <button
          type="button"
          className={`client-nav-btn ${activeNav === 'eventos' ? 'active' : ''}`}
          onClick={() => setActiveNav('eventos')}
        >
          <Trophy size={20} strokeWidth={2.2} />
          <span>Eventos</span>
        </button>
      </nav>

      {/* 7. Modal de Detalle de Juego para el Cliente */}
      {selectedJuego && (
        <div className="modal-backdrop" onClick={() => setSelectedJuego(null)}>
          <div
            className="modal-window modal-window-md client-detail-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="client-detail-header-tags">
                {selectedJuego.categorias?.map((c) => (
                  <span key={c.id} className="client-category-tag-badge">
                    {c.nombre}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedJuego(null)}
                aria-label="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body client-detail-body">
              <img
                src={getCoverImage(selectedJuego)}
                alt={selectedJuego.nombre}
                className="client-detail-image"
              />

              <h2 className="client-detail-title">{selectedJuego.nombre}</h2>

              <div className="client-detail-stats-row">
                <div className="stat-box">
                  <Users size={16} />
                  <span>{selectedJuego.jugadores_min} - {selectedJuego.jugadores_max} Jugadores</span>
                </div>
                <div className="stat-box">
                  <Clock size={16} />
                  <span>{selectedJuego.duracion_min} Minutos</span>
                </div>
                <div className="stat-box">
                  <span>+{selectedJuego.edad_recomendada} Años</span>
                </div>
              </div>

              <div className="client-detail-desc">
                <h4>Acerca de este juego</h4>
                <p>{selectedJuego.descripcion || 'Sin descripción disponible.'}</p>
              </div>

              {selectedJuego.categorias?.length > 0 && (
                <div className="client-detail-categories-info">
                  <h4>Clasificación & Categorías</h4>
                  <div className="category-chips-wrap">
                    {selectedJuego.categorias.map((c) => (
                      <div key={c.id} className="client-category-chip-card">
                        <strong>{c.nombre}</strong>
                        {c.descripcion && <p>{c.descripcion}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setSelectedJuego(null)}
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
