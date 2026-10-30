import { Link, Route, Routes } from 'react-router-dom';
import { catalogModules } from './modules';
import { PublicCatalogLayout } from '../views/PublicCatalogLayout';
import { PublicCatalogBrowseView } from '../views/PublicCatalogBrowseView';
import { PublicMangasSlot } from '../views/PublicMangasSlot';

function CatalogNotFound() {
  return <section className="public-catalog-message"><h1>No encontramos esta página</h1><Link className="public-catalog-primary" to="/catalogo">Volver al catálogo</Link></section>;
}

function ModuleRoutes({ module }) {
  const DetailView = module.DetailView;
  const BrowseView = module.BrowseView || PublicCatalogBrowseView;
  return <Routes>
    <Route index element={<BrowseView moduleId={module.id} />} />
    {DetailView && <Route path=":id" element={<DetailView />} />}
    <Route path="*" element={<CatalogNotFound />} />
  </Routes>;
}

export function PublicCatalogRoutes() {
  return <Routes><Route element={<PublicCatalogLayout />}>
    <Route index element={<PublicCatalogBrowseView />} />
    {catalogModules.map((module) => <Route key={module.id} path={`${module.slug}/*`} element={module.enabled ? <ModuleRoutes module={module} /> : <PublicMangasSlot />} />)}
    <Route path="*" element={<CatalogNotFound />} />
  </Route></Routes>;
}
