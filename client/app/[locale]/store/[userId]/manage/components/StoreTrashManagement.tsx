import React, { useState } from 'react';
import { Trash2, Search, RotateCcw, AlertCircle, Package } from 'lucide-react';
import { useGetTrashOffersQuery, useRestoreOfferMutation } from '../../../../../../services/api/OfferApi';
import { useCurrentUser } from '../../../../../../services/hooks/useCurrentUser';
import { useDispatch } from 'react-redux';
import { OfferApi } from '../../../../../../services/api/OfferApi';
import { toast } from 'sonner';

interface StoreTrashManagementProps {
  userId: string;
}

const StoreTrashManagement: React.FC<StoreTrashManagementProps> = ({ userId }) => {
  const { isAuthenticated } = useCurrentUser();
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // Mutations
  const [restoreOffer] = useRestoreOfferMutation();

  // Récupérer les offres supprimées
  const { data: trashData, isLoading, error } = useGetTrashOffersQuery({
    sellerId: userId,
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm || undefined,
  }, {
    skip: !userId || !isAuthenticated
  });

  const offers = trashData?.data || [];
  const pagination = trashData?.pagination || { totalCount: 0, totalPages: 1, currentPage: 1, limit: 10 };

  // Fonction pour gérer la pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fonction pour restaurer une offre
  const handleRestore = async (offerId: string) => {
    try {
      await restoreOffer(offerId).unwrap();
      toast.success('Offre restaurée avec succès');
      // Synchroniser le frontend
      dispatch(OfferApi.util.invalidateTags([{ type: 'Offer', id: userId }]));
      dispatch(OfferApi.util.invalidateTags([{ type: 'Offer', id: `trash-${userId}` }]));
    } catch (error: any) {
      console.error('Erreur lors de la restauration:', error);
      toast.error(error?.data?.error || 'Erreur lors de la restauration');
    }
  };


  // Fonction pour obtenir le texte du statut
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

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'exchanged':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Corbeille</h2>
            <p className="text-gray-600">Gérez vos offres supprimées</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">Chargement de la corbeille...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Corbeille</h2>
            <p className="text-gray-600">Gérez vos offres supprimées</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">Impossible de charger la corbeille. Veuillez réessayer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Corbeille</h2>
          <p className="text-gray-600">Gérez vos offres supprimées</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Trash2 className="w-4 h-4" />
          <span>{pagination.totalCount} offre{pagination.totalCount > 1 ? 's' : ''} supprimée{pagination.totalCount > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher dans la corbeille..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Liste des offres supprimées */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {offers.length === 0 ? (
          <div className="p-8 text-center">
            <Trash2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Corbeille vide</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Aucune offre ne correspond à votre recherche dans la corbeille.'
                : 'Aucune offre supprimée pour le moment.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* En-tête du tableau */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Offres supprimées</h3>
                <span className="text-sm text-gray-500">
                  {pagination.totalCount} offre{pagination.totalCount > 1 ? 's' : ''} au total
                </span>
              </div>
            </div>

            {/* Liste des offres */}
            <div className="divide-y divide-gray-200">
              {offers.map((offer) => (
                <div key={offer.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Image de l'offre */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {offer.images && offer.images.length > 0 ? (
                        <img
                          src={offer.images[0].imageUrl}
                          alt={offer.title}
                          className="w-full h-full object-cover rounded-lg opacity-60"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    {/* Informations de l'offre */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-gray-900 truncate">{offer.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{offer.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-lg font-bold text-gray-600">{offer.price} DH</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(offer.status)}`}>
                          {getStatusText(offer.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Supprimée le {new Date(offer.updatedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleRestore(offer.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Restaurer l'offre"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      {/* Bouton de suppression définitive masqué pour le moment */}
                      {/* <button 
                        onClick={() => handleDeletePermanently(offer.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer définitivement"
                      >
                        <X className="w-4 h-4" />
                      </button> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {pagination.currentPage} sur {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              page === pagination.currentPage
                                ? 'bg-red-600 text-white'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StoreTrashManagement;
