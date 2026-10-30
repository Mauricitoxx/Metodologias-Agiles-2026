import { Link, Outlet } from 'react-router-dom';
import { CatalogIcon } from '../components/catalog/CatalogIcon';
import '../styles/public-catalog.css';

export function PublicCatalogLayout() {
  return (
    <div className="app-container public-catalog">
      <a className="public-skip-link" href="#public-catalog-content">Ir al contenido</a>
      <header className="public-catalog-header">
        <Link className="public-catalog-brand" to="/catalogo" aria-label="La Frikioteca, catálogo">
          <img src="/login/e7f2c.png" width="28" height="28" alt="" />
          <div><p>LA FRIKIOTECA</p><span>COMIC · BUFFET · GAMES</span></div>
        </Link>
      </header>
      <main id="public-catalog-content" className="public-catalog-main">
        <Outlet />
      </main>
      <nav className="public-catalog-bottom" aria-label="Navegación principal">
        <div>
          <Link to="/catalogo" aria-current="page"><CatalogIcon name="2c137" /><span>Catálogo</span></Link>
          <button type="button" disabled title="Próximamente"><CatalogIcon name="7c414" /><span>Buffet</span><small>Próximamente</small></button>
          <button type="button" disabled title="Próximamente"><CatalogIcon name="bb8d1" /><span>Eventos</span><small>Próximamente</small></button>
        </div>
      </nav>
    </div>
  );
}
