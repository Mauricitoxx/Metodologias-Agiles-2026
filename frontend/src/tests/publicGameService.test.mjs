import test from 'node:test';
import assert from 'node:assert/strict';
import { publicGameCatalogService } from '../services/publicGameCatalogService.js';
import { getGameVideoUrl } from '../utils/gameVideo.js';

test('HU-08: consulta pública sin credenciales y excluye bajas y juegos no disponibles', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(new URL(url).pathname, '/api/juegos');
    assert.equal(new URL(url).searchParams.get('solo_activos'), 'true');
    assert.equal(options?.headers?.Authorization, undefined);
    return Response.json([
      { id: 1, activo: true, disponibilidad: true },
      { id: 2, activo: true, disponibilidad: false },
      { id: 3, activo: false, disponibilidad: true },
    ]);
  });
  assert.deepEqual((await publicGameCatalogService.listGames()).map((game) => game.id), [1]);
  assert.equal(fetch.mock.callCount(), 1);
});

test('HU-09: detalle directo público, campos completos y rechazo de juegos no disponibles', async (t) => {
  const record = { id: 1, activo: true, disponibilidad: true, nombre: 'Catan', descripcion: 'Descripción', jugadores_min: 3, jugadores_max: 4, duracion_min: 75, edad_recomendada: 10, dificultad: { nombre: 'Media' }, reglas: [{ titulo: 'Preparación', contenido: 'Preparar tablero', orden: 1 }], video_url: 'https://example.com/tutorial' };
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(new URL(url).searchParams.get('incluir_inactivos'), 'false');
    return Response.json(record);
  });
  assert.deepEqual(await publicGameCatalogService.getGame(1), record);
  record.disponibilidad = false;
  await assert.rejects(publicGameCatalogService.getGame(1), /no está disponible/);
  record.disponibilidad = true;
  record.activo = false;
  await assert.rejects(publicGameCatalogService.getGame(1), /no está disponible/);
});

test('La API caída o un detalle inexistente muestran error y no datos ficticios', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 404 }));
  await assert.rejects(publicGameCatalogService.getGame(999), /no encontrado/);
  await assert.rejects(publicGameCatalogService.listGames(), /Error al obtener/);
});

test('Administración: conserva, modifica y desvincula el video con el nombre del campo de API', () => {
  assert.equal(getGameVideoUrl({ video_url: ' https://example.com/video ' }), 'https://example.com/video');
  assert.equal(getGameVideoUrl({ videoUrl: 'https://example.com/nuevo' }), 'https://example.com/nuevo');
  assert.equal(getGameVideoUrl({ video_url: null, videoUrl: '' }), null);
  assert.equal(getGameVideoUrl({}), null);
});
