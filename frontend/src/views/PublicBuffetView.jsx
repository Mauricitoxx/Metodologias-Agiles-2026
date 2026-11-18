import { useEffect, useState } from 'react';
import { CatalogIcon } from '../components/catalog/CatalogIcon';
import { productoService, TIPOS_PRODUCTO } from '../services/productoService';
import { formatPrecio, porcentajeDescuento } from '../utils/precio';
import '../styles/public-buffet.css';

const ICONOS_TIPO = {
  comida: '🍔',
  bebida: '🥤',
  snack: '🍟',
  postre: '🍰',
  combo: '🍱',
};

const tieneOferta = (producto) => producto.precio_oferta != null;

function BuffetCard({ producto }) {
  const enOferta = tieneOferta(producto);
  const descuento = porcentajeDescuento(producto.precio, producto.precio_oferta);
  const precio = formatPrecio(producto.precio, { conservarCentavos: true });

  return (
    <article className="public-buffet-card">
      {enOferta && (
        <span className="public-buffet-badge">
          <CatalogIcon name="e68e1" />
          {descuento > 0 && descuento < 100 ? `${descuento}% de descuento` : 'Oferta'}
        </span>
      )}
      <div className="public-buffet-illustration" aria-hidden="true">{ICONOS_TIPO[producto.tipo]}</div>
      <div className="public-buffet-card-content">
        <h3>{producto.nombre}</h3>
        <p className="public-buffet-description">{producto.descripcion}</p>
        <p className="public-buffet-prices">
          {enOferta ? (
            <>
              <span><span className="public-sr-only">Precio original </span><s>{precio}</s></span>
              <strong><span className="public-sr-only">Precio de oferta </span>{formatPrecio(producto.precio_oferta, { conservarCentavos: true })}</strong>
            </>
          ) : precio}
        </p>
      </div>
    </article>
  );
}

function BuffetSection({ id, titulo, productos, ocultarTitulo = false }) {
  return (
    <section className="public-buffet-section" aria-labelledby={id}>
      <h2 id={id} className={ocultarTitulo ? 'public-sr-only' : undefined}>{titulo}</h2>
      <div className="public-buffet-list">
        {productos.map((producto) => <BuffetCard key={producto.id} producto={producto} />)}
      </div>
    </section>
  );
}

export function PublicBuffetView() {
  const [filtro, setFiltro] = useState('todos');
  const [resultado, setResultado] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    productoService.list()
      .then((productos) => {
        if (!cancelado) setResultado({ productos });
      })
      .catch(() => {
        if (!cancelado) setResultado({ error: true });
      });
    return () => { cancelado = true; };
  }, [intento]);

  const productos = resultado?.productos ?? [];
  const tipos = Object.entries(TIPOS_PRODUCTO).filter(([tipo]) => productos.some((producto) => producto.tipo === tipo));
  const filtrados = productos.filter((producto) => filtro === 'todos' || filtro === 'ofertas' || producto.tipo === filtro);
  const ofertas = filtrados.filter(tieneOferta);
  const sinOferta = filtrados.filter((producto) => !tieneOferta(producto));

  function reintentar() {
    setResultado(null);
    setIntento((anterior) => anterior + 1);
  }

  return (
    <div className="public-buffet">
      <h1 className="public-sr-only">Carta del Buffet</h1>

      {!resultado && <p className="public-catalog-message" role="status">Cargando la carta…</p>}
      {resultado?.error && (
        <div className="public-catalog-message" role="alert">
          <h2>No pudimos cargar la carta</h2>
          <button type="button" className="public-catalog-primary" onClick={reintentar}>Reintentar</button>
        </div>
      )}
      {resultado?.productos?.length === 0 && (
        <p className="public-catalog-message" role="status">Por el momento no hay productos disponibles.</p>
      )}

      {productos.length > 0 && (
        <>
          <div className="public-catalog-sections public-buffet-filters" role="group" aria-label="Filtrar la carta">
            <button type="button" className="public-buffet-offers-filter" aria-pressed={filtro === 'ofertas'} onClick={() => setFiltro('ofertas')}>
              <CatalogIcon name="19686" /> Descuentos
            </button>
            <button type="button" className={filtro === 'todos' ? 'active' : ''} aria-pressed={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todos</button>
            {tipos.map(([tipo, nombre]) => (
              <button type="button" key={tipo} className={filtro === tipo ? 'active' : ''} aria-pressed={filtro === tipo} onClick={() => setFiltro(tipo)}>
                <span aria-hidden="true">{ICONOS_TIPO[tipo]}</span> {nombre}
              </button>
            ))}
          </div>

          {ofertas.length > 0 && <BuffetSection id="buffet-ofertas" titulo="Ofertas" productos={ofertas} ocultarTitulo />}
          {filtro === 'ofertas' && ofertas.length === 0 && (
            <p className="public-catalog-message" role="status">Por el momento no hay productos en oferta.</p>
          )}
          {filtro !== 'ofertas' && tipos.map(([tipo, nombre]) => {
            const productosDelTipo = sinOferta.filter((producto) => producto.tipo === tipo);
            return productosDelTipo.length > 0 && (
              <BuffetSection key={tipo} id={`buffet-${tipo}`} titulo={nombre} productos={productosDelTipo} />
            );
          })}
        </>
      )}
    </div>
  );
}
