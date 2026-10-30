import { PublicGameCard } from '../components/catalog/PublicGameCard';
import { PublicGameDetailView } from '../views/PublicGameDetailView';
import { publicGameCatalogService } from '../services/publicGameCatalogService';
import { createCatalogEntry } from '../utils/catalog';

// Contrato de módulos: ver docs/catalog-integration.md.
// listEntries solo devuelve registros públicos y disponibles de SU dominio.
export const catalogModules = [
  {
    id: 'juegos', slug: 'juegos', title: 'Juegos', availableTitle: 'Juegos disponibles',
    singular: 'juego', plural: 'juegos', searchLabel: 'Buscar juegos por título',
    enabled: true, sortOptions: [{ value: 'nombre', label: 'Nombre A–Z' }, { value: 'duracion', label: 'Duración' }],
    sections: [{ to: '/catalogo/juegos', label: '🎲 Juegos de Mesa' }],
    async listEntries() {
      const games = await publicGameCatalogService.listGames();
      return games.map((game) => createCatalogEntry('juegos', game, {
        title: game.nombre, categories: game.categorias, duration: game.duracion_min,
      }));
    },
    renderCard: (entry, returnTo) => <PublicGameCard game={entry.record} returnTo={returnTo} />,
    DetailView: PublicGameDetailView,
  },
  {
    id: 'lecturas', slug: 'mangas', title: 'Mangas y cómics', enabled: false,
    sections: [
      { to: '/catalogo/mangas', label: '📖 Manga', queryKeys: ['tipo'] },
      { to: '/catalogo/mangas?tipo=comic', label: '🦸 Cómic & Novela Gráfica', queryKeys: ['tipo'] },
    ],
  },
];
