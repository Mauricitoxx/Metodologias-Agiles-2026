import { juegoService } from './juegoService.js';
import { isGameAvailable } from '../utils/publicCatalog.js';

export const publicGameCatalogService = {
  async listGames() {
    const games = await juegoService.listar({ solo_activos: true });
    return games.filter(isGameAvailable);
  },
  async getGame(id) {
    const game = await juegoService.obtenerPorId(id);
    if (!game || !isGameAvailable(game)) throw new Error('Este juego no está disponible en el catálogo.');
    return game;
  },
};
