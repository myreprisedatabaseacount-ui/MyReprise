// Types partagés pour l'application

export interface User {
  $id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Property {
  $id: string;
  name: string;
  type: string;
  price: number;
  rating: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  address: string;
  image: string;
  description: string;
  facilities: string[];
  agent: {
    name: string;
    email: string;
    avatar: string;
  };
  gallery: Array<{
    $id: string;
    image: string;
  }>;
  reviews: Array<{
    $id: string;
    name: string;
    avatar: string;
    rating: number;
    comment: string;
  }>;
}

export interface Review {
  $id: string;
  name: string;
  avatar: string;
  review: string;
  rating: number;
  $createdAt: string;
  comment?: string;
}
