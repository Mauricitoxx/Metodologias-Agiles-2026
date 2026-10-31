import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { reglaJuegoService } from '../services/reglaJuegoService.js';

describe('Pruebas unitarias para reglaJuegoService (Frontend)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    // Restaurar mock de fetch después de cada prueba
    global.fetch = originalFetch;
  });

  it('listarPorJuego() debe retornar el listado de reglas ordenadas', async () => {
    const mockReglas = [
      { id: 1, titulo: 'Preparación', contenido: 'Poner el tablero', orden: 1, juego_id: 10 },
      { id: 2, titulo: 'Desarrollo', contenido: 'Tirar dados', orden: 2, juego_id: 10 }
    ];

    global.fetch = async (url) => {
      assert.ok(url.includes('/juegos/10/reglas'));
      return {
        ok: true,
        status: 200,
        json: async () => mockReglas
      };
    };

    const resultado = await reglaJuegoService.listarPorJuego(10);
    assert.equal(resultado.length, 2);
    assert.equal(resultado[0].titulo, 'Preparación');
    assert.equal(resultado[1].orden, 2);
  });

  it('crear() debe enviar payload formateado y retornar la regla creada', async () => {
    const nuevaReglaInput = {
      juego_id: 10,
      titulo: '  Puntuación  ',
      contenido: '  El primer jugador en llegar a 10 puntos gana  ',
      orden: 3
    };

    global.fetch = async (url, options) => {
      assert.ok(url.includes('/reglas'));
      assert.equal(options.method, 'POST');

      const body = JSON.parse(options.body);
      assert.equal(body.titulo, 'Puntuación');
      assert.equal(body.contenido, 'El primer jugador en llegar a 10 puntos gana');
      assert.equal(body.orden, 3);
      assert.equal(body.juego_id, 10);

      return {
        ok: true,
        status: 201,
        json: async () => ({ id: 99, ...body })
      };
    };

    const creada = await reglaJuegoService.crear(nuevaReglaInput);
    assert.equal(creada.id, 99);
    assert.equal(creada.titulo, 'Puntuación');
  });

  it('crear() debe lanzar error especifico si el titulo duplicado o contenido vacio falla (HU-07)', async () => {
    global.fetch = async () => {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          detail: 'El cuerpo del texto no puede estar vacío. Debe completar la información'
        })
      };
    };

    await assert.rejects(
      async () => {
        await reglaJuegoService.crear({ juego_id: 10, titulo: 'Test', contenido: '' });
      },
      {
        name: 'Error',
        message: 'El cuerpo del texto no puede estar vacío. Debe completar la información'
      }
    );
  });

  it('actualizar() debe enviar cambios parciales correctamente', async () => {
    global.fetch = async (url, options) => {
      assert.ok(url.includes('/reglas/5'));
      assert.equal(options.method, 'PUT');
      
      const body = JSON.parse(options.body);
      assert.equal(body.contenido, 'Nueva explicación actualizada');
      assert.equal(body.titulo, undefined);

      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 5, titulo: 'Original', contenido: body.contenido, orden: 1, juego_id: 10 })
      };
    };

    const actualizada = await reglaJuegoService.actualizar(5, { contenido: '  Nueva explicación actualizada  ' });
    assert.equal(actualizada.contenido, 'Nueva explicación actualizada');
  });

  it('reordenar() debe enviar el array estructurado con los nuevos indices', async () => {
    const listaOrdenada = [
      { id: '2', titulo: 'Paso 2' },
      { id: '1', titulo: 'Paso 1' }
    ];

    global.fetch = async (url, options) => {
      assert.ok(url.includes('/juegos/10/reglas/reordenar'));
      assert.equal(options.method, 'PUT');

      const body = JSON.parse(options.body);
      assert.deepEqual(body, [
        { id: 2, orden: 1 },
        { id: 1, orden: 2 }
      ]);

      return {
        ok: true,
        status: 200,
        json: async () => ({ message: 'Reglas reordenadas con éxito' })
      };
    };

    const res = await reglaJuegoService.reordenar(10, listaOrdenada);
    assert.equal(res.message, 'Reglas reordenadas con éxito');
  });

  it('eliminar() debe enviar peticion DELETE y procesar status 204', async () => {
    global.fetch = async (url, options) => {
      assert.ok(url.includes('/reglas/15'));
      assert.equal(options.method, 'DELETE');
      return {
        ok: true,
        status: 204
      };
    };

    const res = await reglaJuegoService.eliminar(15);
    assert.equal(res, null);
  });
});