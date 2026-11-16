
export const catalogPath = '/catalogo';

// Las identidades incluyen el módulo: un juego y un manga pueden compartir ID.
export function createCatalogEntry(moduleId, record, { title, categories = [], duration = null }) {
  return {
    key: `${moduleId}:${record.id}`,
    moduleId,
    record,
    title,
    duration,
    categories: categories.map((category) => {
      const nombre = typeof category === 'string'
        ? category
        : category.nombre || category.name || '';

      const id = typeof category === 'string'
        ? category
        : category.id ?? nombre;

      return {
        ...(typeof category === 'object' && category !== null ? category : {}),
        id,
        nombre,
        key: `${moduleId}:${id}`,
      };
    }).filter((category) => category.nombre),
  };
}

const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();

export function filterCatalogEntries(
  entries,
  { search = '', category = '', categories = [], order = 'nombre' } = {}
) {
  // Compatibilidad con el filtro anterior de una sola categoría.
  const selectedCategories = categories.length
    ? categories
    : category
      ? [category]
      : [];

  const filtered = entries.filter((entry) => {
    const matchesSearch = normalize(entry.title).includes(normalize(search));

    // Si hay varios géneros seleccionados, alcanza con coincidir con uno.
    const matchesCategories =
      selectedCategories.length === 0 ||
      entry.categories.some((item) => selectedCategories.includes(item.key));

    return matchesSearch && matchesCategories;
  });

  return filtered.sort((a, b) => {
    if (order === 'duracion') {
      return (a.duration ?? Infinity) - (b.duration ?? Infinity)
        || a.title.localeCompare(b.title, 'es');
    }

    if (order === 'nombre-desc') {
      return b.title.localeCompare(a.title, 'es');
    }

    return a.title.localeCompare(b.title, 'es');
  });
}

export function catalogCategories(entries) {
  return [
    ...new Map(
      entries
        .flatMap((entry) => entry.categories)
        .map((category) => [category.key, category])
    ).values(),
  ].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

// Una fuente caída no oculta los resultados de los otros módulos.
export async function loadCatalogSources(modules) {
  const results = await Promise.allSettled(
    modules.map((module) =>
      Promise.resolve()
        .then(() => module.listEntries())
        .then((entries) => {
          if (!Array.isArray(entries)) {
            throw new Error(`Respuesta inválida del catálogo ${module.id}`);
          }
          return entries;
        })
    )
  );

  return results.reduce((result, response, index) => {
    if (response.status === 'fulfilled') {
      result.entries.push(...response.value);
    } else {
      result.failures.push(modules[index].id);
    }
    return result;
  }, { entries: [], failures: [] });
}

export function isCatalogSectionActive(section, { pathname, search }) {
  const url = new URL(section.to, 'https://catalog.local');

  const samePath =
    pathname.replace(/\/$/, '') === url.pathname ||
    (url.pathname !== catalogPath && pathname.startsWith(`${url.pathname}/`));

  if (!samePath) return false;

  const query = new URLSearchParams(search);

  return (section.queryKeys || []).every(
    (key) => query.get(key) === url.searchParams.get(key)
  );
}

export function getCatalogReturnTo(candidate, fallback = catalogPath) {
  if (typeof candidate !== 'string') return fallback;

  try {
    const url = new URL(candidate, 'https://catalog.local');

    return url.origin === 'https://catalog.local' &&
      (url.pathname === catalogPath || url.pathname.startsWith(`${catalogPath}/`))
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
