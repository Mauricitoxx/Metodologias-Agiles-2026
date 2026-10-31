
import { PublicGameCard } from '../components/catalog/PublicGameCard';
import { PublicGameDetailView } from '../views/PublicGameDetailView';
import { publicGameCatalogService } from '../services/publicGameCatalogService';

import { PublicMangaComicCard } from '../components/catalog/PublicMangaComicCard';
import { PublicMangaComicDetailView } from '../views/PublicMangaComicDetailView';
import { publicMangaComicCatalogService } from '../services/publicMangaComicCatalogService';

import { createCatalogEntry } from '../utils/catalog';

// Cada módulo consulta y adapta únicamente los registros de su dominio.
export const catalogModules = [
  {
    id: 'juegos',
    slug: 'juegos',
    title: 'Juegos',
    availableTitle: 'Juegos disponibles',
    singular: 'juego',
    plural: 'juegos',
    searchLabel: 'Buscar juegos por título',
    enabled: true,
    sortOptions: [
      { value: 'nombre', label: 'Nombre A–Z' },
      { value: 'duracion', label: 'Duración' },
    ],
    sections: [
      { to: '/catalogo/juegos', label: '🎲 Juegos de Mesa' },
    ],

    async listEntries() {
      const games = await publicGameCatalogService.listGames();

      return games.map((game) =>
        createCatalogEntry('juegos', game, {
          title: game.nombre,
          categories: game.categorias,
          duration: game.duracion_min,
        })
      );
    },

    renderCard: (entry, returnTo) => (
      <PublicGameCard game={entry.record} returnTo={returnTo} />
    ),

    DetailView: PublicGameDetailView,
  },

  {
    id: 'lecturas',
    slug: 'mangas',
    title: 'Mangas y cómics',
    availableTitle: 'Mangas y cómics disponibles',
    singular: 'tomo',
    plural: 'tomos',
    searchLabel: 'Buscar por nombre de serie',
    enabled: true,
    sortOptions: [
      { value: 'nombre', label: 'Nombre A–Z' },
    ],
    sections: [
      {
        to: '/catalogo/mangas',
        label: '📖 Manga',
        queryKeys: ['tipo'],
      },
      {
        to: '/catalogo/mangas?tipo=comic',
        label: '🦸 Cómic & Novela Gráfica',
        queryKeys: ['tipo'],
      },
    ],

    async listEntries() {
      const records = await publicMangaComicCatalogService.list();

      return records.map((record) => {
        const categories = record.categories || record.categorias || [];

        return createCatalogEntry('lecturas', record, {
          title: `${record.title} ${record.volume_number}`,
          categories,
        });
      });
    },

    selectEntries(entries, searchParams) {
      const type = searchParams.get('tipo');

      if (!type) return entries;

      return entries.filter((entry) => {
        const recordType = entry.record.type || entry.record.tipo;
        return recordType === type;
      });
    },

    renderCard: (entry, returnTo) => (
      <PublicMangaComicCard
        record={entry.record}
        returnTo={returnTo}
      />
    ),

    DetailView: PublicMangaComicDetailView,
  },
];
