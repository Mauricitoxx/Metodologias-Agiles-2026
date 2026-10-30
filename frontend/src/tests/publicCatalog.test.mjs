import test from 'node:test';
import assert from 'node:assert/strict';
import { isGameAvailable } from '../utils/publicCatalog.js';
import { createCatalogEntry, filterCatalogEntries, catalogCategories } from '../utils/catalog.js';

const games = [
  { id: 1, nombre: 'Catán', activo: true, disponibilidad: true, duracion_min: 90, categorias: [{ id: 1, nombre: 'Estrategia' }, { id: 2, nombre: 'Familiar' }] },
  { id: 2, nombre: 'Catan Junior', activo: true, disponibilidad: false, duracion_min: 30, categorias: [{ id: 2, nombre: 'Familiar' }] },
  { id: 3, nombre: 'Catan de baja', activo: false, disponibilidad: true, duracion_min: 60, categorias: [{ id: 3, nombre: 'Retirados' }] },
  { id: 4, nombre: 'Virus!', activo: true, disponibilidad: true, duracion_min: 20, categorias: [{ id: 2, nombre: 'Familiar' }] },
];

const entries = games.filter(isGameAvailable).map((game) => createCatalogEntry('juegos', game, {
  title: game.nombre, categories: game.categorias, duration: game.duracion_min,
}));

test('HU-08: oculta juegos en uso, dados de baja y sin disponibilidad explícita', () => {
  assert.deepEqual(entries.map((entry) => entry.record.id), [1, 4]);
  assert.equal(isGameAvailable({ activo: true }), false);
});

test('HU-08: combina búsqueda por nombre y pertenencia a cualquiera de sus categorías', () => {
  assert.deepEqual(filterCatalogEntries(entries, { search: '  CATAN ', category: 'juegos:2' }).map((entry) => entry.record.id), [1]);
  assert.deepEqual(filterCatalogEntries(entries, { search: 'Catan', category: 'juegos:3' }), []);
  assert.deepEqual(filterCatalogEntries(entries, { search: 'Estrategia' }), []);
});

test('HU-08: categorías únicas de juegos disponibles; ordenar no altera los datos originales', () => {
  assert.deepEqual(catalogCategories(entries).map((category) => category.id), [1, 2]);
  assert.deepEqual(filterCatalogEntries(entries, { order: 'duracion' }).map((entry) => entry.record.id), [4, 1]);
  assert.deepEqual(games.map((game) => game.id), [1, 2, 3, 4]);
});
