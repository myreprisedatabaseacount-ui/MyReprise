'use client'

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Plus, Star, MapPin, ArrowLeftRight, X, Coins, Truck, Search, ArrowRight } from 'lucide-react';
import NavBar from '@/components/Header/NavBar';
import { useGetMyOffersQuery, useGetOfferByIdQuery } from '@/services/api/OfferApi';
import { useGetOrderDetailsQuery } from '@/services/api/RepriseOrderApi';
import { useParams, useRouter } from 'next/navigation';
import Map from '@/components/ui/Map';
import { useCurrentUser } from '@/services/hooks/useCurrentUser';
import { useSearchLocationsMutation } from '@/services/api/AddressApi';
import RepriseOrderModal from '@/components/products/RepriseOrderModal';

interface OfferImage {
  id: number;
  imageUrl: string;
  isMain: boolean;
  color: string | null;
  colorHex: string | null;
}

interface Brand {
  id: number;
  name: string;
  logo: string;
  description?: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  icon: string;
  parentId: number | null;
  gender: string;
  ageMin: number;
  ageMax: number;
  listingType: string | null;
}

interface RepriseCategory {
  id: number;
  name: string;
  description: string;
  image: string;
  icon: string;
  parentId: number | null;
  gender: string;
  ageMin: number;
  ageMax: number;
  listingType: string | null;
}

