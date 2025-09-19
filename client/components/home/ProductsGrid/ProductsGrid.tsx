import React from 'react';
import { Star, ChevronRight } from 'lucide-react';

const products = [
  {
    id: 1,
    name: "VR801 Virtual Reality Glasses",
    rating: 4.8,
    reviews: 142,
    image: "https://images.pexels.com/photos/7915285/pexels-photo-7915285.jpeg?auto=compress&cs=tinysrgb&w=400",
    changeWith: {
      name: "Apple iPhone 14 128GB White",
      image: "https://images.pexels.com/photos/1275229/pexels-photo-1275229.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  },
  {
    id: 2,
    name: "VR801 Virtual Reality Glasses",
    rating: 4.7,
    reviews: 98,
    image: "https://images.pexels.com/photos/1275229/pexels-photo-1275229.jpeg?auto=compress&cs=tinysrgb&w=400",
    changeWith: {
      name: "Smart Watch Series 7 White",
      image: "https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  },
  {
    id: 3,
    name: "VR801 Virtual Reality Glasses",
    rating: 4.9,
    reviews: 156,
    image: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400",
    changeWith: {
      name: "Smart Watch Series 7 White",
      image: "https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  },
  {
    id: 4,
    name: "VR801 Virtual Reality Glasses",
    rating: 4.6,
    reviews: 89,
    image: "https://images.pexels.com/photos/8000629/pexels-photo-8000629.jpeg?auto=compress&cs=tinysrgb&w=400",
    changeWith: {
      name: "Oure choose for you",
      image: "https://images.pexels.com/photos/1275229/pexels-photo-1275229.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  },
  {
    id: 5,
    name: "Tablet Apple iPad Air M1",
    rating: 4.8,
    reviews: 203,
    image: "https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=400",
    changeWith: {
      name: "Apple iPhone 14",
      image: "https://images.pexels.com/photos/1275229/pexels-photo-1275229.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  },
  {
    id: 6,
    name: "Headphones Apple AirPods 2 Pro",
    rating: 4.4,
    reviews: 78,
    image: "https://images.pexels.com/photos/8000629/pexels-photo-8000629.jpeg?auto=compress&cs=tinysrgb&w=400",
    changeWith: {
      name: "Wireless Earbuds",
      image: "https://images.pexels.com/photos/8000629/pexels-photo-8000629.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  },
  {
    id: 7,
    name: "Tablet Apple iPad Pro M1",
    rating: 4.9,
    reviews: 167,
    image: "https://images.pexels.com/photos/1275229/pexels-photo-1275229.jpeg?auto=compress&cs=tinysrgb&w=400",
    changeWith: {
      name: "MacBook Pro",
      image: "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=100"
    }
  },
  {
    id: 8,
    name: "Wireless Bluetooth Headphones Sony",
    rating: 4.5,
    reviews: 134,
    image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400",
    changeWith: {
      name: "Premium Audio",
      image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=100"
    }
  }
];

const StarRating = ({ rating, reviews }: { rating: number; reviews: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className="flex items-center gap-1 mb-2">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < fullStars
                ? 'fill-orange-400 text-orange-400'
                : i === fullStars && hasHalfStar
                  ? 'fill-orange-400 text-orange-400'
                  : 'text-gray-300'
              }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">({reviews})</span>
    </div>
  );
};

const ProductCard = ({ product }: { product: typeof products[0] }) => {
  return (
    <div className="bg-white p-4">
      <div className="bg-gray-100 mb-4 aspect-square flex items-center justify-center ">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>

      <StarRating rating={product.rating} reviews={product.reviews} />

      <h3 className="font-medium text-gray-900 text-sm mb-3 line-clamp-2">
        {product.name}
      </h3>

      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span>change with</span>
        <div className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1 flex-1">
          <img
            src={product.changeWith.image}
            alt={product.changeWith.name}
            className="w-7 h-7 object-cover rounded"
          />
          <span className="truncate">{product.changeWith.name}</span>
        </div>
      </div>
    </div>
  );
};

function ProductsGrid() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-0.5 bg-gray-800 hidden lg:block"></div>
            <h2 className="text-2xl font-semibold text-gray-900">Oure chose for you</h2>
          </div>
          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
            <span className="text-sm">View all</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductsGrid;