import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { activityService } from '../services/activityService';
import { CatalogIcon } from '../components/catalog/CatalogIcon';
import { PublicEventCard } from '../components/catalog/PublicEventCard';
import { filterSchedule, groupScheduleByDay, scheduleTypes } from '../utils/publicSchedule';

export function PublicEventsView() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  const search = params.get('buscar') || '';
  const tipoId = params.get('tipo') || '';

  // Se trae el cronograma completo una vez: filtrar en el cliente evita un pedido por tecla.
  useEffect(() => {
    let cancelled = false;
    activityService.listSchedule().then((activities) => { if (!cancelled) setResult({ retry, activities }); })
      .catch((error) => { if (!cancelled) setResult({ retry, error: error.message }); });
    return () => { cancelled = true; };
  }, [retry]);

  const current = result?.retry === retry ? result : null;
  const activities = useMemo(() => current?.activities || [], [current]);
  const types = useMemo(() => scheduleTypes(activities), [activities]);
  const days = useMemo(() => groupScheduleByDay(filterSchedule(activities, { search, tipoId })), [activities, search, tipoId]);
  const count = days.reduce((total, day) => total + day.activities.length, 0);
  const hasFilters = Boolean(search || tipoId);
  const returnTo = `${location.pathname}${location.search}`;

  function updateParam(key, value) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });
  }

  return <>
    <div className="public-events-intro">
      <h1>Cronograma de Eventos</h1>
      <p>Torneos, talleres y juntadas que se vienen en La Frikioteca.</p>
    </div>
    <form className="public-catalog-search" role="search" onSubmit={(event) => event.preventDefault()}>
      <div><CatalogIcon name="7c478" /><input type="search" aria-label="Buscar eventos por nombre" placeholder="Buscar eventos por nombre..." value={search} onChange={(event) => updateParam('buscar', event.target.value)} /></div>
      <button className="public-catalog-primary" type="submit">Buscar</button>
    </form>
    {types.length > 0 && <div className="public-catalog-sections public-events-types" role="group" aria-label="Filtrar por tipo de evento">
      <button type="button" className={!tipoId ? 'active' : ''} aria-pressed={!tipoId} onClick={() => updateParam('tipo', '')}>✨ Todos</button>
      {types.map((type) => {
        const active = String(type.id) === tipoId;
        return <button key={type.id} type="button" className={active ? 'active' : ''} aria-pressed={active} onClick={() => updateParam('tipo', String(type.id))}>{type.nombre}</button>;
      })}
    </div>}
    <div className="public-catalog-counter">
      <p role="status" aria-live="polite"><span className="public-catalog-counter-title">Próximos eventos</span>
        <span className="public-catalog-counter-summary">{!current ? 'Cargando cronograma…' : current.error ? 'Cronograma sin conexión' : <><strong>{count}</strong>{' '}{count === 1 ? 'evento' : 'eventos'} en agenda</>}</span>
      </p>
    </div>
    {!current ? <p className="public-catalog-message" role="status">Estamos armando el cronograma…</p>
      : current.error ? <div className="public-catalog-message" role="alert"><h2>No pudimos abrir el cronograma</h2><p>{current.error}</p><button className="public-catalog-primary" onClick={() => setRetry((value) => value + 1)}>Reintentar</button></div>
        : days.length ? days.map((day) => <section key={day.key} className="public-events-day" aria-labelledby={`dia-${day.key}`}>
          <h2 id={`dia-${day.key}`}>{day.label}</h2>
          <div className="public-events-list">{day.activities.map((activity) => <PublicEventCard key={activity.id} activity={activity} returnTo={returnTo} />)}</div>
        </section>)
          : <div className="public-catalog-message"><h2>{hasFilters ? 'No encontramos eventos' : 'Pronto habrá nuevos eventos'}</h2><p>{hasFilters ? 'Probá con otro nombre o elegí un tipo diferente.' : 'No hay eventos programados en este momento. Volvé a consultar más tarde.'}</p>{hasFilters && <button className="public-catalog-primary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Limpiar filtros</button>}</div>}
  </>;
}
