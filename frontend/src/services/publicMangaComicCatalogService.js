
import { mangaComicService } from './mangaComicService';

export const publicMangaComicCatalogService = {
  async list() {
    const records = await mangaComicService.list();

    if (!Array.isArray(records)) {
      throw new Error('La respuesta del catálogo de lecturas no es válida.');
    }

    return records.filter((record) => record.is_active === true);
  },

  async get(id) {
    const record = await mangaComicService.get(id);

    if (!record || record.is_active !== true) {
      throw new Error('Este tomo no está disponible en el catálogo.');
    }

    return record;
  },
};
