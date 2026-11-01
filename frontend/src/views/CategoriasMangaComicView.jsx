
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Tags, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/useAdmin';
import { categoriaMangaComicService } from '../services/categoriaMangaComicService';
import { CategoriaFormModal } from '../components/modals/CategoriaFormModal';
import { ConfirmDeleteCategoryModal } from '../components/modals/ConfirmDeleteCategoryModal';

export const CategoriasMangaComicView = () => {
  const navigate = useNavigate();
  const { showToast } = useAdmin();

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  const cargarCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const result = await categoriaMangaComicService.listar();
      setCategorias(Array.isArray(result) ? result : []);
    } catch (err) {
      showToast(err.message || 'Error al cargar las categorías', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  const handleCreate = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (categoria) => {
    setEditingCategory(categoria);
    setIsFormOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingCategory) {
      const updated = await categoriaMangaComicService.actualizar(
        editingCategory.id,
        formData
      );
      showToast(`Categoría "${updated.nombre}" actualizada`, 'success');
    } else {
      const created = await categoriaMangaComicService.crear(formData);
      showToast(`Categoría "${created.nombre}" creada`, 'success');
    }

    setIsFormOpen(false);
    setEditingCategory(null);
    await cargarCategorias();
    return true;
  };

  const handleDelete = async (categoria) => {
    await categoriaMangaComicService.eliminar(categoria.id);
    showToast(`Categoría "${categoria.nombre}" eliminada`, 'warning');
    setDeletingCategory(null);
    await cargarCategorias();
  };

  return (
    <div className="view-content-wrapper">
      <div className="catalog-action-row">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/admin/inventario')}
        >
          <ArrowLeft size={16} />
          Volver al inventario
        </button>

        <button
          type="button"
          className="primary-cta-yellow-btn"
          onClick={handleCreate}
        >
          <span className="cta-icon-circle">
            <Plus size={18} strokeWidth={3} />
          </span>
          NUEVA CATEGORÍA
        </button>
      </div>

      <div className="catalog-header-bar">
        <h3 className="catalog-active-title">
          <Tags size={18} /> CATEGORÍAS DE MANGAS Y CÓMICS
        </h3>
        <span className="catalog-order-caption">
          {categorias.length} categorías
        </span>
      </div>

      {loading ? (
        <div className="empty-state-box">
          <p>Cargando categorías...</p>
        </div>
      ) : categorias.length === 0 ? (
        <div className="empty-state-box">
          <p>Todavía no hay categorías registradas.</p>
          <p>Creá una para poder asignarla a los mangas y cómics.</p>
        </div>
      ) : (
        <div className="cards-stack">
          {categorias.map((categoria) => (
            <article className="category-management-card" key={categoria.id}>
              <div>
                <h3>{categoria.nombre}</h3>
                <p>{categoria.descripcion}</p>
                <span>
                  {categoria.mangas_comics_count || 0}{' '}
                  {(categoria.mangas_comics_count || 0) === 1
                    ? 'publicación asociada'
                    : 'publicaciones asociadas'}
                </span>
              </div>

              <div className="category-management-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleEdit(categoria)}
                  aria-label={`Editar ${categoria.nombre}`}
                >
                  <Pencil size={16} />
                  Editar
                </button>

                <button
                  type="button"
                  className="btn-confirm btn-confirm-danger"
                  onClick={() => setDeletingCategory(categoria)}
                  aria-label={`Eliminar ${categoria.nombre}`}
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <CategoriaFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSave}
        initialCategory={editingCategory}
        existingCategories={categorias}
      />

      <ConfirmDeleteCategoryModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        categoria={deletingCategory}
        onConfirm={handleDelete}
        entityLabel="manga o cómic"
        countField="mangas_comics_count"
      />
    </div>
  );
};
