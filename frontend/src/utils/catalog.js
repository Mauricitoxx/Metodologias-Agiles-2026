export const catalogPath = '/catalogo';

// Las identidades incluyen el módulo: un juego y un manga pueden compartir ID.
export function createCatalogEntry(moduleId, record, { title, categories = [], duration = null }) {
  return {
    key: `${moduleId}:${record.id}`, moduleId, record, title, duration,
    categories: categories.map((category) => ({ ...category, key: `${moduleId}:${category.id}` })),
  };
}

const normalize = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();

export function filterCatalogEntries(entries, { search = '', category = '', order = 'nombre' } = {}) {
  return entries.filter((entry) => normalize(entry.title).includes(normalize(search))
    && (!category || entry.categories.some((item) => item.key === category)))
    .sort((a, b) => (order === 'duracion' ? (a.duration ?? Infinity) - (b.duration ?? Infinity) : 0)
      || a.title.localeCompare(b.title, 'es'));
}

export function catalogCategories(entries) {
  return [...new Map(entries.flatMap((entry) => entry.categories).map((category) => [category.key, category])).values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

// Una fuente caída no oculta los resultados de los otros módulos.
export async function loadCatalogSources(modules) {
  const results = await Promise.allSettled(modules.map((module) => Promise.resolve().then(() => module.listEntries()).then((entries) => {
    if (!Array.isArray(entries)) throw new Error(`Respuesta inválida del catálogo ${module.id}`);
    return entries;
  })));
  return results.reduce((result, response, index) => {
    if (response.status === 'fulfilled') result.entries.push(...response.value);
    else result.failures.push(modules[index].id);
    return result;
  }, { entries: [], failures: [] });
}

export function isCatalogSectionActive(section, { pathname, search }) {
  const url = new URL(section.to, 'https://catalog.local');
  const samePath = pathname.replace(/\/$/, '') === url.pathname
    || (url.pathname !== catalogPath && pathname.startsWith(`${url.pathname}/`));
  if (!samePath) return false;
  const query = new URLSearchParams(search);
  return (section.queryKeys || []).every((key) => query.get(key) === url.searchParams.get(key));
}

export function getCatalogReturnTo(candidate, fallback = catalogPath) {
  if (typeof candidate !== 'string') return fallback;
  try {
    const url = new URL(candidate, 'https://catalog.local');
    return url.origin === 'https://catalog.local' && (url.pathname === catalogPath || url.pathname.startsWith(`${catalogPath}/`))
      ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
