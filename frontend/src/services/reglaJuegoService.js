// Usamos la URL base configurada para la API de FastAPI (/api)
const API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || "http://127.0.0.1:8000/api";
export const reglaJuegoService = {
  /**
   * Obtiene la lista completa de reglas pertenecientes a un juego específico.
   */
  async listarPorJuego(juegoId) {
    const response = await fetch(`${API_URL}/juegos/${juegoId}/reglas`);

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error("No se pudieron cargar las reglas del juego.");
    }
    return response.json();
  },

  /**
   * Obtiene una regla específica por su ID.
   */
  async obtenerPorId(id) {
    const response = await fetch(`${API_URL}/reglas/${id}`);

    if (!response.ok) {
      if (response.status === 404) throw new Error("Regla no encontrada.");
      throw new Error("Error al obtener la regla.");
    }
    return response.json();
  },

  /**
   * Crea una nueva sección de regla asociada a un juego (Valida contra ReglaCreate).
   * Criterios HU-07: Bloquea si título o contenido están vacíos, o si el título se repite.
   * POST /api/reglas
   */
  async crear(datosRegla) {
    const response = await fetch(`${API_URL}/reglas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        titulo: datosRegla.titulo?.trim(),
        contenido: datosRegla.contenido?.trim(),
        orden: Number(datosRegla.orden) || 1,
        juego_id: Number(datosRegla.juego_id)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const mensajeDetail = Array.isArray(errorData.detail)
        ? errorData.detail[0]?.msg
        : errorData.detail;

      throw new Error(mensajeDetail || "No se pudo guardar la regla.");
    }
    return response.json();
  },

  /**
   * Edita el título, contenido u orden de una regla existente (Valida contra ReglaUpdate).
   */
  async actualizar(id, datosRegla) {
    const response = await fetch(`${API_URL}/reglas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(datosRegla.titulo !== undefined ? { titulo: datosRegla.titulo.trim() } : {}),
        ...(datosRegla.contenido !== undefined ? { contenido: datosRegla.contenido.trim() } : {}),
        ...(datosRegla.orden !== undefined ? { orden: Number(datosRegla.orden) } : {})
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const mensajeDetail = Array.isArray(errorData.detail)
        ? errorData.detail[0]?.msg
        : errorData.detail;

      throw new Error(mensajeDetail || "No se pudieron actualizar los cambios en la regla.");
    }
    return response.json();
  },

  /**
   * Reordena las secciones de reglas de un juego enviando el nuevo listado de posiciones.
   * Coincide con el schema ReglaReorderItem [ { id: 1, orden: 1 }, { id: 2, orden: 2 } ]
   */
  async reordenar(juegoId, listaOrdenada) {
    // Convierte el array al formato { id, orden }
    const itemsPayload = listaOrdenada.map((item, index) => ({
      id: Number(item.id),
      orden: index + 1
    }));

    const response = await fetch(`${API_URL}/juegos/${juegoId}/reglas/reordenar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(itemsPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "No se pudo actualizar el orden de las reglas.");
    }
    return response.json();
  },

  /**
   * Elimina una sección de regla de la base de datos.
   */
  async eliminar(id) {
    const response = await fetch(`${API_URL}/reglas/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("No se pudo eliminar la sección de regla.");
    }
    return response.status === 204 ? null : response.json();
  },
};