interface Store {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface Seller {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  profileImage: string | null;
  isVerified: boolean;
  role: string;
  createdAt: string;
}

interface Address {
  id: number;
  city: string;
  sector: string | null;
  addressName: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  fullAddress: string;
  shortAddress: string;
  coordinates: { lat: number; lng: number } | null;
}

interface Product {
  id: number;
  productId: number;
  sellerId: number;
  categoryId: number;
  brandId: number;
  subjectId: number | null;
  addressId: number;
  productCondition: string;
  price: number;
  title: string;
  description: string;
  status: string;
  listingType: string;
  images: OfferImage[];
  specificData: string;
  createdAt: string;
  brand: Brand | null;
  category: Category | null;
  seller: Seller | null;
  store: Store | null;
  repriseCategories: RepriseCategory[];
  address: Address | null;
}

const RepriseIcon: React.FC = () => (
  <svg width="24" height="9" viewBox="0 0 36 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-5 mt-1">
    <path d="M33.9229 6.10925C33.9227 3.94264 32.1667 2.18633 30 2.18633C27.8335 2.18658 26.0773 3.94279 26.0771 6.10925C26.0771 8.27592 27.8334 10.0319 30 10.0322V12.1093C26.6862 12.109 24 9.42306 24 6.10925C24.0002 2.79565 26.6864 0.109496 30 0.109253C33.3138 0.109253 35.9998 2.7955 36 6.10925C36 9.42321 33.314 12.1093 30 12.1093V10.0322C32.1668 10.0322 33.9229 8.27607 33.9229 6.10925Z" fill="#FC9231" />
    <path d="M21 7.98169C21 7.98169 20.4 10.9817 17.9785 10.9817C15.5569 10.9817 15 10.1245 15 10.1245" stroke="#1241AA" strokeWidth="2" strokeLinecap="round" />
    <path d="M15 4C15 4 15.6 1 18.0215 1C20.4431 1 21 1.85714 21 1.85714" stroke="#FC9231" strokeWidth="2" strokeLinecap="round" />
    <path d="M9.92292 6.03638C9.92268 3.86977 8.16667 2.11346 6 2.11346C3.83354 2.1137 2.07732 3.86992 2.07708 6.03638C2.07708 8.20304 3.33339 9.95905 6 9.9593V12.0364C2.68625 12.0361 0 9.35018 0 6.03638C0.000243522 2.72278 2.6864 0.0366205 6 0.036377C9.31381 0.036377 11.9998 2.72263 12 6.03638C12 9.35033 9.31396 12.0364 6 12.0364V9.9593C8.16682 9.9593 9.92292 8.2032 9.92292 6.03638Z" fill="#1241AA" />
  </svg>
);

const WhiteRepriseIcon: React.FC = () => (
  <svg width="24" height="9" viewBox="0 0 36 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-5 ml-4 mt-1">
    <path d="M33.9229 6.10925C33.9227 3.94264 32.1667 2.18633 30 2.18633C27.8335 2.18658 26.0773 3.94279 26.0771 6.10925C26.0771 8.27592 27.8334 10.0319 30 10.0322V12.1093C26.6862 12.109 24 9.42306 24 6.10925C24.0002 2.79565 26.6864 0.109496 30 0.109253C33.3138 0.109253 35.9998 2.7955 36 6.10925C36 9.42321 33.314 12.1093 30 12.1093V10.0322C32.1668 10.0322 33.9229 8.27607 33.9229 6.10925Z" fill="#ffffff" />
    <path d="M21 7.98169C21 7.98169 20.4 10.9817 17.9785 10.9817C15.5569 10.9817 15 10.1245 15 10.1245" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <path d="M15 4C15 4 15.6 1 18.0215 1C20.4431 1 21 1.85714 21 1.85714" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <path d="M9.92292 6.03638C9.92268 3.86977 8.16667 2.11346 6 2.11346C3.83354 2.1137 2.07732 3.86992 2.07708 6.03638C2.07708 8.20304 3.33339 9.95905 6 9.9593V12.0364C2.68625 12.0361 0 9.35018 0 6.03638C0.000243522 2.72278 2.6864 0.0366205 6 0.036377C9.31381 0.036377 11.9998 2.72263 12 6.03638C12 9.35033 9.31396 12.0364 6 12.0364V9.9593C8.16682 9.9593 9.92292 8.2032 9.92292 6.03638Z" fill="#ffffff" />
  </svg>
);

const StarRating: React.FC<{ rating: number; totalRatings: number; size?: 'sm' | 'md' }> = ({
  rating,
  totalRatings,
  size = 'md'
}) => {
  const stars = [];
  const starSize = size === 'sm' ? 'text-xs' : 'text-sm';

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        size={size === 'sm' ? 12 : 16}
        className={`${i <= rating ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`}
      />
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      <span className={`text-gray-400 ml-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        ({totalRatings})
      </span>
    </div>
  );
};

const ImageGallery: React.FC<{ images: string[] }> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-4 flex items-center justify-center">
        <span className="text-gray-500">Aucune image disponible</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Image principale */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 mb-4">
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          </>
        )}

        {/* Indicateurs */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Miniatures */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${index === currentIndex ? 'border-blue-600' : 'border-gray-200'
                }`}
            >
              <img
                src={image}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const allParams = useParams() as any;
  const localePrefix = allParams?.locale ? `/${allParams.locale}` : '';
  const { data: productdata, isLoading, error } = useGetOfferByIdQuery(id as string);
  const { currentUser } = useCurrentUser();

  // État du flux de reprise (déclaré avant tout return conditionnel)
  const [isRepriseOpen, setIsRepriseOpen] = useState(false);
  const [repriseStep, setRepriseStep] = useState<1 | 2 | 3>(1);
  const [selectedMyOfferId, setSelectedMyOfferId] = useState<number | null>(null);
  const [customDifference, setCustomDifference] = useState<string>('');
  const [selectedRepriseCategoryIds, setSelectedRepriseCategoryIds] = useState<number[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [searchLocations, { isLoading: isSearchingLocations }] = useSearchLocationsMutation();

  const REGIONS = [
    { value: '', label: 'Sélectionner une région' },
    { value: 'casablanca-settat', label: 'Casablanca-Settat' },
    { value: 'rabat-salé-kénitra', label: 'Rabat-Salé-Kénitra' },
    { value: 'marrakech-safi', label: 'Marrakech-Safi' },
    { value: 'fès-meknès', label: 'Fès-Meknès' },
    { value: 'tanger-tétouan-al-hoceïma', label: 'Tanger-Tétouan-Al Hoceïma' },
    { value: 'oriental', label: 'Oriental' },
    { value: 'béni-mellal-khénifra', label: 'Béni Mellal-Khénifra' },
    { value: 'souss-massa', label: 'Souss-Massa' },
    { value: 'drâa-tafilalet', label: 'Drâa-Tafilalet' },
    { value: 'dakhla-oued-ed-dahab', label: 'Dakhla-Oued Ed-Dahab' },
    { value: 'laâyoune-sakia-el-hamra', label: 'Laâyoune-Sakia El Hamra' },
  ];

  // Commandes déjà effectuées pour ce produit (offre)
  const { data: orderDetailsData } = useGetOrderDetailsQuery({ offerId: id as string, page: 1, limit: 1 });
  const lastOrder = Array.isArray(orderDetailsData?.data) && orderDetailsData.data.length > 0 ? orderDetailsData.data[0] : null;

  const formatOrderDate = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const hhmm = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
    if (diffSec < 60) return `il y a ${diffSec} ${diffSec <= 1 ? 'seconde' : 'secondes'} (${hhmm})`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `il y a ${diffMin === 1 ? '1 minute' : `${diffMin} minutes`} (${hhmm})`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH === 1 ? 'une heure' : `${diffH} heures`}`;
    const diffDays = Math.floor(diffH / 24);
    if (diffDays < 7) return `il y a ${diffDays === 1 ? 'un jour' : `${diffDays} jours`} (${hhmm})`;
    const abs = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    return `le ${abs}`;
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !productdata?.data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement du produit</p>
        </div>
      </div>
    );
  }

  const product = productdata.data;
  const specificData = product.specificData ? JSON.parse(product.specificData) : {};

  // Adapter les images du nouveau format (objets) vers une liste d'URLs, avec l'image principale en premier
  const imageUrls: string[] = Array.isArray(product.images)
    ? [...product.images]
      .sort((a, b) => (a.isMain === b.isMain ? 0 : a.isMain ? -1 : 1))
      .map((img) => img.imageUrl)
    : [];

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <NavBar />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-0.5 bg-gray-800"></div>
          <h1 className="text-2xl font-semibold text-gray-900">Détails du produit</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galerie d'images */}
          <div>
            <ImageGallery images={imageUrls} />

            {/* Description sous l'image */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description || 'Aucune description disponible'}</p>
            </div>
          </div>

          {/* Informations du produit */}
          <div className="space-y-8">
            {/* Informations principales */}
            <div>
              <div className="text-sm text-gray-500 mb-2">{product.category?.name || 'Catégorie non définie'}</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h2>
              <div className="flex items-center gap-4 mb-2">
                <div className="text-2xl font-bold text-gray-900">Valeur :</div>
                <div className="text-2xl font-bold text-green-800">{product.price} DH</div>
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {product.productCondition === 'new' ? 'Neuf' :
                    product.productCondition === 'like_new' ? 'Comme neuf' :
                      product.productCondition === 'good' ? 'Bon état' : 'État correct'}
                </div>
              </div>

              {lastOrder && (
                <div className="mt-8 space-y-3 rounded-xl border px-4 py-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <span className="font-medium">Commande déjà effectuée</span>
                      <span className="text-gray-500">•</span>
                      <span>{formatOrderDate(lastOrder.order.createdAt)}</span>
                    </div>
                  </div>

                  {/* Bandeau style Étape 2: mon produit vs son produit + différence */}
                  <div className="flex items-center justify-center gap-6">
                    {/* Produit de l'autre (cible) */}
                    <div className="relative flex items-center gap-2">
                      <img src={product.images?.[0]?.imageUrl || '/placeholder.png'} alt={product.title} className="w-16 h-16 rounded-lg object-cover border" />
                      <div className="min-w-[140px]">
                        <span className="block text-sm font-medium line-clamp-1">{product.title}</span>
                        <span className="block text-xs text-gray-500">{Number(product.price)} DH</span>
                      </div>
                    </div>
                    <ArrowLeftRight size={24} className="text-blue-600" />
                    {/* Mon produit ou celui de l'autre selon le sens snaps */}
                    {(() => {
                      const p = lastOrder.products || [];
                      // Trouver l'offre autre que celle affichée (product.id)
                      const other = p.map(x => x.offer).find(of => of && of.id !== product.id) || null;
                      const otherSnap = p.find(x => x.offer && x.offer.id !== product.id)?.snapshot || null;
                      if (!other) return (
                        <div className="relative flex items-center gap-2">
                          <div className="w-16 h-16 rounded-lg bg-gray-100 border" />
                          <div className="min-w-[140px]"><span className="block text-sm font-medium line-clamp-1">Produit associé</span><span className="block text-xs text-gray-500">—</span></div>
                        </div>
                      );
                      const img = other.mainImageUrl || '/placeholder.png';
                      const otherPrice = Number(other.price);
                      const myPrice = Number(product.price);
                      const baseDiff = myPrice - otherPrice;
                      const diff = Math.abs(baseDiff);
                      const direction = baseDiff > 0 ? 'recevoir' : baseDiff < 0 ? 'payer' : 'egal';
                      return (
                        <div className="relative flex items-center gap-2">
                          <img src={img} alt={other.title} className="w-16 h-16 rounded-lg object-cover border" />
                          <div className="min-w-[140px]">
                            <span className="block text-sm font-medium line-clamp-1">{other.title}</span>
                            <span className="block text-xs text-gray-500">{otherPrice} DH</span>
                          </div>
                          {direction !== 'egal' && (
                            <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold shadow border ${direction === 'recevoir' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>
                              + {diff} DH
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>


                  {/* Profil de l'expéditeur */}
                  {Array.isArray(lastOrder.participants) && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      {(() => {
                        const sender = lastOrder.participants.find((p: any) => p?.snapshot?.isSender);
                        const avatar = sender?.user?.profileImage || '/placeholder.png';
                        const name = sender?.user ? `${sender.user.firstName || ''} ${sender.user.lastName || ''}`.trim() : (sender?.snapshot?.name || 'Utilisateur');
                        return (
                          <>
                            <img src={avatar} alt={name} className="w-6 h-6 rounded-full object-cover border" />
                            <span>Par {name}</span>
                          </>
                        );
                      })()}
                      {lastOrder.isOrderSender ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">Vous avez déjà fait une commande</span>
                      ) : lastOrder.isProductOwner ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">Commande reçue sur votre produit</span>
                      ) : null}
                    </div>
                  )}
                  <div className="flex justify-center w-full">
                    <button
                      onClick={() => router.push(`${localePrefix}/user/orders/${lastOrder.isOrderSender ? 'sent' : 'received'}?orderid=${lastOrder.order.id}`)}
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto"
                    >
                      Voir la commande
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Informations spécifiques pour les véhicules */}
              {product.listingType === 'vehicle' && specificData && (
                <div className="grid grid-cols-2 gap-4 mt- p-4 bg-gray-50 rounded-lg">
                  {specificData.year && (
                    <div>
                      <span className="text-sm text-gray-500">Année:</span>
                      <span className="ml-2 font-medium">{specificData.year}</span>
                    </div>
                  )}
                  {specificData.mileage && (
                    <div>
                      <span className="text-sm text-gray-500">Kilométrage:</span>
                      <span className="ml-2 font-medium">{specificData.mileage} km</span>
                    </div>
                  )}
                  {specificData.fuel && (
                    <div>
                      <span className="text-sm text-gray-500">Carburant:</span>
                      <span className="ml-2 font-medium">{specificData.fuel}</span>
                    </div>
                  )}
                  {specificData.transmission && (
                    <div>
                      <span className="text-sm text-gray-500">Transmission:</span>
                      <span className="ml-2 font-medium">{specificData.transmission}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section Reprise */}
            {product.repriseCategories && product.repriseCategories.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-semibold text-blue-600"> {product.seller?.firstName} {product.seller?.lastName} veux faire une reprise avec :</span>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2"> les catégories acceptées :</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.repriseCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200"
                      >
                        <img
                          src={category.icon}
                          alt={category.name}
                          className="w-5 h-5 object-contain"
                        />
                        <span className="text-sm font-medium text-gray-700">{category.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Informations du vendeur et du magasin */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Vendeur</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={product.seller?.profileImage || '/default-avatar.png'}
                    alt={product.seller ? `${product.seller.firstName} ${product.seller.lastName}` : 'Vendeur'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {product.seller ? `${product.seller.firstName} ${product.seller.lastName}` : 'Vendeur inconnu'}
                    </h4>
                    {product.seller?.isVerified && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Vérifié</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Membre depuis {product.seller?.createdAt ? new Date(product.seller.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  <MessageCircle size={18} />
                  <span>Message</span>
                </button>
              </div>

              {/* Informations du magasin */}
              {product.store && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Magasin</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">M</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.store.name}</p>
                      <p className="text-sm text-gray-500">{product.store.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${product.store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {product.store.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informations de l'adresse */}
              {product.address && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Localisation de {product.title}</h4>

                  {/* Adresse textuelle */}
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin size={20} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{product.address.addressName}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carte interactive en pleine largeur */}
        {product.address && product.address.coordinates && (
          <div className="mt-12 mb-8">
            <div className="max-w-7xl mx-auto px-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Localisation sur la carte</h3>
              <Map
                latitude={product.address.coordinates.lat}
                longitude={product.address.coordinates.lng}
                title={product.title}
                className="w-full h-80"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bouton de reprise fixe (caché si ce produit est le mien) */}
      {currentUser?.id !== product.sellerId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Plus size={24} className="text-gray-600" />
              </button>
              <span className="text-sm text-gray-600">Ajouter un produit à cette reprise</span>
            </div>
            <button onClick={() => { setIsRepriseOpen(true); setRepriseStep(1); }} className=" flex bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              REPRISE
              <WhiteRepriseIcon />
            </button>
          </div>
        </div>
      )}

      {/* Modal Reprise (extrait en composant) */}
      {currentUser?.id !== product.sellerId && (
        <RepriseOrderModal
          isOpen={isRepriseOpen}
          onClose={() => setIsRepriseOpen(false)}
          target={{ id: product.id, title: product.title, image: imageUrls[0], price: product.price, sellerId: product.sellerId }}
        />
      )}
    </div>
  );
};

export default ProductDetails;