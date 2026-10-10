import { useState } from 'react';
import { ShieldCheck, Users, UserPlus, Search } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { AdminUserCard } from '../components/cards/AdminUserCard';
import { StaffForm } from '../components/StaffForm';

export function AdminUsersView() {
  const { data, currentUser, openDetailModal, openConfirmBajaModal } = useAdmin();
  const [tab, setTab] = useState('new');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);

  const adminsList = data.admins || [];
  const active = adminsList.filter((item) => item.status === 'activo' || item.activo === true);
  const list = (tab === 'active' ? active : adminsList).filter((item) =>
    `${item.name || item.nombre || ''} ${item.email || ''} ${item.role || ''}`
      .toLowerCase()
      .includes(query.toLowerCase().trim())
  );

  function edit(_type, item) {
    setEditing(item);
    setTab('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="view-content-wrapper staff-view">
      <section className="retro-panel staff-banner">
        <div className="admin-hub-icon-square icon-inventario">
          <Users size={24} />
        </div>
        <div>
          <h2>GESTIÓN DE STAFF</h2>
          <p>Credenciales de acceso y miembros administradores del sistema.</p>
        </div>
      </section>

      <div className="staff-tabs">
        <button
          className={tab === 'new' ? 'selected' : ''}
          onClick={() => {
            setEditing(null);
            setTab('new');
          }}
        >
          <UserPlus size={15} /> {editing ? 'EDITAR MIEMBRO' : 'ALTA / NUEVO'}
        </button>
        <button
          className={tab === 'active' ? 'selected' : ''}
          onClick={() => setTab('active')}
        >
          <Users size={15} /> ACTIVOS ({active.length})
        </button>
      </div>

      {tab === 'new' && (
        <StaffForm
          key={editing?.id || 'new'}
          initialItem={editing}
          onDone={() => {
            setEditing(null);
            setTab('active');
          }}
        />
      )}

      <div className="catalog-header-bar">
        <h3 className="catalog-active-title">
          <ShieldCheck size={18} /> STAFF REGISTRADO
        </h3>
        <span className="item-code-chip">{active.length} ACTIVOS</span>
      </div>

      <div className="search-bar-container">
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar staff"
          placeholder="Buscar por nombre, correo o rol…"
        />
        <span className="search-btn-blue">
          <Search size={16} />
        </span>
      </div>

      <div className="cards-stack">
        {list.length ? (
          list.map((item) => (
            <AdminUserCard
              key={item.id}
              item={item}
              isCurrentLoggedUser={item.id === currentUser?.id || item.email === currentUser?.email}
              onOpenDetail={openDetailModal}
              onOpenEdit={edit}
              onOpenConfirmBaja={openConfirmBajaModal}
            />
          ))
        ) : (
          <div className="empty-state-box">
            No se encontraron miembros del staff.
          </div>
        )}
      </div>

      <p className="staff-footnote">
        Las cuentas y contraseñas temporales se registran en tiempo real en la base de datos central.
      </p>
    </div>
  );
}
