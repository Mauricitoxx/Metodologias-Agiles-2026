// Usamos la variable de entorno de Vite o por defecto la URL base con /api
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export const juegoService = {
  /**
   * Lista los juegos con filtros opcionales (coincide con GET /api/juegos)
   */
  async listar(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.nombre) queryParams.append("nombre", params.nombre);
    if (params.categoria_id) queryParams.append("categoria_id", params.categoria_id);
    if (params.dificultad_id) queryParams.append("dificultad_id", params.dificultad_id);
    if (params.solo_activos !== undefined) queryParams.append("solo_activos", params.solo_activos);

    // Apunta exactamente a /api/juegos?solo_activos=false
    const url = `${API_URL}/juegos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("Error al obtener el listado de juegos desde la API");
    }
    return response.json();
  },

  /**
   * Obtiene el detalle de un juego por su ID (GET /api/juegos/{id})
   */
  async obtenerPorId(id, incluirInactivos = false) {
    const response = await fetch(`${API_URL}/juegos/${id}?incluir_inactivos=${incluirInactivos}`);
    
    if (!response.ok) {
      if (response.status === 404) throw new Error("Juego no encontrado");
      throw new Error("Error al obtener el detalle del juego");
    }
    return response.json();
  },

  /**
   * Crea un nuevo juego (POST /api/juegos)
   */
  async crear(datosJuego) {
    const response = await fetch(`${API_URL}/juegos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosJuego),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Error al registrar el juego");
    }
    return response.json();
  },

  /**
   * Actualiza un juego existente (PUT /api/juegos/{id})
   */
  async actualizar(id, datosJuego) {
    const response = await fetch(`${API_URL}/juegos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosJuego),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Error al actualizar el juego");
    }
    return response.json();
  },

  /**
   * Da de baja lógica o elimina físicamente un juego (DELETE /api/juegos/{id})
   */
  async eliminar(id, bajaLogica = true) {
    const response = await fetch(`${API_URL}/juegos/${id}?baja_logica=${bajaLogica}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Error al dar de baja el juego");
    }
    return response.status === 204 ? null : response.json();
  },
};