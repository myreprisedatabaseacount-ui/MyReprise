'use client'

import { Product } from '@/lib/types';
import Link from 'next/link';

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

const RepriseIcon: React.FC = () => (
    <svg width="36" height="13" viewBox="0 0 36 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-4 mt-1">
        <path d="M33.9229 6.10925C33.9227 3.94264 32.1667 2.18633 30 2.18633C27.8335 2.18658 26.0773 3.94279 26.0771 6.10925C26.0771 8.27592 27.8334 10.0319 30 10.0322V12.1093C26.6862 12.109 24 9.42306 24 6.10925C24.0002 2.79565 26.6864 0.109496 30 0.109253C33.3138 0.109253 35.9998 2.7955 36 6.10925C36 9.42321 33.314 12.1093 30 12.1093V10.0322C32.1668 10.0322 33.9229 8.27607 33.9229 6.10925Z" fill="#FC9231" />
        <path d="M21 7.98169C21 7.98169 20.4 10.9817 17.9785 10.9817C15.5569 10.9817 15 10.1245 15 10.1245" stroke="#1241AA" strokeWidth="2" strokeLinecap="round" />
        <path d="M15 4C15 4 15.6 1 18.0215 1C20.4431 1 21 1.85714 21 1.85714" stroke="#FC9231" strokeWidth="2" strokeLinecap="round" />
        <path d="M9.92292 6.03638C9.92268 3.86977 8.16667 2.11346 6 2.11346C3.83354 2.1137 2.07732 3.86992 2.07708 6.03638C2.07708 8.20304 3.83339 9.95905 6 9.9593V12.0364C2.68625 12.0361 0 9.35018 0 6.03638C0.000243522 2.72278 2.6864 0.0366205 6 0.036377C9.31381 0.036377 11.9998 2.72263 12 6.03638C12 9.35033 9.31396 12.0364 6 12.0364V9.9593C8.16682 9.9593 9.92292 8.2032 9.92292 6.03638Z" fill="#1241AA" />
    </svg>
);



const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    return (
        <Link  className='my-3' href={'/product/1'} >
            <div className="flex items-center gap-4 ">
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
                            <span className="text-lg font-medium text-blue-600">reprise</span>
                            <RepriseIcon />
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;