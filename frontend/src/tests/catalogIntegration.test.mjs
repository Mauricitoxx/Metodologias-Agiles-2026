import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogCategories, createCatalogEntry, filterCatalogEntries, getCatalogReturnTo, isCatalogSectionActive, loadCatalogSources } from '../utils/catalog.js';

const game = createCatalogEntry('juegos', { id: 1 }, { title: 'Catán', categories: [{ id: 1, nombre: 'Estrategia' }] });
// Fuente sintética: comprueba integración sin implementar modelos ni HU de mangas.
const reading = createCatalogEntry('lecturas', { id: 1 }, { title: 'Akira', categories: [{ id: 1, nombre: 'Ciencia ficción' }] });

test('Todos agrega fuentes y distingue registros/categorías con IDs coincidentes', async () => {
  const { entries, failures } = await loadCatalogSources([
    { id: 'juegos', listEntries: async () => [game] },
    { id: 'lecturas', listEntries: async () => [reading] },
  ]);
  assert.deepEqual(failures, []);
  assert.equal(new Set(entries.map((item) => item.key)).size, 2);
  assert.equal(catalogCategories(entries).length, 2);
  assert.deepEqual(filterCatalogEntries(entries).map((item) => item.key), ['lecturas:1', 'juegos:1']);
  assert.deepEqual(filterCatalogEntries(entries, { category: 'juegos:1', search: 'catan' }), [game]);
});

test('La caída de una fuente no oculta los resultados de otra', async () => {
  const result = await loadCatalogSources([
    { id: 'juegos', listEntries: async () => [game] },
    { id: 'lecturas', listEntries: () => { throw new Error('Sin conexión'); } },
  ]);
  assert.deepEqual(result.entries, [game]);
  assert.deepEqual(result.failures, ['lecturas']);
});

test('Las pestañas distinguen tipo y reconocen detalles sin falsos prefijos', () => {
  const manga = { to: '/catalogo/mangas', queryKeys: ['tipo'] };
  const comic = { to: '/catalogo/mangas?tipo=comic', queryKeys: ['tipo'] };
  assert.equal(isCatalogSectionActive(manga, { pathname: '/catalogo/mangas/1', search: '' }), true);
  assert.equal(isCatalogSectionActive(comic, { pathname: '/catalogo/mangas/1', search: '?tipo=comic&buscar=akira' }), true);
  assert.equal(isCatalogSectionActive(manga, { pathname: '/catalogo/mangas', search: '?tipo=comic' }), false);
  assert.equal(isCatalogSectionActive(manga, { pathname: '/catalogo/mangas-extra', search: '' }), false);
  assert.equal(isCatalogSectionActive({ to: '/catalogo' }, { pathname: '/catalogo/', search: '' }), true);
});

test('Una respuesta con formato inválido queda aislada como fallo de esa fuente', async () => {
  const result = await loadCatalogSources([
    { id: 'juegos', listEntries: async () => [game] },
    { id: 'lecturas', listEntries: async () => ({ items: [reading] }) },
  ]);
  assert.deepEqual(result.entries, [game]);
  assert.deepEqual(result.failures, ['lecturas']);
});

test('El retorno del detalle conserva sección y filtros dentro del catálogo', () => {
  assert.equal(getCatalogReturnTo('/catalogo/mangas?tipo=comic&buscar=akira'), '/catalogo/mangas?tipo=comic&buscar=akira');
  for (const path of ['https://example.com', '//example.com', '/admin', '/catalogo-extra', '/catalogo/../admin', null]) {
    assert.equal(getCatalogReturnTo(path, '/catalogo/juegos'), '/catalogo/juegos');
  }
});
