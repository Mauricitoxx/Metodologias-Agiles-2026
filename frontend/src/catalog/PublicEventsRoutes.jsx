import { Link, Route, Routes } from 'react-router-dom';
import { PublicCatalogLayout } from '../views/PublicCatalogLayout';
import { PublicEventsView } from '../views/PublicEventsView';
import { PublicEventDetailView } from '../views/PublicEventDetailView';
import '../styles/public-events.css';

function EventsNotFound() {
  return <section className="public-catalog-message"><h1>No encontramos esta página</h1><Link className="public-catalog-primary" to="/eventos">Volver al cronograma</Link></section>;
}

// Cronograma público de actividades: comparte cabecera y barra inferior con el catálogo.
export function PublicEventsRoutes() {
  return <Routes><Route element={<PublicCatalogLayout className="public-events" />}>
    <Route index element={<PublicEventsView />} />
    <Route path=":id" element={<PublicEventDetailView />} />
    <Route path="*" element={<EventsNotFound />} />
  </Route></Routes>;
}
