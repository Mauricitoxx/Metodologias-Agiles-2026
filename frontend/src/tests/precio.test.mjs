import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPrecio,
  parsePrecio,
  porcentajeDescuento,
  precioParaInput,
  validarPrecioOferta,
  MENSAJE_OFERTA_MAYOR_A_CERO,
  MENSAJE_OFERTA_MENOR_AL_PRECIO
} from '../utils/precio.js';

describe('Precios de la carta (HU-13)', () => {
  it('muestra los precios en pesos sin centavos', () => {
    assert.equal(formatPrecio(10000), '$10.000');
    assert.equal(formatPrecio(8500.5), '$8.501');
    assert.equal(formatPrecio(null), '');
  });

  it('prepara el valor inicial del formulario sin perder centavos', () => {
    assert.equal(precioParaInput(10000), '10.000');
    assert.equal(precioParaInput(8500.5), '8.500,50');
    assert.equal(precioParaInput(null), '');
  });

  it('lee importes con o sin separador de miles', () => {
    assert.equal(parsePrecio('10000'), 10000);
    assert.equal(parsePrecio('10.000'), 10000);
    assert.equal(parsePrecio('$ 10.000'), 10000);
    assert.equal(parsePrecio('10.000,50'), 10000.5);
    assert.equal(parsePrecio('8500.5'), 8500.5);
    assert.equal(parsePrecio('-100'), -100);
    assert.equal(parsePrecio('abc'), null);
    assert.equal(parsePrecio('10,123'), null);
  });

  it('la oferta es opcional', () => {
    assert.equal(validarPrecioOferta('10.000', ''), null);
    assert.equal(validarPrecioOferta('10.000', '   '), null);
  });

  it('acepta una oferta menor al precio original', () => {
    assert.equal(validarPrecioOferta('10.000', '7.500'), null);
    assert.equal(validarPrecioOferta('10.000', '9999,99'), null);
  });

  it('rechaza una oferta igual o mayor al precio original', () => {
    assert.equal(validarPrecioOferta('10.000', '10000'), MENSAJE_OFERTA_MENOR_AL_PRECIO);
    assert.equal(validarPrecioOferta('10.000', '12.000'), MENSAJE_OFERTA_MENOR_AL_PRECIO);
    assert.equal(MENSAJE_OFERTA_MENOR_AL_PRECIO, 'El precio de oferta debe ser menor al precio actual');
  });

  it('rechaza una oferta cero o inválida', () => {
    assert.equal(validarPrecioOferta('10.000', '0'), MENSAJE_OFERTA_MAYOR_A_CERO);
    assert.equal(validarPrecioOferta('10.000', '-5'), MENSAJE_OFERTA_MAYOR_A_CERO);
    assert.match(validarPrecioOferta('10.000', 'diez'), /importe válido/);
  });

  it('calcula el porcentaje de descuento', () => {
    assert.equal(porcentajeDescuento(10000, 7500), 25);
    assert.equal(porcentajeDescuento(14.5, 9.99), 31);
    assert.equal(porcentajeDescuento(10000, null), 0);
  });
});
