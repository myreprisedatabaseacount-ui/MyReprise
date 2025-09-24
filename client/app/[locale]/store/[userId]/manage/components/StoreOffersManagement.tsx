import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Eye, Search, Filter, ChevronLeft, ChevronRight, MoreVertical, AlertCircle } from 'lucide-react';
import { useGetOffersBySellerQuery, useUpdateOfferStatusMutation, useDeleteOfferMutation } from '../../../../../../services/api/OfferApi';
import { useGetAllCategoriesQuery } from '../../../../../../services/api/CategoryApi';
import { useProduct } from '../../../../../../services/hooks/useProduct';
import { useCurrentUser } from '../../../../../../services/hooks/useCurrentUser';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../../components/ui/dropdown-menu';
import OfferDetailsDialog from './OfferDetailsDialog';

interface StoreOffersManagementProps {
  userId: string;
}

const StoreOffersManagement: React.FC<StoreOffersManagementProps> = ({ userId }) => {
  const { openCreateProduct } = useProduct();
  const { isAuthenticated } = useCurrentUser();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const itemsPerPage = 10;

  // Mutations
  const [updateOfferStatus] = useUpdateOfferStatusMutation();
  const [deleteOffer] = useDeleteOfferMutation();

  // Récupérer les catégories
  const { data: categoriesData } = useGetAllCategoriesQuery({ language: 'fr' });
  const categories = categoriesData?.data || [];

  // Récupérer les offres du vendeur avec pagination et filtres
  const { data: offersData, isLoading, error } = useGetOffersBySellerQuery({
    sellerId: userId,
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  }, {
    skip: !userId || !isAuthenticated
  });

  const offers = offersData?.data || [];
  const pagination = offersData?.pagination || { totalCount: 0, totalPages: 1, currentPage: 1, limit: 10 };

  // Fonction pour gérer l'ajout d'offre
  const handleAddOffer = () => {
    if (isAuthenticated) {
      openCreateProduct();
    } else {
      // Rediriger vers login si non authentifié
      window.location.href = '/login';
    }
  };

  // Fonction pour gérer la pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fonction pour gérer les changements de statut
  const handleStatusChange = async (offerId: string, newStatus: string) => {
    try {
      await updateOfferStatus({ id: offerId, status: newStatus }).unwrap();
      toast.success(`Statut de l'offre changé vers ${newStatus}`);
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
      if (error?.data?.error) {
        toast.error(error.data.error);
      } else {
        toast.error('Erreur lors du changement de statut');
      }
    }
  };

  // Fonction pour gérer la suppression
  const handleDelete = async (offerId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      try {
        await deleteOffer(offerId).unwrap();
        toast.success('Offre supprimée avec succès');
        // Fermer le dialog après suppression réussie
        setIsDetailsDialogOpen(false);
        setSelectedOffer(null);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // Fonction pour ouvrir le dialog de détails
  const handleViewDetails = (offer: any) => {
    setSelectedOffer(offer);
    setIsDetailsDialogOpen(true);
  };

  // Fonction pour fermer le dialog de détails
  const handleCloseDetails = () => {
    setIsDetailsDialogOpen(false);
    setSelectedOffer(null);
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
            <h2 className="text-2xl font-bold text-gray-900">Gestion des offres</h2>
            <p className="text-gray-600">Gérez vos produits et offres</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des offres...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des offres</h2>
            <p className="text-gray-600">Gérez vos produits et offres</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">Impossible de charger les offres. Veuillez réessayer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des offres</h2>
          <p className="text-gray-600">Gérez vos produits et offres</p>
        </div>
        <button 
          onClick={handleAddOffer}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une offre
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une offre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtre par statut */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="available">Disponible</option>
              <option value="exchanged">Échangé</option>
              <option value="archived">Archivé</option>
            </select>
          </div>

          {/* Filtre par catégorie */}
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameFr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des offres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {offers.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune offre trouvée</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                ? 'Aucune offre ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore d\'offres dans votre store.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
              <button 
                onClick={handleAddOffer}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Ajouter ma première offre
              </button>
            )}
          </div>
        ) : (
          <>
            {/* En-tête du tableau */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Mes Offres</h3>
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
                          className="w-full h-full object-cover rounded-lg"
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
                        <span className="text-lg font-bold text-blue-600">{offer.price} DH</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(offer.status)}`}>
                          {getStatusText(offer.status)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewDetails(offer)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Modifier (bientôt disponible)"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(offer.id, 'available')}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Marquer comme disponible
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(offer.id, 'exchanged')}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Marquer comme échangé
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(offer.id, 'archived')}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                            Archiver
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(offer.id)}
                            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                      <ChevronLeft className="w-4 h-4" />
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
                                ? 'bg-blue-600 text-white'
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
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialog de détails de l'offre */}
      <OfferDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={handleCloseDetails}
        offer={selectedOffer}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default StoreOffersManagement;
