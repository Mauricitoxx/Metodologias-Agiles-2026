import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Edit2, Trash2, ArrowUp, ArrowDown, FileText, Check, AlertCircle } from 'lucide-react';
import { reglaJuegoService } from '../../services/reglaJuegoService';
import '../../styles/reglas.css';

export const ReglasModal = ({ isOpen, onClose, juego }) => {
  const [reglas, setReglas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estado para formulario de edición / alta manual
  const [editingId, setEditingId] = useState(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formContenido, setFormContenido] = useState('');
  const [formOrden, setFormOrden] = useState(1);

  // Estado para la carga masiva en texto plano
  const [bulkText, setBulkText] = useState('');
  const [showBulkMode, setShowBulkMode] = useState(false);

  // Mensajes de error en tiempo real
  const [error, setError] = useState('');

  const resetForm = (nextOrden = 1) => {
    setEditingId(null);
    setFormTitulo('');
    setFormContenido('');
    setFormOrden(nextOrden);
    setError('');
  };

  const juegoId = juego?.id;

  const cargarReglas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reglaJuegoService.listarPorJuego(juegoId);
      // Ordenar localmente por la propiedad `orden`
      const ordenadas = [...data].sort((a, b) => a.orden - b.orden);
      setReglas(ordenadas);
      resetForm(ordenadas.length + 1);
    } catch (err) {
      setError(err.message || 'Error al cargar las reglas');
    } finally {
      setLoading(false);
    }
  }, [juegoId]);

  // 1. Cargar reglas al abrir el modal
  useEffect(() => {
    if (isOpen && juegoId) {
      cargarReglas();
    }
  }, [isOpen, juegoId, cargarReglas]);

  // 2. Validaciones en tiempo real
  const validarSeccion = (titulo, contenido, idActual = null) => {
    const tituloClean = titulo.trim();
    const contenidoClean = contenido.trim();

    if (!contenidoClean) {
      return 'El cuerpo del texto no puede estar vacío. Debe completar la información.';
    }

    if (!tituloClean) {
      return 'El título de la sección no puede estar vacío.';
    }

    // Verificar títulos duplicados en el mismo juego
    const existeDuplicado = reglas.some(
      (r) => r.titulo.toLowerCase() === tituloClean.toLowerCase() && r.id !== idActual
    );

    if (existeDuplicado) {
      return `Ya existe una sección con el título "${tituloClean}".`;
    }

    return null;
  };

  // 3. Guardar regla individual (Alta / Edición)
  const handleSaveIndividual = async (e) => {
    e.preventDefault();
    const errorValidacion = validarSeccion(formTitulo, formContenido, editingId);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await reglaJuegoService.actualizar(editingId, {
          titulo: formTitulo.trim(),
          contenido: formContenido.trim(),
          orden: Number(formOrden)
        });
      } else {
        await reglaJuegoService.crear({
          juego_id: juego.id,
          titulo: formTitulo.trim(),
          contenido: formContenido.trim(),
          orden: Number(formOrden)
        });
      }
      await cargarReglas();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 4. PARSER DE TEXTO PLANO A SECCIONES (Bulk Parsing)
  // Divide párrafos que inicien con números (ej: "1. Título\nContenido...")
  const handleProcessBulkText = async () => {
    if (!bulkText.trim()) {
      setError('Ingrese texto para procesar.');
      return;
    }

    // Expresión regular para detectar patrones tipo "1. Título", "1 - Título", "Sección 1:"
    const lineas = bulkText.split(/\n\s*\n/); // Divide por bloques de párrafos
    const nuevasSecciones = [];
    let contadorOrden = reglas.length + 1;

    for (const bloque of lineas) {
      const lineasBloque = bloque.trim().split('\n');
      if (lineasBloque.length === 0 || !lineasBloque[0]) continue;

      let primerLinea = lineasBloque[0].trim();
      let contenido = lineasBloque.slice(1).join('\n').trim();

      // Extrae número de orden si la primera línea empieza con número (ej: "1. Preparación" -> orden: 1, título: "Preparación")
      const matchOrden = primerLinea.match(/^(\d+)[\.\-\)]\s*(.+)/);
      let titulo = primerLinea;
      let ordenEspecifico = contadorOrden;

      if (matchOrden) {
        ordenEspecifico = parseInt(matchOrden[1], 10);
        titulo = matchOrden[2].trim();
      }

      // Si no hay líneas secundarias, usamos la primera parte como título y el resto como cuerpo
      if (!contenido) {
        const partes = primerLinea.split(':');
        if (partes.length > 1) {
          titulo = partes[0].trim();
          contenido = partes.slice(1).join(':').trim();
        } else {
          contenido = primerLinea;
          titulo = `Sección ${ordenEspecifico}`;
        }
      }

      // Validar que el cuerpo no esté vacío
      if (contenido) {
        nuevasSecciones.push({
          juego_id: juego.id,
          titulo: titulo || `Sección ${ordenEspecifico}`,
          contenido: contenido,
          orden: ordenEspecifico
        });
        contadorOrden++;
      }
    }

    if (nuevasSecciones.length === 0) {
      setError('No se pudieron reconocer secciones válidas en el texto.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Guardar secuencialmente en el backend
      for (const sec of nuevasSecciones) {
        await reglaJuegoService.crear(sec);
      }
      setBulkText('');
      setShowBulkMode(false);
      await cargarReglas();
    } catch (err) {
      setError(`Error al guardar algunas secciones: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 5. Reordenamiento (Subir / Bajar posición)
  const handleMover = async (index, direccion) => {
    const nuevoIndex = index + direccion;
    if (nuevoIndex < 0 || nuevoIndex >= reglas.length) return;

    const nuevaLista = [...reglas];
    const temp = nuevaLista[index];
    nuevaLista[index] = nuevaLista[nuevoIndex];
    nuevaLista[nuevoIndex] = temp;

    // Actualizar propiedad `orden` localmente
    const listaActualizada = nuevaLista.map((item, idx) => ({
      ...item,
      orden: idx + 1
    }));

    setReglas(listaActualizada);

    try {
      await reglaJuegoService.reordenar(juego.id, listaActualizada);
    } catch (err) {
      setError('No se pudo guardar el nuevo orden en el servidor.');
      await cargarReglas(); // Revertir en caso de error
    }
  };

  // 6. Eliminar sección
  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta sección de reglas?')) return;
    try {
      await reglaJuegoService.eliminar(id);
      await cargarReglas();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (regla) => {
    setEditingId(regla.id);
    setFormTitulo(regla.titulo);
    setFormContenido(regla.contenido);
    setFormOrden(regla.orden);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window reglas-modal" onClick={(e) => e.stopPropagation()}>
        {/* ENCABEZADO */}
        <div className="modal-header">
          <h3 className="modal-title">
            📜 Reglas del juego: <span className="reglas-modal-highlight">{juego?.nombre}</span>
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* BOTÓN MODO CARGA MASIVA EN TEXTO PLANO */}
          <div className="reglas-toolbar">
            <span className="section-small-label">Secciones registradas ({reglas.length})</span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowBulkMode(!showBulkMode)}
            >
              <FileText size={14} /> {showBulkMode ? 'Ver formulario normal' : 'Importar texto plano'}
            </button>
          </div>

          {/* MODO CARGA MASIVA DE TEXTO PLANO */}
          {showBulkMode ? (
            <div className="retro-panel reglas-panel">
              <h4>Importar reglas desde texto plano</h4>
              <p className="reglas-hint">
                Pegue las reglas completas. Si inician con números (ej: <code>1. Preparación</code>),
                el sistema las dividirá e interpretará su orden automáticamente.
              </p>
              <textarea
                className="form-textarea reglas-textarea-bulk"
                aria-label="Reglas en texto plano"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"1. Preparación\nColocar el tablero al centro...\n\n2. Desarrollo del Turno\nCada jugador tira 2 dados..."}
              />
              <div className="reglas-form-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleProcessBulkText}
                  disabled={saving || !bulkText.trim()}
                >
                  <Check size={14} /> {saving ? 'Procesando...' : 'Dividir y guardar reglas'}
                </button>
              </div>
            </div>
          ) : (
            /* FORMULARIO MANUAL ALTA / EDICIÓN */
            <form onSubmit={handleSaveIndividual} className="retro-panel reglas-panel">
              <h4>{editingId ? 'Editar sección' : 'Nueva sección de regla'}</h4>
              <div className="reglas-form-row">
                <div className="form-group">
                  <label htmlFor="regla-titulo">Título de la sección *</label>
                  <input
                    id="regla-titulo"
                    type="text"
                    className="form-input"
                    value={formTitulo}
                    onChange={(e) => {
                      setFormTitulo(e.target.value);
                      setError('');
                    }}
                    placeholder="Ej. Preparación del tablero"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="regla-orden">Orden</label>
                  <input
                    id="regla-orden"
                    type="number"
                    className="form-input"
                    min="1"
                    value={formOrden}
                    onChange={(e) => setFormOrden(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="regla-contenido">Cuerpo de texto *</label>
                <textarea
                  id="regla-contenido"
                  className="form-textarea reglas-textarea"
                  value={formContenido}
                  onChange={(e) => {
                    setFormContenido(e.target.value);
                    setError('');
                  }}
                  placeholder="Escriba la explicación detallada de esta regla..."
                />
              </div>

              <div className="reglas-form-actions">
                {editingId && (
                  <button type="button" className="btn-secondary" onClick={() => resetForm(reglas.length + 1)}>
                    Cancelar edición
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || !formContenido.trim()}
                >
                  {editingId ? <Check size={14} /> : <Plus size={14} />}
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar sección'}
                </button>
              </div>
            </form>
          )}

          {/* MENSAJE DE ERROR */}
          {error && (
            <div className="reglas-error" role="alert">
              <AlertCircle size={16} />
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* LISTADO DE SECCIONES ORDENADAS */}
          {loading ? (
            <p className="reglas-message" role="status">Cargando secciones de reglas...</p>
          ) : reglas.length === 0 ? (
            <p className="reglas-message">No hay secciones registradas para este juego.</p>
          ) : (
            <div className="reglas-list">
              {reglas.map((regla, index) => (
                <div key={regla.id} className="retro-panel reglas-item">
                  <div className="reglas-item-content">
                    <div className="reglas-item-heading">
                      <span className="reglas-orden">#{regla.orden}</span>
                      <h4>{regla.titulo}</h4>
                    </div>
                    <p className="reglas-item-body">{regla.contenido}</p>
                  </div>

                  {/* CONTROLES DE EDICIÓN Y REORDENAMIENTO */}
                  <div className="reglas-item-actions">
                    <button
                      type="button"
                      className="reglas-icon-btn"
                      disabled={index === 0}
                      onClick={() => handleMover(index, -1)}
                      title="Subir posición"
                      aria-label={`Subir ${regla.titulo}`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="reglas-icon-btn"
                      disabled={index === reglas.length - 1}
                      onClick={() => handleMover(index, 1)}
                      title="Bajar posición"
                      aria-label={`Bajar ${regla.titulo}`}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      className="reglas-icon-btn"
                      onClick={() => handleEditClick(regla)}
                      title="Editar"
                      aria-label={`Editar ${regla.titulo}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="reglas-icon-btn danger"
                      onClick={() => handleEliminar(regla.id)}
                      title="Eliminar"
                      aria-label={`Eliminar ${regla.titulo}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
