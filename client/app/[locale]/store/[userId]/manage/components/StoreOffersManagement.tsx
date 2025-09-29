import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Eye, Search, Filter, ChevronLeft, ChevronRight, MoreVertical, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useGetOffersBySellerQuery, useUpdateOfferStatusMutation, useDeleteOfferMutation, OfferApi } from '../../../../../../services/api/OfferApi';
import { useGetAllCategoriesQuery } from '../../../../../../services/api/CategoryApi';
import { useProduct } from '../../../../../../services/hooks/useProduct';
import { useCurrentUser } from '../../../../../../services/hooks/useCurrentUser';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import CategoryFiltersBar from '../../../../../../components/common/CategoryFiltersBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../../components/ui/dropdown-menu';
import OfferDetailsDialog from './OfferDetailsDialog';
import EditOfferModal from './EditOfferModal';

interface StoreOffersManagementProps {
  userId: string;
}

const StoreOffersManagement: React.FC<StoreOffersManagementProps> = ({ userId }) => {
  const { openCreateProduct } = useProduct();
  const { isAuthenticated } = useCurrentUser();
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [offerToEdit, setOfferToEdit] = useState<any>(null);
  const itemsPerPage = 10;

  // Category pagination states
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLimit, setCategoryLimit] = useState(10);

  // Section visibility states
  const [isCategoryFiltersExpanded, setIsCategoryFiltersExpanded] = useState(false);
  const [isOfferSearchExpanded, setIsOfferSearchExpanded] = useState(false);

  // Mutations
  const [updateOfferStatus] = useUpdateOfferStatusMutation();
  const [deleteOffer] = useDeleteOfferMutation();

  // Récupérer les catégories avec pagination
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetAllCategoriesQuery({
    search: categorySearchTerm || undefined,
    page: categoryPage,
    limit: categoryLimit,
    language: 'fr'
  });
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
      toast.success(`Statut de l'offre changé vers ${getStatusText(newStatus)}`);
      
      // Synchroniser le frontend : forcer un refetch des données
      dispatch(OfferApi.util.invalidateTags([{ type: 'Offer', id: userId }]));
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ? Elle sera déplacée vers la corbeille.')) {
      try {
        await deleteOffer(offerId).unwrap();
        toast.success('Offre supprimée avec succès');
        // Fermer le dialog après suppression réussie
        setIsDetailsDialogOpen(false);
        setSelectedOffer(null);
        // Synchroniser le frontend : forcer un refetch des données
        dispatch(OfferApi.util.invalidateTags([{ type: 'Offer', id: userId }]));
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

  const handleEditOffer = (offer: any) => {
    setOfferToEdit(offer);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setOfferToEdit(null);
  };

  const handleEditSuccess = () => {
    // Synchroniser le frontend : forcer un refetch des données
    dispatch(OfferApi.util.invalidateTags([{ type: 'Offer', id: userId }]));
  };

  // Fonctions de gestion de la pagination des catégories
  const handleCategorySearchChange = (searchTerm: string) => {
    setCategorySearchTerm(searchTerm);
    setCategoryPage(1); // Reset à la première page lors de la recherche
  };

  const handleCategoryPageChange = (page: number) => {
    setCategoryPage(page);
  };

  const handleCategoryLimitChange = (limit: number) => {
    setCategoryLimit(limit);
    setCategoryPage(1); // Reset à la première page lors du changement de limite
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

      {/* Section 1: Filtres de catégories */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header avec bouton de collapse */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Filtrer par catégorie</h3>
              <p className="text-sm text-gray-600">Sélectionnez une catégorie pour filtrer vos offres</p>
            </div>
            <button
              onClick={() => setIsCategoryFiltersExpanded(!isCategoryFiltersExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {isCategoryFiltersExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Masquer
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Afficher
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contenu collapsible */}
        {isCategoryFiltersExpanded && (
          <div className="p-4">
        
            {/* Barre de filtres pour les catégories */}
            <CategoryFiltersBar
              searchTerm={categorySearchTerm}
              currentPage={categoryPage}
              totalPages={categoriesData?.totalPages || 0}
              limit={categoryLimit}
              onSearchChange={handleCategorySearchChange}
              onPageChange={handleCategoryPageChange}
              onLimitChange={handleCategoryLimitChange}
              totalCount={categoriesData?.totalCount || 0}
              isLoading={isLoadingCategories}
            />

            {/* Liste des catégories avec sélection */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Toutes les catégories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setCategoryFilter(category.id.toString())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      categoryFilter === category.id.toString()
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <img src={category.icon} alt={category.name} className="w-4 h-4" />
                    {category.nameFr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Recherche et filtres d'offres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header avec bouton de collapse */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Rechercher et filtrer vos offres</h3>
              <p className="text-sm text-gray-600">Trouvez rapidement l'offre que vous cherchez</p>
            </div>
            <button
              onClick={() => setIsOfferSearchExpanded(!isOfferSearchExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {isOfferSearchExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Masquer
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Afficher
                </>
              )}
            </button>
          </div>
        </div>

        {/* Contenu collapsible */}
        {isOfferSearchExpanded && (
          <div className="p-4">
        
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche d'offres */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher une offre
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Titre, description, prix..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtre par statut */}
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut de l'offre
                </label>
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
            </div>

            {/* Indicateurs de filtres actifs */}
            {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Filtres actifs :</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Recherche: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Statut: {getStatusText(statusFilter)}
                      <button
                        onClick={() => setStatusFilter('all')}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {categoryFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Catégorie: {categories.find(c => c.id.toString() === categoryFilter)?.nameFr || 'Inconnue'}
                      <button
                        onClick={() => setCategoryFilter('all')}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Effacer tous les filtres
                </button>
              </div>
            )}
          </div>
        )}
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
                              onClick={() => handleEditOffer(offer)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Modifier l'offre"
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
                            disabled={offer.status === 'available'}
                            className={`flex items-center gap-2 ${
                              offer.status === 'available' 
                                ? 'cursor-not-allowed opacity-50 bg-green-50 text-green-700' 
                                : 'cursor-pointer hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              offer.status === 'available' ? 'bg-green-600' : 'bg-green-500'
                            }`}></div>
                            {offer.status === 'available' ? '✓ Disponible' : 'Marquer comme disponible'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(offer.id, 'archived')}
                            disabled={offer.status === 'archived'}
                            className={`flex items-center gap-2 ${
                              offer.status === 'archived' 
                                ? 'cursor-not-allowed opacity-50 bg-gray-50 text-gray-700' 
                                : 'cursor-pointer hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              offer.status === 'archived' ? 'bg-gray-600' : 'bg-gray-500'
                            }`}></div>
                            {offer.status === 'archived' ? '✓ Archivé' : 'Archiver'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(offer.id)}
                            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50"
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

            {/* Modal de modification d'offre */}
            <EditOfferModal
              isOpen={isEditModalOpen}
              onClose={handleCloseEditModal}
              offer={offerToEdit}
              onSuccess={handleEditSuccess}
            />
          </div>
        );
      }

export default StoreOffersManagement;
