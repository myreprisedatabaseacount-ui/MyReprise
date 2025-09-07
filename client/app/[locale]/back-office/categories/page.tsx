'use client'

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Folder, Image, Code, Palette, Database, Globe, Smartphone, Monitor, Edit3, ArrowRightLeft, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { useGetCategoriesQuery } from '@/services/api/CategoryApi';

// Interface pour les données de l'API
interface ApiCategory {
  id: number;
  name: string;
  description: string;
  image: string | null;
  icon: string | null;
  parentId: number | null;
  gender: 'male' | 'female' | 'mixte';
  ageMin: number;
  ageMax: number;
  listingType: 'item' | 'vehicle' | 'property' | null;
}

interface Category {
  id: number;
  name: string;
  description: string;
  image: string | null;
  icon: string | null;
  parentId: number | null;
  gender: 'male' | 'female' | 'mixte';
  ageMin: number;
  ageMax: number;
  listingType: 'item' | 'vehicle' | 'property' | null;
  children: Category[];
  count?: number;
}

// Fonction pour construire l'arbre des catégories
const buildCategoryTree = (categories: ApiCategory[]): Category[] => {
  const categoryMap = new Map<number, Category>();
  const rootCategories: Category[] = [];

  // Créer un map de toutes les catégories
  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      ...cat,
      children: [],
      count: 0 // On peut calculer le nombre de produits plus tard
    });
  });

  // Construire l'arbre
  categories.forEach(cat => {
    const category = categoryMap.get(cat.id)!;
    if (cat.parentId === null) {
      rootCategories.push(category);
    } else {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(category);
      }
    }
  });

  return rootCategories;
};

// Fonction pour obtenir l'icône par défaut selon le genre
const getDefaultIcon = (gender: 'male' | 'female' | 'mixte') => {
  switch (gender) {
    case 'male':
      return Database;
    case 'female':
      return Palette;
    default:
      return Folder;
  }
};

// Fonction pour obtenir l'icône et le texte du type de listing
const getListingTypeInfo = (listingType: 'item' | 'vehicle' | 'property' | null) => {
  switch (listingType) {
    case 'item':
      return { icon: Code, text: 'Article', color: 'bg-blue-100 text-blue-800' };
    case 'vehicle':
      return { icon: Smartphone, text: 'Véhicule', color: 'bg-green-100 text-green-800' };
    case 'property':
      return { icon: Monitor, text: 'Propriété', color: 'bg-purple-100 text-purple-800' };
    default:
      return { icon: Globe, text: 'Non défini', color: 'bg-gray-100 text-gray-800' };
  }
};

