import React from 'react';
import { X, Package, Calendar, User, Tag, Award, RefreshCw, AlertCircle, MapPin, Car, Home, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../../../components/ui/dialog';
import { Badge } from '../../../../../../components/ui/badge';
import { Button } from '../../../../../../components/ui/button';

interface OfferDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
  onStatusChange: (offerId: string, newStatus: string) => void;
  onDelete: (offerId: string) => void;
}

const OfferDetailsDialog: React.FC<OfferDetailsDialogProps> = ({
  isOpen,
  onClose,
  offer,
  onStatusChange,
  onDelete
}) => {
  if (!offer) return null;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'exchanged':
        return 'Échangé';
      case 'archived':
        return 'Archivé';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'exchanged':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isExchanged = offer.replacedByOfferId !== null && offer.replacedByOfferId !== undefined;
  const canChangeStatus = !isExchanged;

  // Fonction pour parser les données spécifiques
  const parseSpecificData = (specificData: string) => {
    try {
      return JSON.parse(specificData);
    } catch {
      return null;
    }
  };

  const specificData = parseSpecificData(offer.specificData);

  // Fonction pour obtenir l'icône selon le type de listing
  const getListingIcon = (listingType: string) => {
    switch (listingType) {
      case 'vehicle':
        return <Car className="w-5 h-5" />;
      case 'property':
        return <Home className="w-5 h-5" />;
      case 'item':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  // Fonction pour formater la condition du produit
  const formatCondition = (condition: string) => {
    const conditions = {
      'like_new': 'Comme neuf',
      'good': 'Bon état',
      'fair': 'État correct',
      'poor': 'État usé'
    };
    return conditions[condition as keyof typeof conditions] || condition;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 [&>button]:hidden" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getListingIcon(offer.listingType)}
              Détails de l'offre
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image et informations principales */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Image */}
            <div className="lg:w-1/3">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {offer.images && offer.images.length > 0 ? (
                  <img
                    src={offer.images[0].imageUrl}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Galerie d'images supplémentaires */}
              {offer.images && offer.images.length > 1 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {offer.images.slice(1, 4).map((image: any, index: number) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt={`${offer.title} ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Informations principales */}
            <div className="lg:w-2/3 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{offer.title}</h2>
                <p className="text-gray-600 text-lg">{offer.description}</p>
                
                {/* Plus de détails - characteristics */}
                {specificData && specificData.characteristics && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Plus de détails :</h4>
                    <div className="space-y-1">
                      {Object.entries(specificData.characteristics).map(([key, value]) => (
                        <div key={key} className="flex text-sm">
                          <span className="font-medium text-gray-600 w-32">{key} :</span>
                          <span className="text-gray-900">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-blue-600">{offer.price} DH</span>
                <Badge className={`px-3 py-1 text-sm font-medium border ${getStatusColor(offer.status)}`}>
                  {getStatusText(offer.status)}
                </Badge>
              </div>

              {/* Message d'échange */}
              {isExchanged && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-900">Article échangé</h4>
                      <p className="text-orange-700 text-sm mt-1">
                        Cet article a été échangé et n'est plus disponible dans votre store.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informations détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Informations de base
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Créé le :</span>
                  <span className="text-sm font-medium">
                    {new Date(offer.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Vendeur :</span>
                  <span className="text-sm font-medium">
                    {offer.seller ? `${offer.seller.firstName} ${offer.seller.lastName}` : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Condition :</span>
                  <span className="text-sm font-medium">{formatCondition(offer.productCondition)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Type :</span>
                  <span className="text-sm font-medium capitalize">{offer.listingType || 'N/A'}</span>
                </div>

                {offer.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Localisation :</span>
                    <span className="text-sm font-medium">{offer.address.city}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Catégorie, Marque, Sujet */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Classification
              </h3>
              
              <div className="space-y-3">
                {offer.category && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Catégorie :</span>
                    <Badge variant="outline" className="text-xs">
                      {offer.category.nameFr || offer.category.name || 'N/A'}
                    </Badge>
                  </div>
                )}

                {offer.brand && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Marque :</span>
                    <Badge variant="outline" className="text-xs">
                      {offer.brand.name || 'N/A'}
                    </Badge>
                  </div>
                )}

                {offer.subject && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Sujet :</span>
                    <Badge variant="outline" className="text-xs">
                      {offer.subject.name || 'N/A'}
                    </Badge>
                  </div>
                )}

                {!offer.category && !offer.brand && !offer.subject && (
                  <p className="text-sm text-gray-500 italic">Aucune classification disponible</p>
                )}
              </div>
            </div>
          </div>

          {/* Données spécifiques selon le type de listing */}
          {specificData && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {getListingIcon(offer.listingType)}
                Détails spécifiques
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                {offer.listingType === 'vehicle' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {specificData.year && (
                      <div>
                        <span className="text-sm text-gray-600">Année :</span>
                        <p className="font-medium">{specificData.year}</p>
                      </div>
                    )}
                    {specificData.brand && (
                      <div>
                        <span className="text-sm text-gray-600">Marque :</span>
                        <p className="font-medium">{specificData.brand}</p>
                      </div>
                    )}
                    {specificData.model && (
                      <div>
                        <span className="text-sm text-gray-600">Modèle :</span>
                        <p className="font-medium">{specificData.model}</p>
                      </div>
                    )}
                    {specificData.mileage && (
                      <div>
                        <span className="text-sm text-gray-600">Kilométrage :</span>
                        <p className="font-medium">{specificData.mileage.toLocaleString()} km</p>
                      </div>
                    )}
                    {specificData.fuel && (
                      <div>
                        <span className="text-sm text-gray-600">Carburant :</span>
                        <p className="font-medium capitalize">{specificData.fuel}</p>
                      </div>
                    )}
                    {specificData.transmission && (
                      <div>
                        <span className="text-sm text-gray-600">Transmission :</span>
                        <p className="font-medium capitalize">{specificData.transmission}</p>
                      </div>
                    )}
                    {specificData.color && (
                      <div>
                        <span className="text-sm text-gray-600">Couleur :</span>
                        <p className="font-medium capitalize">{specificData.color}</p>
                      </div>
                    )}
                  </div>
                )}

                {offer.listingType === 'property' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {specificData.propertyType && (
                      <div>
                        <span className="text-sm text-gray-600">Type :</span>
                        <p className="font-medium capitalize">{specificData.propertyType}</p>
                      </div>
                    )}
                    {specificData.area && (
                      <div>
                        <span className="text-sm text-gray-600">Surface :</span>
                        <p className="font-medium">{specificData.area} m²</p>
                      </div>
                    )}
                    {specificData.rooms && (
                      <div>
                        <span className="text-sm text-gray-600">Pièces :</span>
                        <p className="font-medium">{specificData.rooms}</p>
                      </div>
                    )}
                    {specificData.bathrooms && (
                      <div>
                        <span className="text-sm text-gray-600">Salles de bain :</span>
                        <p className="font-medium">{specificData.bathrooms}</p>
                      </div>
                    )}
                    {specificData.floor && (
                      <div>
                        <span className="text-sm text-gray-600">Étage :</span>
                        <p className="font-medium">{specificData.floor}</p>
                      </div>
                    )}
                    {specificData.constructionYear && (
                      <div>
                        <span className="text-sm text-gray-600">Année de construction :</span>
                        <p className="font-medium">{specificData.constructionYear}</p>
                      </div>
                    )}
                    <div className="col-span-2 md:col-span-3">
                      <span className="text-sm text-gray-600">Équipements :</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {specificData.hasElevator && <Badge variant="outline">Ascenseur</Badge>}
                        {specificData.hasParking && <Badge variant="outline">Parking</Badge>}
                        {specificData.hasGarden && <Badge variant="outline">Jardin</Badge>}
                        {specificData.hasBalcony && <Badge variant="outline">Balcon</Badge>}
                      </div>
                    </div>
                  </div>
                )}

                {offer.listingType === 'item' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {specificData.name && (
                      <div>
                        <span className="text-sm text-gray-600">Nom :</span>
                        <p className="font-medium">{specificData.name}</p>
                      </div>
                    )}
                    {specificData.brand && (
                      <div>
                        <span className="text-sm text-gray-600">Marque :</span>
                        <p className="font-medium">{specificData.brand}</p>
                      </div>
                    )}
                    {specificData.material && (
                      <div>
                        <span className="text-sm text-gray-600">Matériau :</span>
                        <p className="font-medium capitalize">{specificData.material}</p>
                      </div>
                    )}
                    {specificData.color && (
                      <div>
                        <span className="text-sm text-gray-600">Couleur :</span>
                        <p className="font-medium capitalize">{specificData.color}</p>
                      </div>
                    )}
                    {specificData.size && (
                      <div>
                        <span className="text-sm text-gray-600">Taille :</span>
                        <p className="font-medium">{specificData.size}</p>
                      </div>
                    )}
                    {specificData.weight && (
                      <div>
                        <span className="text-sm text-gray-600">Poids :</span>
                        <p className="font-medium">{specificData.weight} kg</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Offre de remplacement */}
          {isExchanged && offer.replacedByOffer && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Offre de remplacement
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                    {offer.replacedByOffer.images && offer.replacedByOffer.images.length > 0 ? (
                      <img
                        src={offer.replacedByOffer.images[0].imageUrl}
                        alt={offer.replacedByOffer.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{offer.replacedByOffer.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{offer.replacedByOffer.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold text-blue-600">{offer.replacedByOffer.price} DH</span>
                      <Badge className={`px-2 py-1 text-xs font-medium ${getStatusColor(offer.replacedByOffer.status)}`}>
                        {getStatusText(offer.replacedByOffer.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Actions */}
        <div className="pt-6 border-t border-gray-200">
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ? Elle sera déplacée vers la corbeille.')) {
                onDelete(offer.id);
              }
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Supprimer cette offre
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferDetailsDialog;
