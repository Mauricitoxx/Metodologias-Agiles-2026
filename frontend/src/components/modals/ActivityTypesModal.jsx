import { useEffect, useState } from 'react';
import { Check, Edit3, Plus, Tags, Trash2, X } from 'lucide-react';
import { activityTypeService } from '../../services/activityService';

const NAME_MAX_LENGTH = 50;

const TypeRow = ({ type, onUpdated, onDeleted }) => {
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'delete'
  const [name, setName] = useState(type.nombre);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setMode('view');
    setName(type.nombre);
    setError('');
  };

  const run = async (request, onSuccess) => {
    setBusy(true);
    setError('');
    try {
      onSuccess(await request());
    } catch (requestError) {
      setError(requestError.fieldErrors?.nombre || requestError.message);
      setBusy(false);
    }
  };

  const rename = () => {
    const nombre = name.trim();
    if (!nombre) return setError('Ingresá un nombre');
    if (nombre === type.nombre) return reset();
    run(
      () => activityTypeService.update(type.id, nombre),
      (updated) => {
        onUpdated(updated);
        setBusy(false);
        setMode('view');
      }
    );
  };

  const remove = () => run(() => activityTypeService.remove(type.id), () => onDeleted(type));

  return (
    <li className="activity-types-row">
      {mode === 'edit' ? (
        <div className="activity-type-row">
          <input
            className="form-input"
            aria-label={`Nuevo nombre para ${type.nombre}`}
            maxLength={NAME_MAX_LENGTH}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') rename();
              if (event.key === 'Escape') {
                event.stopPropagation();
                reset();
              }
            }}
            disabled={busy}
            autoFocus
          />
          <button type="button" className="btn-primary" onClick={rename} disabled={busy} aria-label="Guardar nombre">
            <Check size={14} />
          </button>
          <button type="button" className="btn-secondary" onClick={reset} disabled={busy} aria-label="Cancelar">
            <X size={14} />
          </button>
        </div>
      ) : mode === 'delete' ? (
        <div className="activity-types-confirm">
          <span>
            ¿Eliminar <strong>{type.nombre}</strong>?
          </span>
          <button type="button" className="btn-confirm btn-confirm-danger" onClick={remove} disabled={busy}>
            Eliminar
          </button>
          <button type="button" className="btn-secondary" onClick={reset} disabled={busy}>
            No
          </button>
        </div>
      ) : (
        <div className="activity-types-view">
          <span className="activity-types-name">{type.nombre}</span>
          <button type="button" className="activity-types-icon-btn" onClick={() => setMode('edit')} aria-label={`Renombrar ${type.nombre}`} title="Renombrar">
            <Edit3 size={14} />
          </button>
          <button
            type="button"
            className="activity-types-icon-btn danger"
            onClick={() => setMode('delete')}
            aria-label={`Eliminar ${type.nombre}`}
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
      {error && (
        <span className="error-text" role="alert">
          {error}
        </span>
      )}
    </li>
  );
};

export const ActivityTypesModal = ({ types, onCreated, onUpdated, onDeleted, onClose }) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const create = async () => {
    const nombre = newName.trim();
    if (!nombre) return setError('Ingresá el nombre del nuevo tipo');
    setCreating(true);
    setError('');
    try {
      onCreated(await activityTypeService.create(nombre));
      setNewName('');
    } catch (requestError) {
      setError(requestError.fieldErrors?.nombre || requestError.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-types-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header-icon-title">
            <div className="alert-circle-icon info">
              <Tags size={20} />
            </div>
            <h3 className="modal-title" id="activity-types-title">
              Tipos de actividad
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="activity-types-new">NUEVO TIPO</label>
            <div className="activity-type-row">
              <input
                id="activity-types-new"
                className={`form-input ${error ? 'is-invalid' : ''}`}
                placeholder="Ej: Presentación de libro"
                maxLength={NAME_MAX_LENGTH}
                value={newName}
                onChange={(event) => {
                  setNewName(event.target.value);
                  setError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') create();
                }}
                disabled={creating}
                autoFocus
              />
              <button type="button" className="btn-primary" onClick={create} disabled={creating}>
                <Plus size={14} /> Agregar
              </button>
            </div>
            {error && (
              <span className="error-text" role="alert">
                {error}
              </span>
            )}
          </div>

          {types.length === 0 ? (
            <p className="activity-form-hint">Todavía no hay tipos cargados.</p>
          ) : (
            <ul className="activity-types-list">
              {types.map((type) => (
                <TypeRow key={type.id} type={type} onUpdated={onUpdated} onDeleted={onDeleted} />
              ))}
            </ul>
          )}
          <span className="activity-form-hint">Solo se pueden eliminar los tipos que no usa ninguna actividad.</span>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
