'use client'

import React, { useState } from 'react';
import { Edit3, Trash2, Plus, Award, Eye, ChevronRight } from 'lucide-react';

// Interfaces pour les données des marques
interface Brand {
  id: number;
  nameAr: string;
  nameFr: string;
  descriptionAr: string;
  descriptionFr: string;
  logo: string;
  categories: string[];
  isActive: boolean;
}

// Données de démonstration
const mockBrands: Brand[] = [
  {
    id: 1,
    nameAr: 'أديداس',
    nameFr: 'Adidas',
    descriptionAr: 'علامة تجارية عالمية للملابس الرياضية والأحذية',
    descriptionFr: 'Marque mondiale de vêtements de sport et de chaussures',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Adidas-Logo.png',
    categories: ['Vêtements', 'Chaussures', 'Sport'],
    isActive: true
  },
  {
    id: 2,
    nameAr: 'نايكي',
    nameFr: 'Nike',
    descriptionAr: 'شركة أمريكية متعددة الجنسيات تصمم وتصنع الأحذية والملابس',
    descriptionFr: 'Société multinationale américaine qui conçoit et fabrique des chaussures et des vêtements',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Nike-Logo.png',
    categories: ['Vêtements', 'Chaussures', 'Sport', 'Fitness'],
    isActive: true
  },
  {
    id: 3,
    nameAr: 'زارا',
    nameFr: 'Zara',
    descriptionAr: 'سلسلة متاجر أزياء إسبانية متخصصة في الأزياء السريعة',
    descriptionFr: 'Chaîne de magasins de mode espagnole spécialisée dans la fast fashion',
    logo: 'https://logos-world.net/wp-content/uploads/2020/09/Zara-Logo.png',
    categories: ['Mode', 'Vêtements', 'Accessoires'],
    isActive: true
  },
  {
    id: 4,
    nameAr: 'سامسونج',
    nameFr: 'Samsung',
    descriptionAr: 'شركة كورية جنوبية متعددة الجنسيات متخصصة في الإلكترونيات',
    descriptionFr: 'Conglomérat sud-coréen spécialisé dans l\'électronique',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Samsung-Logo.png',
    categories: ['Électronique', 'Smartphones', 'Électroménager'],
    isActive: true
  },
  {
    id: 5,
    nameAr: 'أبل',
    nameFr: 'Apple',
    descriptionAr: 'شركة تكنولوجيا أمريكية متعددة الجنسيات',
    descriptionFr: 'Société technologique multinationale américaine',
    logo: 'https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png',
    categories: ['Électronique', 'Smartphones', 'Ordinateurs'],
    isActive: false
  }
];

interface BrandCardProps {
  brand: Brand;
  currentLang: 'ar' | 'fr';
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (brandId: number) => void;
  onDelete: (brandId: number) => void;
}

const BrandCard: React.FC<BrandCardProps> = ({
  brand,
  currentLang,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const brandName = currentLang === 'ar' ? brand.nameAr : brand.nameFr;
  const brandDescription = currentLang === 'ar' ? brand.descriptionAr : brand.descriptionFr;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* En-tête de la marque */}
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={onToggle}
      >
        <div className="flex items-start space-x-4">
          {/* Logo de la marque */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-200">
            <img
              src={brand.logo}
              alt={brandName}
              className="w-full h-full object-contain p-2"
            />
            {!brand.isActive && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white text-xs font-medium bg-red-500 px-2 py-1 rounded">Inactive</span>
              </div>
            )}
          </div>

          {/* Informations de la marque */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-900">{brandName}</h3>
                {brand.isActive && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Boutons d'action */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(brand.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-colors duration-200"
                    title="Modifier la marque"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(brand.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors duration-200"
                    title="Supprimer la marque"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className={`p-1 rounded-full transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-3">{brandDescription}</p>

          </div>
        </div>
      </div>

      {/* Détails étendus */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-out
        ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="px-6 pb-6 pt-2 bg-gray-50/50">
          <div className="space-y-4">
            {/* Catégories */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Catégories</h4>
              <div className="flex flex-wrap gap-2">
                {brand.categories.map((category, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const BrandsContent: React.FC = () => {
  const [brands] = useState<Brand[]>(mockBrands);
  const [expandedBrands, setExpandedBrands] = useState<Set<number>>(new Set());
  const [currentLang, setCurrentLang] = useState<'ar' | 'fr'>('fr');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const toggleBrand = (brandId: number) => {
    setExpandedBrands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brandId)) {
        newSet.delete(brandId);
      } else {
        newSet.add(brandId);
      }
      return newSet;
    });
  };

  const handleEditBrand = (brandId: number) => {
    console.log('Modifier la marque:', brandId);
    // TODO: Naviguer vers la page de modification
  };

  const handleDeleteBrand = (brandId: number) => {
    console.log('Supprimer la marque:', brandId);
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette marque ?')) {
      // TODO: Logique de suppression
    }
  };

  const handleAddBrand = () => {
    // Naviguer vers la page d'ajout de marque
    window.location.href = '/back-office/brands/add';
  };

  // Filtrer les marques selon le statut
  const filteredBrands = brands.filter(brand => {
    if (filterStatus === 'active') return brand.isActive;
    if (filterStatus === 'inactive') return !brand.isActive;
    return true;
  });

  const activeBrandsCount = brands.filter(b => b.isActive).length;
  const inactiveBrandsCount = brands.filter(b => !b.isActive).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Marques</h1>
            <p className="text-gray-600">Gérez les marques et leurs informations</p>
          </div>
          <button
            onClick={handleAddBrand}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Ajouter une marque</span>
          </button>
        </div>

        {/* Contrôles */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Langue:</label>
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value as 'ar' | 'fr')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Statut:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {filteredBrands.length} marque(s) affichée(s)
          </div>
        </div>
      </div>

      {/* Liste des marques */}
      {filteredBrands.length === 0 ? (
        <div className="text-center py-12">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune marque trouvée</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filterStatus === 'all'
              ? 'Commencez par créer votre première marque.'
              : `Aucune marque ${filterStatus === 'active' ? 'active' : 'inactive'} trouvée.`
            }
          </p>
          {filterStatus === 'all' && (
            <div className="mt-6">
              <button
                onClick={handleAddBrand}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une marque
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBrands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              currentLang={currentLang}
              isExpanded={expandedBrands.has(brand.id)}
              onToggle={() => toggleBrand(brand.id)}
              onEdit={handleEditBrand}
              onDelete={handleDeleteBrand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandsContent;