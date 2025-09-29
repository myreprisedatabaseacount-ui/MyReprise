'use client'

import Link from 'next/link';

// Interface pour les produits mockés (fallback)
interface Product {
  id: number;
  name: string;
  image: string;
  rating: number;
  totalRatings: number;
  hasReprise: boolean;
}

interface OfferImage {
  id: number;
  imageUrl: string;
  isMain: boolean;
  color: string | null;
  colorHex: string | null;
}

interface Offer {
  id: number;
  productId: number;
  title: string;
  description: string;
  price: number;
  status: string;
  productCondition: string;
  listingType: string;
  sellerId: number;
  categoryId: number;
  brandId: number | null;
  subjectId: number | null;
  addressId: number | null;
  specificData: any;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  images: OfferImage[];
  product: {
    id: number;
    nameAr: string;
    nameFr: string;
    categoryId: number;
    brandId: number | null;
  };
  category: {
    id: number;
    nameFr: string;
    nameAr: string;
  };
  brand: {
    id: number;
    nameFr: string;
    nameAr: string;
  } | null;
  seller: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const StarRating: React.FC<{ rating: number; totalRatings: number }> = ({ rating, totalRatings }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span
                key={i}
                className={`text-xl ${i <= rating ? 'text-orange-400' : 'text-gray-300'
                    }`}
            >
                ★
            </span>
        );
    }

    return (
        <div className="flex items-center gap-1 mb-1">
            <div className="flex">{stars}</div>
            <span className="text-sm text-gray-400 ml-1">{totalRatings}</span>
        </div>
    );
};

// Fonction pour obtenir le texte de l'état du produit
const getProductConditionText = (condition: string) => {
    switch (condition) {
        case 'new':
            return 'Neuf';
        case 'like_new':
            return 'Comme neuf';
        case 'good':
            return 'Bon état';
        case 'fair':
            return 'État correct';
        default:
            return condition;
    }
};

// Fonction pour obtenir la couleur de l'état du produit
const getProductConditionColor = (condition: string) => {
    switch (condition) {
        case 'new':
            return 'bg-green-100 text-green-800';
        case 'like_new':
            return 'bg-blue-100 text-blue-800';
        case 'good':
            return 'bg-yellow-100 text-yellow-800';
        case 'fair':
            return 'bg-orange-100 text-orange-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};



const ProductCard: React.FC<{ product?: Product; offer?: Offer }> = ({ product, offer }) => {
    // Si c'est une offre, utiliser les données de l'offre
    if (offer) {
        const mainImage = offer.images?.find(img => img.isMain) || offer.images?.[0];
        const imageUrl = mainImage?.imageUrl || '/placeholder-image.jpg';
        
        return (
            <Link className='my-3 block' href={`/product/${offer.id}`}>
                <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                            src={imageUrl}
                            alt={offer.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        {/* 1. Titre de l'offre */}
                        <h3 className="text-lg font-medium text-gray-900 truncate mb-2">
                            {offer.title}
                        </h3>
                        
                        {/* 2. État du produit */}
                        <div className="mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProductConditionColor(offer.productCondition)}`}>
                                {getProductConditionText(offer.productCondition)}
                            </span>
                        </div>
                        
                        {/* 3. Call to action : Demander reprise */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-blue-600">Demander reprise</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                    <path d="M19 15L20.09 21.26L27 22L20.09 22.74L19 29L17.91 22.74L11 22L17.91 21.26L19 15Z" fill="currentColor"/>
                                </svg>
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                                {offer.price.toLocaleString()} DH
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    // Si c'est un produit mocké (fallback)
    if (product) {
        return (
            <Link className='my-3' href={'/product/1'}>
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <StarRating rating={product.rating} totalRatings={product.totalRatings} />
                        <h3 className="text-lg font-medium text-gray-900 truncate mb-1">
                            {product.name}
                        </h3>
                        {product.hasReprise && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-blue-600">Demander reprise</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
                                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                    <path d="M19 15L20.09 21.26L27 22L20.09 22.74L19 29L17.91 22.74L11 22L17.91 21.26L19 15Z" fill="currentColor"/>
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        );
    }

    return null;
};

export default ProductCard;