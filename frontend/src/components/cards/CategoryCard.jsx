import React from 'react';
import { Pencil, Trash2, Dices, Tag, CheckCircle2 } from 'lucide-react';

export const CategoryCard = ({ categoria, onEdit, onDelete }) => {
  const juegosCount = categoria.juegos_count || (categoria.juegos ? categoria.juegos.length : 0);
  const tieneJuegos = juegosCount > 0;

  return (
    <div className="category-card" data-category-id={categoria.id}>
      <div className="category-card-header">
        <div className="category-title-wrap">
          <div className="category-icon-bubble">
            <Tag size={16} strokeWidth={2.5} />
          </div>
          <div className="category-header-text">
            <h4 className="category-name">{categoria.nombre}</h4>
            <span className="category-id-chip">#CAT-{String(categoria.id).padStart(2, '0')}</span>
          </div>
        </div>

        <div className={`category-usage-badge ${tieneJuegos ? 'badge-assigned' : 'badge-free'}`}>
          {tieneJuegos ? (
            <>
              <Dices size={14} />
              <span>{juegosCount} {juegosCount === 1 ? 'juego' : 'juegos'}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              <span>Sin juegos</span>
            </>
          )}
        </div>
      </div>

      <p className="category-description">
        {categoria.descripcion || 'Sin descripción detallada.'}
      </p>

      <div className="category-card-footer">
        <button
          type="button"
          className="category-btn category-btn-edit"
          onClick={() => onEdit(categoria)}
          title={`Editar categoría ${categoria.nombre}`}
        >
          <Pencil size={15} />
          <span>Editar</span>
        </button>

        <button
          type="button"
          className={`category-btn category-btn-delete ${tieneJuegos ? 'btn-disabled-hint' : ''}`}
          onClick={() => onDelete(categoria)}
          title={
            tieneJuegos
              ? 'No se puede eliminar porque hay juegos usándola'
              : `Eliminar categoría ${categoria.nombre}`
          }
        >
          <Trash2 size={15} />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  );
};
