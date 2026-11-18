import { useEffect, useState } from 'react';
import { productoService, TIPOS_PRODUCTO } from '../services/productoService';
import { formatPrecio } from '../utils/precio';
import '../styles/public-buffet.css';

const ICONOS_TIPO = {
  comida: '🍔',
  bebida: '🥤',
  snack: '🍟',
  postre: '🍰',
  combo: '🍱',
};

function BuffetCard({ producto }) {
  const precio = formatPrecio(producto.precio, { conservarCentavos: true });

  return (
    <article className="public-buffet-card">
      <div className="public-buffet-illustration" aria-hidden="true">{ICONOS_TIPO[producto.tipo]}</div>
      <div className="public-buffet-card-content">
        <h3>{producto.nombre}</h3>
        <p className="public-buffet-description">{producto.descripcion}</p>
        <p className="public-buffet-prices">{precio}</p>
      </div>
    </article>
  );
}

function BuffetSection({ id, titulo, productos }) {
  return (
    <section className="public-buffet-section" aria-labelledby={id}>
      <h2 id={id}>{titulo}</h2>
      <div className="public-buffet-list">
        {productos.map((producto) => <BuffetCard key={producto.id} producto={producto} />)}
      </div>
    </section>
  );
}

export function PublicBuffetView() {
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

      {tipos.map(([tipo, nombre]) => {
        const productosDelTipo = productos.filter((producto) => producto.tipo === tipo);
        return productosDelTipo.length > 0 && (
          <BuffetSection key={tipo} id={"buffet-" + tipo} titulo={nombre} productos={productosDelTipo} />
        );
      })}
    </div>
  );
}
