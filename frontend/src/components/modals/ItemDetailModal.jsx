import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, MapPin, Award, FileText, Video, Play, ExternalLink, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge, CategoryTag } from '../common/Badge';
import { getYouTubeEmbedUrl } from '../../utils/validation';
import { reglaJuegoService } from '../../services/reglaJuegoService';

export const ItemDetailModal = ({ isOpen, onClose, item, entityType, onEdit, onToggleBaja }) => {
  const [reglas, setReglas] = useState([]);
  const [loadingReglas, setLoadingReglas] = useState(false);
  const [openReglaId, setOpenReglaId] = useState(null);

  const isBoardgame = entityType === 'boardgames' || entityType === 'juegos';
  const video = item?.videoUrl || item?.video_url;

  // Cargar las reglas asociadas cuando se visualiza un juego
  useEffect(() => {
    let cancelled = false;

    if (isOpen && item?.id && isBoardgame) {
      setLoadingReglas(true);
      reglaJuegoService
        .listarPorJuego(item.id)
        .then((data) => {
          if (!cancelled) {
            // Ordenar secuencialmente por la propiedad `orden`
            const ordenadas = Array.isArray(data)
              ? [...data].sort((a, b) => a.orden - b.orden)
              : [];
            setReglas(ordenadas);
          }
        })
        .catch(() => {
          if (!cancelled) setReglas([]);
        })
        .finally(() => {
          if (!cancelled) setLoadingReglas(false);
        });
    } else {
      setReglas([]);
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, item, isBoardgame]);

  if (!isOpen || !item) return null;

  const toggleAccordion = (id) => {
    setOpenReglaId(openReglaId === id ? null : id);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-code-badge">{item.code}</span>
            <h3 className="modal-title">{item.title || item.nombre || item.name}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {(item.image || item.imagen) && (
            <div className="modal-image-wrapper">
              <img src={item.image || item.imagen} alt={item.title || item.nombre || item.name} className="modal-image" />
              {item.shelf && <span className="modal-image-tag">{item.shelf}</span>}
            </div>
          )}

          <div className="modal-status-row">
            <StatusBadge status={item.status || (item.activo === false ? 'baja' : 'disponible')} tableNumber={item.tableNumber} />
            {(item.category || item.categorias) && (
              <CategoryTag>
                {item.category || (Array.isArray(item.categorias) ? item.categorias.map(c => c.nombre).join(', ') : '')}
              </CategoryTag>
            )}
          </div>

          <div className="modal-details-grid">
            {(item.minPlayers || item.jugadores_min) && (
              <div className="detail-item">
                <Users size={16} />
                <span>Jugadores: <strong>{item.minPlayers || item.jugadores_min}-{item.maxPlayers || item.jugadores_max}</strong></span>
              </div>
            )}
            {(item.duration || item.duracion_min) && (
              <div className="detail-item">
                <Clock size={16} />
                <span>Tiempo: <strong>{item.duration || `${item.duracion_min} min`}</strong></span>
              </div>
            )}
            {item.shelf && (
              <div className="detail-item">
                <MapPin size={16} />
                <span>Ubicación: <strong>{item.shelf}</strong></span>
              </div>
            )}
            {item.loansCount !== undefined && (
              <div className="detail-item">
                <Award size={16} />
                <span>Préstamos: <strong>{item.loansCount}</strong></span>
              </div>
            )}
            {item.price && (
              <div className="detail-item">
                <span>Precio: <strong>${item.price.toLocaleString()}</strong></span>
              </div>
            )}
            {item.date && (
              <div className="detail-item">
                <Calendar size={16} />
                <span>Fecha: <strong>{item.date} {item.time}</strong></span>
              </div>
            )}
            {item.role && (
              <div className="detail-item">
                <span>Rol: <strong>{item.role}</strong></span>
              </div>
            )}
            {item.email && (
              <div className="detail-item">
                <span>Email: <strong>{item.email}</strong></span>
              </div>
            )}
          </div>

          {item.notes && (
            <div className="modal-warning-box">
              <strong>Nota interna:</strong> {item.notes}
            </div>
          )}

          {/* SECCIÓN DE VIDEO TUTORIAL */}
          {video && (
            <div className="modal-video-section">
              <div className="section-label">
                <Video size={14} /> Video Tutorial Explicativo
              </div>
              {getYouTubeEmbedUrl(video) && (
                <div className="modal-video-embed-container">
                  <iframe
                    src={getYouTubeEmbedUrl(video)}
                    title={`Video explicativo de ${item.title || item.nombre}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="modal-video-iframe"
                  />
                </div>
              )}
              <a
                href={video}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-video-link-btn"
              >
                <Play size={14} fill="currentColor" /> Abrir Video Tutorial <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* SECCIÓN DE REGLAS DEL JUEGO (HU-07) */}
          {isBoardgame && (
            <div className="modal-rules-section">
              <div className="section-label">
                <BookOpen size={14} /> Reglas del Juego ({reglas.length})
              </div>

              {loadingReglas ? (
                <p className="small-text text-muted">Cargando reglamento...</p>
              ) : reglas.length === 0 ? (
                <p className="small-text text-muted">Este juego aún no posee reglas registradas.</p>
              ) : (
                <div className="rules-accordion-list">
                  {reglas.map((regla) => {
                    const isOpenRegla = openReglaId === regla.id;
                    return (
                      <div key={regla.id} className="rule-accordion-item">
                        <button
                          type="button"
                          className="rule-accordion-header"
                          onClick={() => toggleAccordion(regla.id)}
                        >
                          <span className="rule-order-badge">#{regla.orden}</span>
                          <span className="rule-title-text">{regla.titulo}</span>
                          {isOpenRegla ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {isOpenRegla && (
                          <div className="rule-accordion-content">
                            <p>{regla.contenido}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {(item.description || item.descripcion) && (
            <div className="modal-description-box">
              <div className="section-label">
                <FileText size={14} /> Resumen y Descripción
              </div>
              <p>{item.description || item.descripcion}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="action-btn edit-action-btn"
            onClick={() => {
              onClose();
              onEdit(entityType, item);
            }}
          >
            ✏️ Editar Datos
          </button>
          <button
            className={`action-btn ${item.status === 'baja' || item.activo === false ? 'restore-action-btn' : 'baja-action-btn'}`}
            onClick={() => {
              onClose();
              onToggleBaja(entityType, item);
            }}
          >
            {item.status === 'baja' || item.activo === false ? '🔄 Reactivar' : '🗑️ Dar de Baja'}
          </button>
        </div>
      </div>
    </div>
  );
};