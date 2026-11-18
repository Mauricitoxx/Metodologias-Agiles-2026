import { useState } from 'react';
import { ShieldCheck, Users, UserPlus, Search, RefreshCw } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { AdminUserCard } from '../components/cards/AdminUserCard';
import { StaffForm } from '../components/StaffForm';

export function AdminUsersView() {
  const { staff, loadingStaff, cargarStaff, currentUser, openConfirmBajaModal } = useAdmin();
  const [tab, setTab] = useState('new');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);

  const active = staff.filter((item) => item.status === 'activo');
  const search = query.toLowerCase().trim();
  const list = (tab === 'active' ? active : staff).filter((item) =>
    `${item.name} ${item.email}`.toLowerCase().includes(search)
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
          <ShieldCheck size={18} /> {tab === 'active' ? 'STAFF ACTIVO' : 'STAFF REGISTRADO'}
        </h3>
        <button
          type="button"
          className="item-code-chip staff-reload"
          onClick={cargarStaff}
          disabled={loadingStaff}
          title="Recargar staff"
        >
          <RefreshCw size={12} /> {active.length} ACTIVOS
        </button>
      </div>

      <div className="search-bar-container">
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar staff"
          placeholder="Buscar por nombre o correo…"
        />
        <span className="search-btn-blue">
          <Search size={16} />
        </span>
      </div>

      <div className="cards-stack">
        {loadingStaff && !staff.length ? (
          <div className="empty-state-box" role="status">Cargando staff…</div>
        ) : list.length ? (
          list.map((item) => (
            <AdminUserCard
              key={item.id}
              item={item}
              isCurrentLoggedUser={item.id === currentUser?.id}
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
        Cada miembro es una cuenta administrativa real: inicia sesión con su correo y la clave temporal que se le
        entregue. Al darlo de baja pierde el acceso de inmediato.
      </p>
    </div>
  );
}
