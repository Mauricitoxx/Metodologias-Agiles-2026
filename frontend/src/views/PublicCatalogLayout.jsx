import { Link, NavLink, Outlet } from 'react-router-dom';
import { CatalogIcon } from '../components/catalog/CatalogIcon';
import '../styles/public-catalog.css';

export function PublicCatalogLayout({ className = '' }) {
  return (
    <div className={`app-container public-catalog ${className}`}>
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
          <NavLink to="/catalogo"><CatalogIcon name="2c137" /><span>Catálogo</span></NavLink>
          <button type="button" disabled title="Próximamente"><CatalogIcon name="7c414" /><span>Buffet</span><small>Próximamente</small></button>
          <NavLink to="/eventos"><CatalogIcon name="bb8d1" /><span>Eventos</span></NavLink>
        </div>
      </nav>
    </div>
  );
}
