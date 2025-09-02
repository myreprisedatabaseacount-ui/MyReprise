'use client'

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, Image, Code, Palette, Database, Globe, Smartphone, Monitor, Edit3, ArrowRightLeft, Trash2, MoreHorizontal, Plus } from 'lucide-react';

interface SubCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  image: string;
  count: number;
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  image: string;
  count: number;
  subCategories: SubCategory[];
}

const categoriesData: Category[] = [
  {
    id: 'design',
    title: 'Design & Créativité',
    description: 'Outils et ressources pour la création visuelle et l\'expérience utilisateur',
    icon: Palette,
    image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
    count: 156,
    subCategories: [
      {
        id: 'ui-ux',
        title: 'UI/UX Design',
        description: 'Interface utilisateur et expérience utilisateur',
        icon: Monitor,
        image: 'https://images.pexels.com/photos/326508/pexels-photo-326508.jpeg?auto=compress&cs=tinysrgb&w=300',
        count: 45
      },
      {
        id: 'graphics',
        title: 'Design Graphique',
        description: 'Création visuelle et identité de marque',
        icon: Image,
        image: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=300',
        count: 67
      },
      {
        id: 'illustrations',
        title: 'Illustrations',
        description: 'Dessins et créations artistiques numériques',
        icon: Palette,
        image: 'https://images.pexels.com/photos/1194420/pexels-photo-1194420.jpeg?auto=compress&cs=tinysrgb&w=300',
        count: 44
      }
    ]
  },
  {
    id: 'development',
    title: 'Développement',
    description: 'Technologies et frameworks pour le développement d\'applications',
    icon: Code,
    image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=400',
    count: 234,
    subCategories: [
      {
        id: 'frontend',
        title: 'Frontend',
        description: 'Développement d\'interfaces utilisateur modernes',
        icon: Globe,
        image: 'https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=300',
        count: 89
      },
      {
        id: 'backend',
        title: 'Backend',
        description: 'Serveurs, APIs et logique métier',
        icon: Database,
        image: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=300',
        count: 76
      },
      {
        id: 'mobile',
        title: 'Mobile',
        description: 'Applications mobiles iOS et Android',
        icon: Smartphone,
        image: 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=300',
        count: 69
      }
    ]
  },
  {
    id: 'resources',
    title: 'Ressources',
    description: 'Documentation, guides et outils de productivité',
    icon: Folder,
    image: 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=400',
    count: 89,
    subCategories: [
      {
        id: 'documentation',
        title: 'Documentation',
        description: 'Guides techniques et manuels d\'utilisation',
        icon: Folder,
        image: 'https://images.pexels.com/photos/301926/pexels-photo-301926.jpeg?auto=compress&cs=tinysrgb&w=300',
        count: 34
      },
      {
        id: 'templates',
        title: 'Templates',
        description: 'Modèles et structures réutilisables',
        icon: Image,
        image: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=300',
        count: 28
      },
      {
        id: 'tools',
        title: 'Outils',
        description: 'Utilitaires et applications de productivité',
        icon: Code,
        image: 'https://images.pexels.com/photos/574077/pexels-photo-574077.jpeg?auto=compress&cs=tinysrgb&w=300',
        count: 27
      }
    ]
  }
];

interface CategoryCardProps {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (categoryId: string) => void;
  onTransfer: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
  onAddSubCategory: (categoryId: string) => void;
  onEditSubCategory: (subCategoryId: string, parentCategoryId: string) => void;
  onTransferSubCategoryProducts: (subCategoryId: string, parentCategoryId: string) => void;
  onDeleteSubCategory: (subCategoryId: string, parentCategoryId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isExpanded, onToggle, onEdit, onTransfer, onDelete, onAddSubCategory, onEditSubCategory, onTransferSubCategoryProducts, onDeleteSubCategory }) => {
  const Icon = category.icon;

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
            <img 
              src={category.image} 
              alt={category.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute bottom-1 right-1">
              <div className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-md flex items-center justify-center">
                <Icon className="w-3 h-3 text-gray-700" />
              </div>
            </div>
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{category.title}</h3>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {category.count} éléments
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
            <p className="text-sm text-gray-600 leading-relaxed">{category.description}</p>
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
            {category.subCategories.map((subCategory) => {
              const SubIcon = subCategory.icon;
              return (
                <div 
                  key={subCategory.id}
                  className="bg-white p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={subCategory.image} 
                        alt={subCategory.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                      <div className="absolute bottom-0.5 right-0.5">
                        <div className="w-4 h-4 bg-white/90 backdrop-blur-sm rounded-sm flex items-center justify-center">
                          <SubIcon className="w-2 h-2 text-gray-600" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                          {subCategory.title}
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
                        {subCategory.description}
                      </p>
                      <span className="inline-block mt-2 text-xs font-medium text-gray-400">
                        {subCategory.count} items
                      </span>
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
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

  const handleEditCategory = (categoryId: string) => {
    // TODO: Implémenter la logique de modification de catégorie
    console.log('Modifier la catégorie:', categoryId);
    // Ouvrir un modal ou naviguer vers une page de modification
  };

  const handleTransferProducts = (categoryId: string) => {
    // TODO: Implémenter la logique de transfert de produits
    console.log('Transférer les produits de la catégorie:', categoryId);
    // Ouvrir un modal de sélection de catégorie de destination
  };

  const handleDeleteCategory = (categoryId: string) => {
    // TODO: Implémenter la logique de suppression de catégorie
    console.log('Supprimer la catégorie:', categoryId);
    // Afficher une confirmation avant suppression
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      // Logique de suppression
    }
  };

  const handleAddSubCategory = (categoryId: string) => {
    // Redirection vers la page d'ajout de sous-catégorie
    window.location.href = `/back-office/categories/add/${categoryId}`;
  };

  const handleEditSubCategory = (subCategoryId: string, parentCategoryId: string) => {
    // TODO: Implémenter la logique de modification de sous-catégorie
    console.log('Modifier la sous-catégorie:', subCategoryId, 'de la catégorie parent:', parentCategoryId);
    // Ouvrir un modal ou naviguer vers une page de modification
  };

  const handleTransferSubCategoryProducts = (subCategoryId: string, parentCategoryId: string) => {
    // TODO: Implémenter la logique de transfert de produits de sous-catégorie
    console.log('Transférer les produits de la sous-catégorie:', subCategoryId, 'de la catégorie parent:', parentCategoryId);
    // Ouvrir un modal de sélection de catégorie de destination
  };

  const handleDeleteSubCategory = (subCategoryId: string, parentCategoryId: string) => {
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

      {/* Categories Grid */}
      <div className="space-y-4">
        {categoriesData.map((category) => (
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
    </div>
  );
};

export default CategoriesContent;