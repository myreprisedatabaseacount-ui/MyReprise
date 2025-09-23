'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Store, Package, Users, TrendingUp, Settings, Star, ShoppingBag, ChevronDown, BarChart3, Info, Eye, Heart, MessageCircle } from 'lucide-react';
import { useCurrentUser } from '../../../../services/hooks/useCurrentUser';
import { useGetStoreInfoQuery } from '../../../../services/api/UserStoreApi';
import { useGetOffersBySellerQuery } from '../../../../services/api/OfferApi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../components/ui/dialog';

interface StorePageProps {
  params: {
    userId: string;
  };
}

const StorePage: React.FC<StorePageProps> = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { currentUser, isAuthenticated } = useCurrentUser();
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  
  // Récupérer les informations du store
  const { data: storeData, isLoading, error } = useGetStoreInfoQuery(userId, {
    skip: !userId
  });

  // Récupérer les offres du vendeur
  const { data: offersData, isLoading: offersLoading, error: offersError } = useGetOffersBySellerQuery(userId, {
    skip: !userId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre store...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Store non trouvé</h2>
          <p className="text-gray-600">Ce store n'existe pas ou vous n'avez pas les permissions.</p>
        </div>
      </div>
    );
  }

  const store = storeData?.data;
  const stats = store?.stats || {};
  const offers = offersData?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="relative h-64 bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden">
        {/* Banner Image */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600">
          {store?.banner ? (
            <img 
              src={store.banner} 
              alt="Store Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <Store className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg opacity-75">Banner du Store</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Store Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-6">
          <div className="max-w-7xl mx-auto flex items-end justify-between">
            <div className="flex items-end gap-4">
              {/* Store Logo */}
              <div className="w-20 h-20 bg-white rounded-lg shadow-lg flex items-center justify-center">
                {store?.logo ? (
                  <img 
                    src={store.logo} 
                    alt="Store Logo" 
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <Store className="w-10 h-10 text-blue-600" />
                )}
              </div>
              
              {/* Store Details */}
              <div className="text-white">
                <h1 className="text-2xl font-bold mb-1">{store?.name || 'Mon Store'}</h1>
                <p className="text-blue-100 mb-2">{store?.description || 'Description du store'}</p>
                
                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.floor(stats.averageRating || 4.8)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-blue-100">({stats.averageRating || 4.8})</span>
                  <span className="text-sm text-blue-200 ml-2">{stats.totalReviews || 0} avis</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Paramètres
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem 
                    onClick={() => router.push(`/store/${userId}/manage`)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Gérer mon store</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push(`/store/${userId}/statistics`)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Statistiques</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsInfoDialogOpen(true)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                    <span>Informations</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Produits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOffers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Visiteurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Commandes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Taux de conversion</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate || 0}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Mes Produits</h3>
            <span className="text-sm text-gray-500">{offers.length} produit{offers.length > 1 ? 's' : ''}</span>
          </div>

          {offersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Chargement des produits...</span>
            </div>
          ) : offersError ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Erreur lors du chargement des produits</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun produit</h4>
              <p className="text-gray-600 mb-4">Vous n'avez pas encore de produits dans votre store</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Ajouter mon premier produit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {offers.map((offer) => (
                <div 
                  key={offer.id} 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedOffer(offer)}
                >
                  {/* Image du produit */}
                  <div className="aspect-square bg-gray-100 relative">
                    {offer.images && offer.images.length > 0 ? (
                      <img 
                        src={offer.images[0].imageUrl} 
                        alt={offer.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Badge de statut */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        offer.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {offer.status === 'available' ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                  </div>

                  {/* Informations du produit */}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{offer.title}</h4>
                    <p className="text-lg font-bold text-blue-600 mb-2">{offer.price} DH</p>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{offer.description}</p>
                    
                    {/* Statistiques rapides */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>0 vues</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>0 favoris</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>0 messages</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Store Information */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du Store</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Store ID: {store?.id || userId}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Statut: {store?.isActive ? 'Actif' : 'Inactif'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Créé le: {new Date(store?.createdAt || Date.now()).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Propriétaire: {store?.user?.firstName} {store?.user?.lastName}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Email: {store?.user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Produits actifs: {stats.activeOffers || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Informations Store */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent onClose={() => setIsInfoDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Informations du Store</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Store ID</p>
                    <p className="text-sm font-semibold text-gray-900">{store?.id || userId}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Statut</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {store?.isActive ? 'Actif' : 'Inactif'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Créé le</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(store?.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Propriétaire</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {store?.user?.firstName} {store?.user?.lastName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-medium text-red-600 uppercase tracking-wide">
                      {currentUser?.authProvider === 'phone' ? 'Téléphone' : 'Email'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {currentUser?.authProvider === 'phone' 
                        ? store?.user?.phone || 'Non disponible'
                        : store?.user?.email || 'Non disponible'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Produits actifs</p>
                    <p className="text-sm font-semibold text-gray-900">{stats.activeOffers || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Statistiques Produit */}
      <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
        <DialogContent onClose={() => setSelectedOffer(null)}>
          <DialogHeader>
            <DialogTitle>Statistiques du Produit</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            {selectedOffer && (
              <>
                {/* Informations du produit */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {selectedOffer.images && selectedOffer.images.length > 0 ? (
                        <img 
                          src={selectedOffer.images[0].imageUrl} 
                          alt={selectedOffer.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{selectedOffer.title}</h3>
                      <p className="text-lg font-bold text-blue-600 mb-2">{selectedOffer.price} DH</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedOffer.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedOffer.status === 'available' ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistiques détaillées */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Vues</p>
                  </div>
                  
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Favoris</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Messages</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <ShoppingBag className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Demandes</p>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Date de création</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedOffer.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Dernière mise à jour</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedOffer.updatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Type de listing</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {selectedOffer.listingType}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StorePage;
