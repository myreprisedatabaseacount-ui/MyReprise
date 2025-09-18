import React from 'react';
import { Laptop, Smartphone, Headphones } from 'lucide-react';

export const product = {
  id: 1,
  name: "MacBook Pro 13 M2 256GB Space Gray",
  category: "Ordinateurs portables",
  price: "1 299",
  rating: 5,
  totalRatings: 89,
  description: "MacBook Pro 13 pouces avec puce M2, 8 Go de mémoire unifiée et SSD de 256 Go. Parfait état, utilisé avec précaution. Livré avec chargeur d'origine et boîte. Idéal pour le travail créatif et la productivité.",
  images: [
    {
      id: 1,
      url: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
      alt: "MacBook Pro vue principale"
    },
    {
      id: 2,
      url: "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "MacBook Pro vue de côté"
    },
    {
      id: 3,
      url: "https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "MacBook Pro clavier"
    },
    {
      id: 4,
      url: "https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: "MacBook Pro écran"
    }
  ],
  repriseCategory: {
    id: 1,
    name: "Ordinateurs portables",
    icon: React.createElement(Laptop, { size: 20, className: "text-blue-600" }),
    brands: [
      {
        id: 1,
        name: "Apple",
        logo: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=100"
      },
      {
        id: 2,
        name: "Dell",
        logo: "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=100"
      },
      {
        id: 3,
        name: "HP",
        logo: "https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?auto=compress&cs=tinysrgb&w=100"
      },
      {
        id: 4,
        name: "Lenovo",
        logo: "https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=100"
      }
    ]
  },
  owner: {
    id: 1,
    name: "Marie Dubois",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200",
    rating: 5,
    totalReviews: 24,
    joinedDate: "Mars 2022"
  }
};

export const sampleProducts = [
  product,
  {
    id: 2,
    name: "iPhone 14 Pro 128GB Deep Purple",
    category: "Smartphones",
    price: "899",
    rating: 4,
    totalRatings: 156,
    description: "iPhone 14 Pro en excellent état, utilisé 6 mois avec coque et verre trempé. Batterie à 98% de capacité. Livré avec boîte et accessoires d'origine.",
    images: [
      {
        id: 1,
        url: "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "iPhone 14 Pro vue principale"
      },
      {
        id: 2,
        url: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "iPhone 14 Pro vue arrière"
      }
    ],
    repriseCategory: {
      id: 2,
      name: "Smartphones",
      icon: React.createElement(Smartphone, { size: 20, className: "text-blue-600" }),
      brands: [
        {
          id: 1,
          name: "Apple",
          logo: "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=100"
        },
        {
          id: 2,
          name: "Samsung",
          logo: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=100"
        },
        {
          id: 3,
          name: "Google",
          logo: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
        }
      ]
    },
    owner: {
      id: 2,
      name: "Thomas Martin",
      avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=200",
      rating: 4,
      totalReviews: 18,
      joinedDate: "Janvier 2023"
    }
  }
];