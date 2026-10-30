import { CatalogSections } from '../components/catalog/CatalogSections';

// Punto de integración HU-21/HU-22: habilitar lecturas en catalog/modules.jsx.
// No consulta servicios de mangas ni implementa sus filtros, tarjetas o detalle.
export function PublicMangasSlot() {
  return <><CatalogSections /><section className="public-catalog-message"><h1>Mangas y cómics</h1><p>El catálogo de lectura estará disponible próximamente.</p></section></>;
}