interface CategoryCardProps {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (categoryId: number) => void;
  onTransfer: (categoryId: number) => void;
  onDelete: (categoryId: number) => void;
  onAddSubCategory: (categoryId: number) => void;
  onEditSubCategory: (subCategoryId: number, parentCategoryId: number) => void;
  onTransferSubCategoryProducts: (subCategoryId: number, parentCategoryId: number) => void;
  onDeleteSubCategory: (subCategoryId: number, parentCategoryId: number) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isExpanded, onToggle, onEdit, onTransfer, onDelete, onAddSubCategory, onEditSubCategory, onTransferSubCategoryProducts, onDeleteSubCategory }) => {
  const DefaultIcon = getDefaultIcon(category.gender);
  const listingTypeInfo = getListingTypeInfo(category.listingType);
  const ListingTypeIcon = listingTypeInfo.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Main Category */}
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={onToggle}
      >
        <div className="flex items-start space-x-4">
          {/* Category Image */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            {category.image ? (
              <img 
                src={category.image} 
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <DefaultIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute bottom-1 right-1">
              <div className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center">
                {category.icon ? (
                  <img 
                    src={category.icon} 
                    alt="icon" 
                    className="w-3 h-3"
                  />
                ) : (
                  <DefaultIcon className="w-3 h-3 text-gray-700" />
                )}
              </div>
            </div>
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{category.name}</h3>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {category.ageMin}-{category.ageMax} ans
                </span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {category.gender === 'male' ? 'Homme' : category.gender === 'female' ? 'Femme' : 'Mixte'}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1 ${listingTypeInfo.color}`}>
                  <ListingTypeIcon className="w-3 h-3" />
                  <span>{listingTypeInfo.text}</span>
                </span>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubCategory(category.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-green-50 hover:text-green-600 text-gray-400 transition-colors duration-200"
                    title="Ajouter une sous-catégorie"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(category.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors duration-200"
                    title="Modifier la catégorie"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTransfer(category.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-orange-50 hover:text-orange-600 text-gray-400 transition-colors duration-200"
                    title="Transférer les produits"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(category.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors duration-200"
                    title="Supprimer la catégorie"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className={`p-1 rounded-full transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{category.description || 'Aucune description disponible'}</p>
          </div>
        </div>
      </div>

      {/* Sub Categories */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-out
        ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="px-6 pb-6 pt-2 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.children.map((subCategory) => {
              const SubDefaultIcon = getDefaultIcon(subCategory.gender);
              const subListingTypeInfo = getListingTypeInfo(subCategory.listingType);
              const SubListingTypeIcon = subListingTypeInfo.icon;
              return (
                <div 
                  key={subCategory.id}
                  className="bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      {subCategory.image ? (
                        <img 
                          src={subCategory.image} 
                          alt={subCategory.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                          <SubDefaultIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                      <div className="absolute bottom-0.5 right-0.5">
                        <div className="w-4 h-4 bg-white/90 backdrop-blur-sm rounded-sm flex items-center justify-center">
                          {subCategory.icon ? (
                            <img 
                              src={subCategory.icon} 
                              alt="icon" 
                              className="w-2 h-2"
                            />
                          ) : (
                            <SubDefaultIcon className="w-2 h-2 text-gray-600" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                          {subCategory.name}
                        </h4>
                        
                        {/* SubCategory Action Buttons */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditSubCategory(subCategory.id, category.id);
                            }}
                            className="p-1 rounded hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors duration-200"
                            title="Modifier la sous-catégorie"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTransferSubCategoryProducts(subCategory.id, category.id);
                            }}
                            className="p-1 rounded hover:bg-orange-50 hover:text-orange-600 text-gray-400 transition-colors duration-200"
                            title="Transférer les produits"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSubCategory(subCategory.id, category.id);
                            }}
                            className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors duration-200"
                            title="Supprimer la sous-catégorie"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {subCategory.description || 'Aucune description disponible'}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs font-medium text-gray-400">
                          {subCategory.ageMin}-{subCategory.ageMax} ans
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          {subCategory.gender === 'male' ? 'Homme' : subCategory.gender === 'female' ? 'Femme' : 'Mixte'}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1 ${subListingTypeInfo.color}`}>
                          <SubListingTypeIcon className="w-3 h-3" />
                          <span>{subListingTypeInfo.text}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoriesContent: React.FC = () => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const { data: categoriesResponse, isLoading, error } = useGetCategoriesQuery({});

  // Construire l'arbre des catégories à partir des données de l'API
  const categoriesTree = useMemo(() => {
    if (!categoriesResponse?.data) return [];
    return buildCategoryTree(categoriesResponse.data);
  }, [categoriesResponse]);

  console.log('categoriesResponse', categoriesResponse);
  console.log('categoriesTree', categoriesTree);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleEditCategory = (categoryId: number) => {
    // Naviguer vers la page de modification de catégorie
    window.location.href = `/back-office/categories/edit/${categoryId}`;
  };

  const handleTransferProducts = (categoryId: number) => {
    // TODO: Implémenter la logique de transfert de produits
    console.log('Transférer les produits de la catégorie:', categoryId);
    // Ouvrir un modal de sélection de catégorie de destination
  };

  const handleDeleteCategory = (categoryId: number) => {
    // TODO: Implémenter la logique de suppression de catégorie
    console.log('Supprimer la catégorie:', categoryId);
    // Afficher une confirmation avant suppression
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      // Logique de suppression
    }
  };

  const handleAddSubCategory = (categoryId: number) => {
    // Redirection vers la page d'ajout de sous-catégorie
    window.location.href = `/back-office/categories/add/${categoryId}`;
  };

  const handleEditSubCategory = (subCategoryId: number, parentCategoryId: number) => {
    // Naviguer vers la page de modification de sous-catégorie
    window.location.href = `/back-office/categories/edit/${subCategoryId}`;
  };

  const handleTransferSubCategoryProducts = (subCategoryId: number, parentCategoryId: number) => {
    // TODO: Implémenter la logique de transfert de produits de sous-catégorie
    console.log('Transférer les produits de la sous-catégorie:', subCategoryId, 'de la catégorie parent:', parentCategoryId);
    // Ouvrir un modal de sélection de catégorie de destination
  };

  const handleDeleteSubCategory = (subCategoryId: number, parentCategoryId: number) => {
    // TODO: Implémenter la logique de suppression de sous-catégorie
    console.log('Supprimer la sous-catégorie:', subCategoryId, 'de la catégorie parent:', parentCategoryId);
    // Afficher une confirmation avant suppression
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?')) {
      // Logique de suppression
    }
  };

  const handleAddParentCategory = () => {
    // Redirection vers la page d'ajout de catégorie parent
    window.location.href = '/back-office/categories/add';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Catégories</h1>
            <p className="text-gray-600">Explorez et organisez vos contenus par catégories</p>
          </div>
          <button
            onClick={handleAddParentCategory}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Ajouter une catégorie</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des catégories...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erreur lors du chargement des catégories
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Impossible de charger les catégories. Veuillez réessayer plus tard.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && categoriesTree.length === 0 && (
        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune catégorie</h3>
          <p className="mt-1 text-sm text-gray-500">Commencez par créer votre première catégorie.</p>
          <div className="mt-6">
            <button
              onClick={handleAddParentCategory}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une catégorie
            </button>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {!isLoading && !error && categoriesTree.length > 0 && (
        <div className="space-y-4">
          {categoriesTree.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isExpanded={expandedCategories.has(category.id)}
              onToggle={() => toggleCategory(category.id)}
              onEdit={handleEditCategory}
              onTransfer={handleTransferProducts}
              onDelete={handleDeleteCategory}
              onAddSubCategory={handleAddSubCategory}
              onEditSubCategory={handleEditSubCategory}
              onTransferSubCategoryProducts={handleTransferSubCategoryProducts}
              onDeleteSubCategory={handleDeleteSubCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesContent;