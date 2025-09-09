// Fichier de données mock pour remplacer Appwrite


// Variable globale pour stocker l'utilisateur mock
let mockUser: any = null;

// Données mock pour les propriétés
const mockProperties = [
  {
    $id: "prop-1",
    $collectionId: "properties",
    $databaseId: "real-estate",
    $createdAt: "2024-01-15T10:30:00.000Z",
    $updatedAt: "2024-01-15T10:30:00.000Z",
    $permissions: ["read", "write"],
    name: "Villa Moderne à Paris",
    type: "Villa",
    price: 850000,
    rating: 4.8,
    bedrooms: 4,
    bathrooms: 3,
    area: 2500,
    address: "123 Avenue des Champs-Élysées, 75008 Paris",
    image: 'https://images.unsplash.com/photo-1579065560489-989b0cc394ce?q=80&w=705&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: "Magnifique villa moderne avec vue sur la Seine. Cette propriété exceptionnelle offre un cadre de vie luxueux au cœur de Paris.",
    facilities: ["WiFi", "Parking", "Piscine", "Jardin", "Sécurité"],
    agent: {
      name: "Marie Dubois",
      email: "marie.dubois@immobilier.fr",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    gallery: [
      {
        $id: "gal-1-1",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
      },
      {
        $id: "gal-1-2", 
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
      }
    ],
    reviews: [
      {
        $id: "rev-1-1",
        name: "Jean Martin",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3",
        rating: 5,
        comment: "Excellente propriété, très bien située!"
      }
    ]
  },
  {
    $id: "prop-2",
    $collectionId: "properties",
    $databaseId: "real-estate",
    $createdAt: "2024-01-14T10:30:00.000Z",
    $updatedAt: "2024-01-14T10:30:00.000Z",
    $permissions: ["read", "write"],
    name: "Appartement Luxe à Lyon",
    type: "Appartement",
    price: 450000,
    rating: 4.6,
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    address: "45 Rue de la République, 69002 Lyon",
    image: "https://images.unsplash.com/photo-1627766556564-5d89b3765c46?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    description: "Appartement de standing avec terrasse privée et vue panoramique sur Lyon.",
    facilities: ["WiFi", "Ascenseur", "Balcon", "Cave"],
    agent: {
      name: "Pierre Moreau",
      email: "pierre.moreau@immobilier.fr", 
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    gallery: [
      {
        $id: "gal-2-1",
        image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
      }
    ],
    reviews: [
      {
        $id: "rev-2-1",
        name: "Sophie Laurent",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3",
        rating: 4,
        comment: "Très bel appartement, parfait pour une famille."
      }
    ]
  },
  {
    $id: "prop-3",
    $collectionId: "properties",
    $databaseId: "real-estate",
    $createdAt: "2024-01-13T10:30:00.000Z",
    $updatedAt: "2024-01-13T10:30:00.000Z",
    $permissions: ["read", "write"],
    name: "Maison Familiale à Marseille", 
    type: "Maison",
    price: 320000,
    rating: 4.4,
    bedrooms: 5,
    bathrooms: 3,
    area: 1800,
    address: "78 Boulevard Longchamp, 13001 Marseille",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3",
    description: "Maison familiale spacieuse avec jardin et garage, idéale pour une grande famille.",
    facilities: ["Jardin", "Garage", "Cuisine équipée", "Chauffage"],
    agent: {
      name: "Claire Bernard",
      email: "claire.bernard@immobilier.fr",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    gallery: [
      {
        $id: "gal-3-1",
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
      }
    ],
    reviews: [
      {
        $id: "rev-3-1",
        name: "Michel Roux",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3",
        rating: 4,
        comment: "Parfait pour notre famille de 5 personnes."
      }
    ]
  },
  {
    $id: "prop-4",
    $collectionId: "properties",
    $databaseId: "real-estate",
    $createdAt: "2024-01-12T10:30:00.000Z",
    $updatedAt: "2024-01-12T10:30:00.000Z",
    $permissions: ["read", "write"],
    name: "Studio Moderne à Nice",
    type: "Studio", 
    price: 180000,
    rating: 4.2,
    bedrooms: 1,
    bathrooms: 1,
    area: 400,
    address: "12 Promenade des Anglais, 06000 Nice",
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3",
    description: "Studio moderne avec vue mer, parfait pour un investissement locatif.",
    facilities: ["WiFi", "Climatisation", "Vue mer"],
    agent: {
      name: "Antoine Leroy",
      email: "antoine.leroy@immobilier.fr",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    gallery: [
      {
        $id: "gal-4-1",
        image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
      }
    ],
    reviews: [
      {
        $id: "rev-4-1",
        name: "Emma Petit",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3",
        rating: 5,
        comment: "Studio parfait avec une vue magnifique!"
      }
    ]
  },
  {
    $id: "prop-5",
    $collectionId: "properties",
    $databaseId: "real-estate",
    $createdAt: "2024-01-11T10:30:00.000Z",
    $updatedAt: "2024-01-11T10:30:00.000Z",
    $permissions: ["read", "write"],
    name: "Penthouse de Luxe à Cannes",
    type: "Penthouse",
    price: 1200000,
    rating: 4.9,
    bedrooms: 6,
    bathrooms: 4,
    area: 3500,
    address: "1 Boulevard de la Croisette, 06400 Cannes",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3",
    description: "Penthouse exceptionnel avec terrasse panoramique et vue sur la mer Méditerranée.",
    facilities: ["Piscine", "Terrasse", "Ascenseur privé", "Sécurité 24h", "Concierge"],
    agent: {
      name: "Isabelle Martin",
      email: "isabelle.martin@immobilier.fr",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
    },
    gallery: [
      {
        $id: "gal-5-1",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3"
      }
    ],
    reviews: [
      {
        $id: "rev-5-1",
        name: "Robert Durand",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=60&w=640&auto=format&fit=crop&ixlib=rb-4.0.3",
        rating: 5,
        comment: "Propriété de rêve avec une vue à couper le souffle!"
      }
    ]
  }
];

// Fonction de connexion mock pour les tests
export async function loginMock() {
  try {
    // Simuler un délai de connexion
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Créer un utilisateur mock
    mockUser = {
      $id: "mock-user-123",
      name: "Utilisateur Test",
      email: "test@example.com",
      avatar: "https://images.unsplash.com/photo-1748205713777-35e867676d9a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    };
    
    console.log("Connexion mock réussie:", mockUser);
    
    return true;
  } catch (error) {
    console.error("Erreur de connexion mock:", error);
    return false;
  }
}

// Fonction pour récupérer l'utilisateur mock actuel
export async function getCurrentUserMock() {
  try {
    if (mockUser) {
      return mockUser;
    }
    return null;
  } catch (error) {
    console.log("Erreur getCurrentUserMock:", error);
    return null;
  }
}

// Fonction de déconnexion mock
export async function logoutMock() {
  try {
    mockUser = null;
    console.log("Déconnexion mock réussie");
    return true;
  } catch (error) {
    console.error("Erreur de déconnexion mock:", error);
    return false;
  }
}

// Fonctions mock pour les propriétés
export async function getLatestPropertiesMock() {
  try {
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Retourner les 3 dernières propriétés
    return mockProperties.slice(0, 3);
  } catch (error) {
    console.error("Erreur getLatestPropertiesMock:", error);
    return [];
  }
}

export async function getPropertiesMock({
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  try {
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredProperties = [...mockProperties];
    
    // Filtrer par type
    if (filter && filter !== "All") {
      filteredProperties = filteredProperties.filter(prop => prop.type === filter);
    }
    
    // Filtrer par recherche
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredProperties = filteredProperties.filter(prop => 
        prop.name.toLowerCase().includes(searchTerm) ||
        prop.address.toLowerCase().includes(searchTerm) ||
        prop.type.toLowerCase().includes(searchTerm)
      );
    }
    
    // Limiter le nombre de résultats
    if (limit) {
      filteredProperties = filteredProperties.slice(0, limit);
    }
    
    return filteredProperties;
  } catch (error) {
    console.error("Erreur getPropertiesMock:", error);
    return [];
  }
}

export async function getPropertyByIdMock({ id }: { id: string }) {
  try {
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const property = mockProperties.find(prop => prop.$id === id);
    return property || null;
  } catch (error) {
    console.error("Erreur getPropertyByIdMock:", error);
    return null;
  }
}

