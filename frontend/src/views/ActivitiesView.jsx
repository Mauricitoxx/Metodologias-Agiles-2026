import { useEffect, useState } from 'react';
import { Search, Plus, CalendarDays, ArrowDownWideNarrow, ArrowUpNarrowWide, RefreshCw } from 'lucide-react';
import { useAdmin } from '../context/useAdmin';
import { ActivityCard } from '../components/cards/ActivityCard';
import { activityService, activityTypeService } from '../services/activityService';
import { ACTIVITY_STATUSES } from '../utils/activity';

const SEARCH_DEBOUNCE_MS = 300;

export const ActivitiesView = () => {
  const { showToast } = useAdmin();

  const [types, setTypes] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  // Last response and the request it belongs to: while they differ, a request is in flight
  const [result, setResult] = useState({ key: null, activities: [], error: '' });

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [tipoId, setTipoId] = useState('');
  const [estado, setEstado] = useState('');
  const [order, setOrder] = useState('asc');

  // Wired to the form (step 8) and the confirmation modals (step 9)
  const [, setFormState] = useState(null);
  const [, setPendingAction] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    activityTypeService
      .list()
      .then(setTypes)
      .catch((error) => showToast(error.message, 'error'));
    // Load the types only once (showToast is recreated on every render of the provider)
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const requestKey = JSON.stringify([search, tipoId, estado, order, reloadKey]);

  useEffect(() => {
    let ignore = false;
    activityService
      .list({ search, tipo_id: tipoId, estado, order })
      .then((data) => {
        if (!ignore) setResult({ key: requestKey, activities: data, error: '' });
      })
      .catch((error) => {
        if (!ignore) setResult((prev) => ({ ...prev, key: requestKey, error: error.message }));
      });
    return () => {
      ignore = true;
    };
  }, [requestKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const { activities, error: loadError } = result;
  const loading = result.key !== requestKey;
  const reload = () => setReloadKey((key) => key + 1);
  const hasFilters = Boolean(search || tipoId || estado);

  return (
    <div className="view-content-wrapper">
      <div className="module-banner-box">
        <div className="module-banner-icon">
          <CalendarDays size={24} />
        </div>
        <div>
          <h4 className="module-banner-title">Gestor de Actividades</h4>
          <p className="module-banner-desc">
            Talleres, torneos, ferias y eventos del cronograma de La Frikioteca.
          </p>
        </div>
      </div>

      <button className="primary-cta-yellow-btn" onClick={() => setFormState({ mode: 'create' })}>
        <span className="cta-icon-circle">
          <Plus size={18} strokeWidth={3} />
        </span>
        NUEVA ACTIVIDAD
      </button>

      <div className="search-bar-container">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar actividad por nombre..."
          className="search-input"
          aria-label="Buscar actividad por nombre"
        />
        <span className="search-btn-blue" aria-hidden="true">
          <Search size={18} strokeWidth={2.5} />
        </span>
      </div>

      <div className="activity-filter-group">
        <span className="section-small-label">TIPO</span>
        <div className="filter-pills-row" role="group" aria-label="Filtrar por tipo">
          <button className={`filter-pill ${tipoId === '' ? 'active' : ''}`} onClick={() => setTipoId('')}>
            TODOS
          </button>
          {types.map((type) => (
            <button
              key={type.id}
              className={`filter-pill ${tipoId === type.id ? 'active' : ''}`}
              onClick={() => setTipoId(type.id)}
            >
              {type.nombre.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="activity-filter-group">
        <span className="section-small-label">ESTADO</span>
        <div className="filter-pills-row" role="group" aria-label="Filtrar por estado">
          <button className={`filter-pill ${estado === '' ? 'active' : ''}`} onClick={() => setEstado('')}>
            TODOS
          </button>
          {ACTIVITY_STATUSES.map((status) => (
            <button
              key={status.value}
              className={`filter-pill ${estado === status.value ? 'active' : ''}`}
              onClick={() => setEstado(status.value)}
            >
              {status.plural.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="catalog-header-bar">
        <h3 className="catalog-active-title">CRONOGRAMA</h3>
        <button
          className="activity-order-btn"
          onClick={() => setOrder((current) => (current === 'asc' ? 'desc' : 'asc'))}
          aria-label={`Ordenar por fecha ${order === 'asc' ? 'descendente' : 'ascendente'}`}
        >
          {order === 'asc' ? <ArrowUpNarrowWide size={14} /> : <ArrowDownWideNarrow size={14} />}
          Fecha {order === 'asc' ? 'más próxima' : 'más lejana'}
        </button>
      </div>

      <div className="cards-stack" aria-busy={loading}>
        {loadError ? (
          <div className="empty-state-box" role="alert">
            <p>{loadError}</p>
            <button className="text-link activity-retry" onClick={reload}>
              <RefreshCw size={12} /> Reintentar
            </button>
          </div>
        ) : loading && activities.length === 0 ? (
          <div className="empty-state-box">
            <p>Cargando actividades…</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="empty-state-box">
            <p>
              {hasFilters
                ? 'No hay actividades que coincidan con los filtros.'
                : 'Todavía no hay actividades registradas.'}
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={(item) => setFormState({ mode: 'edit', activity: item })}
              onPostpone={(item) => setPendingAction({ type: 'postpone', activity: item })}
              onCancel={(item) => setPendingAction({ type: 'cancel', activity: item })}
              onDelete={(item) => setPendingAction({ type: 'delete', activity: item })}
            />
          ))
        )}
      </div>
    </div>
  );
};
