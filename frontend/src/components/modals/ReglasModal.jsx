import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, ArrowUp, ArrowDown, FileText, Check, AlertCircle } from 'lucide-react';
import { reglaJuegoService } from '../../services/reglaJuegoService';

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

  // 1. Cargar reglas al abrir el modal
  useEffect(() => {
    if (isOpen && juego?.id) {
      cargarReglas();
    }
  }, [isOpen, juego]);

  const cargarReglas = async () => {
    setLoading(true);
    try {
      const data = await reglaJuegoService.listarPorJuego(juego.id);
      // Ordenar localmente por la propiedad `orden`
      const ordenadas = [...data].sort((a, b) => a.orden - b.orden);
      setReglas(ordenadas);
      resetForm(ordenadas.length + 1);
    } catch (err) {
      setError(err.message || 'Error al cargar las reglas');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (nextOrden = 1) => {
    setEditingId(null);
    setFormTitulo('');
    setFormContenido('');
    setFormOrden(nextOrden);
    setError('');
  };

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
      await cargarJuegos();
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
      <div className="modal-window modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* ENCABEZADO */}
        <div className="modal-header">
          <h3 className="modal-title">
            📜 Reglas del Juego: <span className="highlight-text">{juego?.nombre}</span>
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {/* BOTÓN MODO CARGA MASIVA EN TEXTO PLANO */}
          <div className="flex-between mb-3">
            <span className="section-small-label">SECCIONES REGISTRADAS ({reglas.length})</span>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setShowBulkMode(!showBulkMode)}
            >
              <FileText size={14} /> {showBulkMode ? 'Ver Formulario Normal' : 'Importar Texto Plano'}
            </button>
          </div>

          {/* MODO CARGA MASIVA DE TEXTO PLANO */}
          {showBulkMode ? (
            <div className="retro-panel p-3 mb-4">
              <h4>Importar Reglas desde Texto Plano</h4>
              <p className="small-text text-muted mb-2">
                Pegue las reglas completas. Si inician con números (ej: <code>1. Preparación</code>),
                el sistema las dividirá e interpretará su orden automáticamente.
              </p>
              <textarea
                className="form-textarea"
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"1. Preparación\nColocar el tablero al centro...\n\n2. Desarrollo del Turno\nCada jugador tira 2 dados..."}
              />
              <div className="flex-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleProcessBulkText}
                  disabled={saving || !bulkText.trim()}
                >
                  <Check size={14} /> {saving ? 'Procesando...' : 'Dividir y Guardar Reglas'}
                </button>
              </div>
            </div>
          ) : (
            /* FORMULARIO MANUAL ALTA / EDICIÓN */
            <form onSubmit={handleSaveIndividual} className="retro-panel p-3 mb-4">
              <h4>{editingId ? 'Editar Sección' : 'Nueva Sección de Regla'}</h4>
              <div className="form-row-3">
                <div className="form-group span-2">
                  <label>Título de la Sección *</label>
                  <input
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
                  <label>Orden</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={formOrden}
                    onChange={(e) => setFormOrden(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cuerpo de Texto *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formContenido}
                  onChange={(e) => {
                    setFormContenido(e.target.value);
                    setError('');
                  }}
                  placeholder="Escriba la explicación detallada de esta regla..."
                />
              </div>

              <div className="flex-end gap-2 mt-2">
                {editingId && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => resetForm(reglas.length + 1)}>
                    Cancelar Edición
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-primary btn-sm"
                  disabled={saving || !formContenido.trim()}
                >
                  {editingId ? <Check size={14} /> : <Plus size={14} />}
                  {saving ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Agregar Sección'}
                </button>
              </div>
            </form>
          )}

          {/* MENSAJE DE ERROR */}
          {error && (
            <div className="error-banner mb-3 p-2 border-red flex-align gap-2">
              <AlertCircle size={16} color="red" />
              <span className="error-text small-text">{error}</span>
            </div>
          )}

          {/* LISTADO DE SECCIONES ORDENADAS */}
          {loading ? (
            <p>Cargando secciones de reglas...</p>
          ) : reglas.length === 0 ? (
            <p className="empty-text text-center p-4">No hay secciones registradas para este juego.</p>
          ) : (
            <div className="reglas-stack gap-2">
              {reglas.map((regla, index) => (
                <div key={regla.id} className="regla-card-item retro-panel p-2 flex-between">
                  <div className="regla-content">
                    <div className="flex-align gap-2">
                      <span className="badge-orden">#{regla.orden}</span>
                      <h4 className="m-0">{regla.titulo}</h4>
                    </div>
                    <p className="regla-body-text mt-1 mb-0">{regla.contenido}</p>
                  </div>

                  {/* CONTROLES DE EDICIÓN Y REORDENAMIENTO */}
                  <div className="regla-actions flex-align gap-1">
                    <button
                      type="button"
                      className="btn-icon"
                      disabled={index === 0}
                      onClick={() => handleMover(index, -1)}
                      title="Subir posición"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      disabled={index === reglas.length - 1}
                      onClick={() => handleMover(index, 1)}
                      title="Bajar posición"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleEditClick(regla)}
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={() => handleEliminar(regla.id)}
                      title="Eliminar"
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