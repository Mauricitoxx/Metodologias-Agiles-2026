// Initial Mock Data for La Frikioteca
export const INITIAL_DATA = {
  boardgames: [
    {
      id: 'bg-001',
      code: '#BG-001',
      title: 'Terraforming Mars',
      minPlayers: 1,
      maxPlayers: 5,
      duration: '120 min',
      category: 'Estrategia',
      loansCount: 98,
      shelf: 'ESTANTE A-1',
      status: 'disponible', // disponible, en_mesa, en_reparacion, baja
      tableNumber: null,
      notes: '',
      image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=400&q=80',
      description: 'Grandes corporaciones compiten por transformar Marte en un planeta habitable gastando vastos recursos.',
      createdAt: '2025-01-10'
    },
    {
      id: 'bg-002',
      code: '#BG-002',
      title: 'Catan: El Juego Clásico',
      minPlayers: 3,
      maxPlayers: 4,
      duration: '75 min',
      category: 'Negociación',
      loansCount: 215,
      shelf: 'ESTANTE B-2',
      status: 'en_mesa',
      tableNumber: 'Mesa 3',
      notes: '',
      image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=400&q=80',
      description: 'Coloniza la isla de Catan recolectando madera, trigo, ladrillos, ovejas y minerales.',
      createdAt: '2025-01-12'
    },
    {
      id: 'bg-003',
      code: '#BG-003',
      title: 'Código Secreto (Codenames)',
      minPlayers: 2,
      maxPlayers: 8,
      duration: '15 min',
      category: 'Party / Palabras',
      loansCount: 164,
      shelf: 'TALLER B',
      status: 'en_reparacion',
      tableNumber: null,
      notes: 'Falta carta #12',
      image: 'https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?auto=format&fit=crop&w=400&q=80',
      description: 'Dos jefes de espías rivales conocen la identidad secreta de 25 agentes.',
      createdAt: '2025-01-15'
    },
    {
      id: 'bg-004',
      code: '#BG-004',
      title: 'Carcassonne 20 Aniversario',
      minPlayers: 2,
      maxPlayers: 5,
      duration: '45 min',
      category: 'Estrategia / Losetas',
      loansCount: 142,
      shelf: 'ESTANTE A-3',
      status: 'disponible',
      tableNumber: null,
      notes: '',
      image: 'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=400&q=80',
      description: 'Construye el paisaje medieval alrededor de la mítica ciudad francesa de Carcassonne.',
      createdAt: '2025-02-01'
    }
  ],
  comics: [
    {
      id: 'mc-001',
      code: '#MC-001',
      title: 'Berserk Deluxe Edition Vol. 1',
      author: 'Kentaro Miura',
      volumes: 1,
      category: 'Seinen / Fantasía Oscura',
      loansCount: 78,
      shelf: 'MANGA-SECCIÓN C',
      status: 'disponible',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      description: 'La historia épica de Guts, el Espadachín Negro en un mundo desgarrado por la guerra.',
      createdAt: '2025-01-14'
    },
    {
      id: 'mc-002',
      code: '#MC-002',
      title: 'Batman: The Killing Joke',
      author: 'Alan Moore & Brian Bolland',
      volumes: 1,
      category: 'DC Comics / Novela Gráfica',
      loansCount: 135,
      shelf: 'CÓMIC-SECCIÓN A',
      status: 'en_mesa',
      tableNumber: 'Mesa 1',
      image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80',
      description: 'Una mirada profunda al origen psicológico del Guasón.',
      createdAt: '2025-01-18'
    },
    {
      id: 'mc-003',
      code: '#MC-003',
      title: 'Chainsaw Man Vol. 1',
      author: 'Tatsuki Fujimoto',
      volumes: 1,
      category: 'Shonen / Acción',
      loansCount: 92,
      shelf: 'MANGA-SECCIÓN B',
      status: 'baja',
      notes: 'Tapa dañada por líquido',
      image: 'https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=400&q=80',
      description: 'Denji vive una vida de extrema pobreza pagando las deudas de su padre.',
      createdAt: '2025-02-05'
    }
  ],
  cards: [
    {
      id: 'tcg-001',
      code: '#TCG-001',
      title: 'Magic The Gathering: Commander Starter',
      category: 'TCG / Mazos Listos',
      format: 'Commander (100 cartas)',
      loansCount: 45,
      shelf: 'VITRINA CARTAS 1',
      status: 'disponible',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80',
      description: 'Mazo introductorio balanceado enfocado en mecánicas de Commander.',
      createdAt: '2025-02-10'
    },
    {
      id: 'tcg-002',
      code: '#TCG-002',
      title: 'Pokémon TCG: Battle Academy Set',
      category: 'TCG / Familiar',
      format: '3 Mazos de 60 cartas',
      loansCount: 62,
      shelf: 'VITRINA CARTAS 2',
      status: 'disponible',
      image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=400&q=80',
      description: 'Set completo de aprendizaje con tableros y guías paso a paso.',
      createdAt: '2025-02-12'
    }
  ],
  buffet: [
    {
      id: 'bf-001',
      code: '#BF-001',
      title: 'Hamburguesa La Friki-Doble',
      category: 'Comidas',
      price: 8500,
      description: 'Doble carne smash 120g, queso cheddar fundido, bacon crocante y salsa especial de la casa.',
      status: 'disponible', // disponible, sin_stock, baja
      isPopular: true,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'bf-002',
      code: '#BF-002',
      title: 'Nachos Vulcano con Queso y Guacamole',
      category: 'Snacks',
      price: 6200,
      description: 'Porción generosa para compartir mientras juegas. Incluye dip de queso cheddar y salsa criolla.',
      status: 'disponible',
      isPopular: false,
      image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'bf-003',
      code: '#BF-003',
      title: 'Poción de Maná (Mocktail Azul)',
      category: 'Bebidas',
      price: 3800,
      description: 'Bebida gasificada energizante con curaçao azul sin alcohol, lima y toque de menta fresca.',
      status: 'disponible',
      isPopular: true,
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'bf-004',
      code: '#BF-004',
      title: 'Combo Maratón Gamer',
      category: 'Combos',
      price: 11200,
      description: 'Hamburguesa a elección + papas rústicas + pinta de cerveza artesanal o mocktail.',
      status: 'baja',
      isPopular: false,
      image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=400&q=80'
    }
  ],
  events: [
    {
      id: 'ev-001',
      code: '#EV-001',
      title: 'Torneo Nocturno de Catan 2026',
      date: '2026-10-15',
      time: '19:30 hs',
      fee: '$4.000',
      maxSlots: 16,
      bookedSlots: 12,
      category: 'Torneo de Juegos',
      status: 'programado', // programado, en_curso, finalizado, cancelado
      reward: 'Juego Catan Plus + Consumición gratis',
      description: 'Torneo suizo a 3 rondas clasificatorias con mesa final. Premios a los mejores 3.'
    },
    {
      id: 'ev-002',
      code: '#EV-002',
      title: 'Noche de Rol: Dungeons & Dragons 5e',
      date: '2026-10-18',
      time: '20:00 hs',
      fee: '$3.500',
      maxSlots: 10,
      bookedSlots: 10,
      category: 'Rol & Campañas',
      status: 'programado',
      reward: 'Set de dados poliédricos + Ficha oficial',
      description: 'One-shot para principiantes y veteranos guiado por Master invitado.'
    },
    {
      id: 'ev-003',
      code: '#EV-003',
      title: 'Taller de Pintura de Miniaturas Warhammer',
      date: '2026-10-22',
      time: '18:00 hs',
      fee: '$5.000',
      maxSlots: 8,
      bookedSlots: 4,
      category: 'Talleres',
      status: 'programado',
      reward: 'Miniatura pintada para llevar',
      description: 'Aprende técnicas de pincel seco, sombreado y degradados. Incluye todos los materiales.'
    }
  ],
  admins: [
    {
      id: 'usr-001',
      name: 'Lucas Martínez',
      email: 'lucas.admin@frikioteca.com',
      role: 'Superadmin', // Superadmin, Gestor de Inventario, Staff Buffet
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      status: 'activo', // activo, inactivo
      createdAt: '2024-11-01',
      isCurrentUser: true
    },
    {
      id: 'usr-002',
      name: 'Camila Rossi',
      email: 'camila.inventario@frikioteca.com',
      role: 'Gestor de Inventario',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      status: 'activo',
      createdAt: '2025-01-05',
      isCurrentUser: false
    },
    {
      id: 'usr-003',
      name: 'Tomás Gómez',
      email: 'tomas.buffet@frikioteca.com',
      role: 'Staff Buffet',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      status: 'activo',
      createdAt: '2025-02-15',
      isCurrentUser: false
    }
  ]
};

const STORAGE_KEY = 'frikioteca_admin_store_v1';

export const storage = {
  get: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    } catch {
      return INITIAL_DATA;
    }
  },

  set: (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving to storage', e);
    }
  },

  reset: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    } catch {
      return INITIAL_DATA;
    }
  }
};
