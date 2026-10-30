import { Link, useLocation } from 'react-router-dom';
import { catalogModules } from '../../catalog/modules';
import { isCatalogSectionActive } from '../../utils/catalog';

export function CatalogSections({ count }) {
  const location = useLocation();
  const sections = [
    { to: '/catalogo', label: '✨ Todos', count },
    ...catalogModules.flatMap((module) => module.sections),
  ];
  return (
    <nav className="public-catalog-sections" aria-label="Secciones del catálogo">
      {sections.map((section) => <Link key={section.to} to={section.to} className={isCatalogSectionActive(section, location) ? 'active' : ''} aria-current={isCatalogSectionActive(section, location) ? 'page' : undefined}>
        {section.label}{section.count !== undefined && <span>{section.count}</span>}
      </Link>)}
    </nav>
  );
}
