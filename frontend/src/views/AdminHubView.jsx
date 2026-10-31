import React from 'react';
import {
  Shield,
  BookOpen,
  Utensils,
  CalendarDays,
  IdCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/useAdmin';
import { JuegosView } from './JuegosView';

export const AdminHubView = () => {
  const navigate = useNavigate();
  const { data, setCatalogSubTab } = useAdmin();

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

      {/* 4. Zona de Juegos y Categorías */}
      <JuegosView />
    </div>
  );
};
