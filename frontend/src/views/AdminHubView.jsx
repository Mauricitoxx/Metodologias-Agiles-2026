import React from 'react';
import { Shield, Package, IdCard, ArrowRight, ShieldCheck, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminHubView = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-hub-container">
      {/* 1. Badge Modo Admin Conectado */}
      <div className="admin-connected-badge">
        <Shield size={14} strokeWidth={2.5} />
        <span>MODO ADMIN CONECTADO</span>
      </div>

      {/* 2. Título & Subtítulo */}
      <div className="admin-hub-hero">
        <h2 className="admin-hub-title">ADMIN CENTRAL</h2>
        <p className="admin-hub-subtitle">
          Tu base de operaciones en La Frikioteca.<br />
          ¿Qué vas a gestionar hoy?
        </p>
      </div>

      {/* 3. Tarjetas Principales */}
      <div className="admin-hub-cards-stack">
        {/* Tarjeta 1: INVENTARIO */}
        <div className="admin-hub-card">
          <div className="admin-hub-card-top">
            <div className="admin-hub-icon-square icon-inventario">
              <Package size={26} strokeWidth={2.2} />
            </div>
            <div className="admin-hub-card-info">
              <h3 className="admin-hub-card-title">INVENTARIO</h3>
              <p className="admin-hub-card-desc">
                Organizá el catálogo y mantené cada producto al día.
              </p>
            </div>
          </div>

          <div className="admin-hub-card-tags tags-inventario">
            CATÁLOGO • STOCK • DISPONIBILIDAD
          </div>

          <button
            className="admin-hub-action-btn btn-inventario"
            onClick={() => navigate('/admin/inventario')}
          >
            <span>Gestionar Inventario</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tarjeta 2: STAFF */}
        <div className="admin-hub-card">
          <div className="admin-hub-card-top">
            <div className="admin-hub-icon-square icon-staff">
              <IdCard size={26} strokeWidth={2.2} />
            </div>
            <div className="admin-hub-card-info">
              <h3 className="admin-hub-card-title">STAFF</h3>
              <p className="admin-hub-card-desc">
                Administrá tu equipo, sus roles y credenciales de acceso.
              </p>
            </div>
          </div>

          <div className="admin-hub-card-tags tags-staff">
            EQUIPO • ROLES • PERMISOS
          </div>

          <button
            className="admin-hub-action-btn btn-staff"
            onClick={() => navigate('/admin/staff')}
          >
            <span>Gestionar staff</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="admin-hub-card">
          <div className="admin-hub-card-top">
            <div className="admin-hub-icon-square icon-actividades">
              <CalendarDays size={26} strokeWidth={2.2} />
            </div>
            <div className="admin-hub-card-info">
              <h3 className="admin-hub-card-title">ACTIVIDADES</h3>
              <p className="admin-hub-card-desc">
                Cargá talleres, torneos y eventos, y mantené el cronograma al día.
              </p>
            </div>
          </div>

          <div className="admin-hub-card-tags tags-actividades">
            TALLERES • TORNEOS • EVENTOS
          </div>

          <button
            className="admin-hub-action-btn btn-actividades"
            onClick={() => navigate('/admin/actividades')}
          >
            <span>Gestionar actividades</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 4. Caja Informativa Inferior */}
      <div className="admin-hub-notice-box">
        <ShieldCheck size={20} className="notice-icon" />
        <p className="notice-text">
          Área exclusiva para administradores.
          <br />
          Tus permisos se aplican en todas las gestiones.
        </p>
      </div>
    </div>
  );
};
