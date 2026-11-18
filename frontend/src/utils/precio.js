// Precios de la carta (HU-13): se muestran en pesos sin centavos, por ejemplo $10.000.
// La API sigue aceptando hasta dos decimales, así que leer un importe los respeta.

const sinCentavos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const conCentavos = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const MENSAJE_OFERTA_MAYOR_A_CERO = 'El precio de oferta debe ser mayor a cero';
export const MENSAJE_OFERTA_MENOR_AL_PRECIO = 'El precio de oferta debe ser menor al precio actual';

const tieneValor = (valor) => valor !== null && valor !== undefined && valor !== '';

export const formatPrecio = (valor, { conservarCentavos = false } = {}) => {
  if (!tieneValor(valor)) return '';
  const numero = Number(valor);
  const formateador = conservarCentavos && !Number.isInteger(numero) ? conCentavos : sinCentavos;
  return `$${formateador.format(numero)}`;
};

// Valor inicial de un campo de precio: 10.000, o 8.500,50 si el producto tiene centavos
export const precioParaInput = (valor) => {
  if (!tieneValor(valor)) return '';
  const numero = Number(valor);
  return Number.isInteger(numero) ? sinCentavos.format(numero) : conCentavos.format(numero);
};

// Lee lo que escribe el administrador: 10000, 10.000, 10.000,50 o 8500.5.
// Devuelve null si no es un importe válido con hasta dos decimales. Los negativos se leen
// para poder avisar que el precio debe ser mayor a cero.
export const parsePrecio = (texto) => {
  let valor = String(texto ?? '').trim().replace(/^\$\s*/, '');
  if (valor.includes(',')) {
    valor = valor.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(valor)) {
    // Solo puntos de miles: 10.000
    valor = valor.replace(/\./g, '');
  }
  return /^-?\d+(\.\d{1,2})?$/.test(valor) ? Number(valor) : null;
};

// Mismas reglas que el backend: opcional, mayor a cero y menor al precio original
export const validarPrecioOferta = (precioTexto, ofertaTexto) => {
  if (!String(ofertaTexto ?? '').trim()) return null;

  const oferta = parsePrecio(ofertaTexto);
  if (oferta === null) return 'Ingresá un importe válido, por ejemplo 7.500';
  if (oferta <= 0) return MENSAJE_OFERTA_MAYOR_A_CERO;

  const precio = parsePrecio(precioTexto);
  if (precio !== null && oferta >= precio) return MENSAJE_OFERTA_MENOR_AL_PRECIO;
  return null;
};

// Porcentaje que se ahorra con la oferta, para el badge "-15% OFF"
export const porcentajeDescuento = (precio, oferta) => {
  if (!tieneValor(precio) || !tieneValor(oferta) || Number(precio) <= 0) return 0;
  return Math.round((1 - Number(oferta) / Number(precio)) * 100);
};
