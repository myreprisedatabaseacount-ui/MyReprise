'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Plus, ChevronDown, ChevronRight, Search, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../../../components/ui/dialog';
import { Button } from '../../../../../../components/ui/button';
import { Input } from '../../../../../../components/ui/input';
// import { Textarea } from '../../../../../../components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../../components/ui/select';
import { useUpdateOfferMutation } from '../../../../../../services/api/OfferApi';
import { useGetCategoriesByListingTypeQuery, useGetAllCategoriesQuery } from '../../../../../../services/api/CategoryApi';
import { useGetAllBrandsQuery } from '../../../../../../services/api/BrandApi';
import { useGetAllSubjectsQuery } from '../../../../../../services/api/SubjectApi';
import { useSearchLocationsMutation } from '../../../../../../services/api/AddressApi';
import CategoryFiltersBar from '../../../../../../components/common/CategoryFiltersBar';
import { toast } from 'sonner';
import { compressImageByType } from '../../../../../../utils/imageCompression';

interface EditOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
  onSuccess?: () => void;
}

interface ImageData {
  id?: number;
  imageUrl: string;
  isMain: boolean;
  isNew?: boolean;
  file?: File;
}

interface Characteristic {
  key: string;
  value: string;
}

const EditOfferModal: React.FC<EditOfferModalProps> = ({ isOpen, onClose, offer, onSuccess }) => {
  const [updateOffer, { isLoading }] = useUpdateOfferMutation();
  const [searchLocations, { isLoading: isSearchingLocations }] = useSearchLocationsMutation();
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    productCondition: 'good',
    listingType: 'item',
    categoryId: '',
    brandId: '',
    subjectId: '',
    specificData: {} as any,
  });

  // Images management
  const [images, setImages] = useState<ImageData[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  // Exchange data
  const [exchangeCategories, setExchangeCategories] = useState<number[]>([]);
  const [exchangeBrands, setExchangeBrands] = useState<number[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Category pagination
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLimit, setCategoryLimit] = useState(10);

  // Location search
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationResults, setShowLocationResults] = useState(false);

  // Characteristics
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([]);

  // Brand selection
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState<string>('');
  const [isCustomBrand, setIsCustomBrand] = useState<boolean>(false);
  const [availableBrands, setAvailableBrands] = useState<any[]>([]);

  // Loading states
  const [isUploading, setIsUploading] = useState(false);

  // Queries for dropdowns
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoriesByListingTypeQuery(formData.listingType);
  const { data: allCategoriesData, isLoading: isLoadingAllCategories } = useGetAllCategoriesQuery({
    search: categorySearchTerm || undefined,
    page: categoryPage,
    limit: categoryLimit
  });
  const { data: brandsData } = useGetAllBrandsQuery({ language: 'fr' });
  const { data: subjectsData } = useGetAllSubjectsQuery({ language: 'fr' });

  const categories = categoriesData?.data || [];
  const brands = brandsData?.data?.brands || [];
  const subjects = subjectsData?.data || [];

  // Initialize form data when offer changes
  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        price: offer.price?.toString() || '',
        productCondition: offer.productCondition || 'good',
        listingType: offer.listingType || 'item',
        categoryId: offer.categoryId?.toString() || '',
        brandId: offer.brandId?.toString() || '',
        subjectId: offer.subjectId?.toString() || '',
        specificData: offer.specificData ? 
          (typeof offer.specificData === 'string' ? JSON.parse(offer.specificData) : offer.specificData) 
          : {},
      });

      // Initialize images
      if (offer.images && Array.isArray(offer.images)) {
        setImages(offer.images.map((img: any) => ({
          id: img.id,
          imageUrl: img.imageUrl,
          isMain: img.isMain,
          isNew: false,
        })));
      }

      // Initialize exchange data
      setExchangeCategories(offer.repriseCategories?.map((cat: any) => cat.id) || []);
      setExchangeBrands(offer.exchangeBrands?.map((brand: any) => brand.id) || []);

      // Initialize characteristics
      if (offer.specificData) {
        const specificData = typeof offer.specificData === 'string' ? JSON.parse(offer.specificData) : offer.specificData;
        if (specificData.characteristics) {
          const charArray = Object.entries(specificData.characteristics).map(([key, value]) => ({
            key,
            value: value as string
          }));
          setCharacteristics(charArray.length > 0 ? charArray : [{ key: '', value: '' }]);
        } else {
          setCharacteristics([{ key: '', value: '' }]);
        }
      } else {
        setCharacteristics([{ key: '', value: '' }]);
      }

      // Initialize location
      if (offer.address) {
        setSelectedLocation(offer.address);
        setLocationSearch(offer.address.city);
      }
    }
  }, [offer]);

  // Update available brands when category changes
  useEffect(() => {
    if (formData.categoryId && categoriesData?.data) {
      const selectedCategory = categoriesData.data.find(cat => cat.id === parseInt(formData.categoryId));
      if (selectedCategory?.brands) {
        setAvailableBrands(selectedCategory.brands);
      } else {
        setAvailableBrands([]);
      }
    } else {
      setAvailableBrands([]);
    }
  }, [formData.categoryId, categoriesData?.data]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;

    setIsUploading(true);
    try {
      const compressedFiles: File[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedResult = await compressImageByType(file, { 
          quality: 0.8, 
          maxWidth: 1200, 
          maxHeight: 1200 
        });
        compressedFiles.push(compressedResult.file);
      }

      setNewImages(prev => [...prev, ...compressedFiles]);
      
      // Add to images display
      const newImageData: ImageData[] = compressedFiles.map(file => ({
        imageUrl: URL.createObjectURL(file),
        isMain: false,
        isNew: true,
        file
      }));
      
      setImages(prev => [...prev, ...newImageData]);
      
    } catch (error) {
      console.error('Erreur lors de la compression des images:', error);
      toast.error('Erreur lors de la compression des images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const imageToRemove = images[index];
    
    if (imageToRemove.isNew) {
      // Remove from new images
      setNewImages(prev => prev.filter((_, i) => i !== (index - (images.length - newImages.length))));
    } else if (imageToRemove.id) {
      // Mark existing image for deletion
      setImagesToDelete(prev => [...prev, imageToRemove.id!]);
    }
    
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetMainImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isMain: i === index
    })));
  };

  // Location search functions
  const handleLocationSearch = async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setLocationResults([]);
      setShowLocationResults(false);
      return;
    }

    try {
      const result = await searchLocations(searchTerm).unwrap();
      setLocationResults(result.data || []);
      setShowLocationResults(true);
    } catch (error) {
      console.error('Erreur lors de la recherche de localisation:', error);
      toast.error('Erreur lors de la recherche de localisation');
    }
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    const locationText = location.sector ? `${location.city}, ${location.sector}` : location.city;
    setLocationSearch(locationText);
    setShowLocationResults(false);
  };

  const handleLocationClear = () => {
    setSelectedLocation(null);
    setLocationSearch('');
    setLocationResults([]);
    setShowLocationResults(false);
  };

  // Exchange category functions
  const handleExchangeCategoryToggle = (categoryId: number) => {
    const isSelected = exchangeCategories.includes(categoryId);

    if (isSelected) {
      setExchangeCategories(prev => prev.filter(id => id !== categoryId));
      setExchangeBrands(prev => {
        const category = allCategoriesData?.data?.find(c => c.id === categoryId);
        if (category?.brands) {
          const brandIds = category.brands.map(brand => brand.id);
          return prev.filter(brandId => !brandIds.includes(brandId));
        }
        return prev;
      });
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    } else {
      setExchangeCategories(prev => [...prev, categoryId]);
      setExpandedCategories(prev => new Set([...prev, categoryId]));
    }
  };

  const handleExchangeBrandToggle = (brandId: number) => {
    const isSelected = exchangeBrands.includes(brandId);
    
    if (isSelected) {
      setExchangeBrands(prev => prev.filter(id => id !== brandId));
    } else {
      setExchangeBrands(prev => [...prev, brandId]);
    }
  };

  const toggleCategoryExpansion = (categoryId: number) => {
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

  // Category pagination functions
  const handleCategorySearchChange = (searchTerm: string) => {
    setCategorySearchTerm(searchTerm);
    setCategoryPage(1);
  };

  const handleCategoryPageChange = (page: number) => {
    setCategoryPage(page);
  };

  const handleCategoryLimitChange = (limit: number) => {
    setCategoryLimit(limit);
    setCategoryPage(1);
  };

  // Brand selection functions
  const handleBrandSelect = (brand: any) => {
    setSelectedBrandId(brand.id);
    setSelectedBrandName(brand.name);
    setIsCustomBrand(false);
    handleInputChange('brandId', brand.id.toString());
  };

  const handleCustomBrandSelect = () => {
    setSelectedBrandId(null);
    setSelectedBrandName('');
    setIsCustomBrand(true);
    handleInputChange('brandId', '');
  };

  const handleCustomBrandChange = (brandName: string) => {
    setSelectedBrandName(brandName);
  };

  // Characteristics functions
  const addCharacteristic = () => {
    setCharacteristics(prev => [...prev, { key: '', value: '' }]);
  };

  const removeCharacteristic = (index: number) => {
    if (characteristics.length > 1) {
      setCharacteristics(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateCharacteristic = (index: number, field: 'key' | 'value', value: string) => {
    setCharacteristics(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      toast.error('Au moins une image est obligatoire');
      return;
    }

    try {
      // Build specific data based on listing type
      const validCharacteristics = characteristics.filter(c => c.key.trim() && c.value.trim());
      const characteristicsObj = validCharacteristics.reduce((acc, char) => {
        acc[char.key] = char.value;
        return acc;
      }, {} as Record<string, string>);

      let specificData = { ...formData.specificData };
      
      if (formData.listingType === 'vehicle') {
        specificData = {
          ...specificData,
          characteristics: characteristicsObj
        };
      } else if (formData.listingType === 'item') {
        specificData = {
          ...specificData,
          characteristics: characteristicsObj
        };
      } else if (formData.listingType === 'property') {
        specificData = {
          ...specificData,
          characteristics: characteristicsObj
        };
      }

      const updateData = {
        id: offer.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        status: 'available',
        productCondition: formData.productCondition,
        listingType: formData.listingType,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        brandId: selectedBrandId,
        subjectId: formData.subjectId ? parseInt(formData.subjectId) : null,
        addressId: selectedLocation?.id || null,
        specificData: specificData,
        exchangeCategories: exchangeCategories,
        exchangeBrands: exchangeBrands,
        imagesToDelete: imagesToDelete,
        newImages: newImages,
        existingImages: images.filter(img => !img.isNew).map(img => ({
          id: img.id,
          imageUrl: img.imageUrl,
          isMain: img.isMain
        }))
      };

      console.log('📤 Envoi des données de mise à jour:', updateData);

      await updateOffer(updateData).unwrap();

      toast.success('Offre mise à jour avec succès !');
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();

    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      
      if (error?.data?.error) {
        toast.error('Erreur lors de la mise à jour', {
          description: error.data.details || error.data.error,
        });
      } else {
        toast.error('Erreur lors de la mise à jour de l\'offre');
      }
    }
  };

  if (!isOpen || !offer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-6 [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Modifier l'offre</span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Titre de l'offre"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix (MAD) *
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description de l'offre"
              rows={4}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category and Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              {isLoadingCategories ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Chargement...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleInputChange('categoryId', category.id.toString())}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        formData.categoryId === category.id.toString()
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={category.icon} alt={category.name} className="w-5 h-5" />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marque
              </label>
              {!isCustomBrand ? (
                <div className="relative">
                  <select
                    value={selectedBrandId || ''}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        handleCustomBrandSelect();
                      } else {
                        const brand = availableBrands.find(b => b.id === parseInt(e.target.value));
                        if (brand) handleBrandSelect(brand);
                      }
                    }}
                    disabled={!formData.categoryId}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      !formData.categoryId ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {!formData.categoryId ? 'Sélectionnez d\'abord une catégorie...' : 'Sélectionnez une marque...'}
                    </option>
                    {availableBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                    <option value="custom">Autre...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={selectedBrandName}
                    onChange={(e) => handleCustomBrandChange(e.target.value)}
                    placeholder="Ex: Apple, Samsung..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCustomBrand(false);
                      setSelectedBrandName('');
                      setSelectedBrandId(null);
                    }}
                    className="px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images *
            </label>
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {isUploading ? 'Compression en cours...' : 'Cliquez pour ajouter des images'}
                  </span>
                </label>
              </div>

              {/* Images Display */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.imageUrl}
                        alt={`Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(index)}
                            className={`p-2 rounded-full ${
                              image.isMain ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                            }`}
                            title={image.isMain ? 'Image principale' : 'Définir comme principale'}
                          >
                            {image.isMain ? '✓' : '★'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-2 bg-red-500 text-white rounded-full"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {image.isMain && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Principale
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localisation
            </label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher une ville, région ou secteur..."
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    handleLocationSearch(e.target.value);
                  }}
                  className="pl-10 pr-10"
                />
                {locationSearch && (
                  <button
                    type="button"
                    onClick={handleLocationClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Location Results */}
              {showLocationResults && locationResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {locationResults.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => handleLocationSelect(location)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{location.city}</p>
                          {location.sector && (
                            <p className="text-sm text-gray-500">{location.sector}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isSearchingLocations && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Selected Location */}
            {selectedLocation && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {selectedLocation.city}
                    </p>
                    {selectedLocation.sector && (
                      <p className="text-xs text-green-600">
                        {selectedLocation.sector}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Characteristics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Caractéristiques détaillées
            </label>
            <div className="space-y-3">
              {characteristics.map((char, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Ex: Couleur, Taille, Matériau..."
                      value={char.key}
                      onChange={(e) => updateCharacteristic(index, 'key', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Ex: Rouge, L, Cuir..."
                      value={char.value}
                      onChange={(e) => updateCharacteristic(index, 'value', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCharacteristic(index)}
                    disabled={characteristics.length === 1}
                    className="px-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addCharacteristic}
                className="w-full border-dashed border-2 border-gray-300 hover:border-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une caractéristique
              </Button>
            </div>
          </div>

          {/* Exchange Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Catégories d'échange souhaitées
              <span className="text-gray-500 text-sm font-normal ml-2">
                (Sélectionnez les catégories et marques que vous souhaitez recevoir en échange)
              </span>
            </label>
            
            {/* Category Filters Bar */}
            <CategoryFiltersBar
              searchTerm={categorySearchTerm}
              currentPage={categoryPage}
              totalPages={allCategoriesData?.totalPages || 0}
              limit={categoryLimit}
              onSearchChange={handleCategorySearchChange}
              onPageChange={handleCategoryPageChange}
              onLimitChange={handleCategoryLimitChange}
              totalCount={allCategoriesData?.totalCount || 0}
              isLoading={isLoadingAllCategories}
            />
            
            {isLoadingAllCategories ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Chargement des catégories...</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {allCategoriesData?.data?.map((category) => {
                  const isCategorySelected = exchangeCategories.includes(category.id);
                  const isExpanded = expandedCategories.has(category.id);
                  const hasBrands = category.brands && category.brands.length > 0;
                  
                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <button
                        type="button"
                        onClick={() => handleExchangeCategoryToggle(category.id)}
                        className={`w-full p-3 text-left transition-all ${
                          isCategorySelected
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isCategorySelected
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300'
                            }`}>
                              {isCategorySelected && (
                                <div className="w-2 h-2 bg-white rounded-sm"></div>
                              )}
                            </div>
                            <img src={category.icon} alt={category.name} className="w-5 h-5" />
                            <span className="font-medium text-sm">{category.name}</span>
                            {hasBrands && (
                              <span className="text-xs text-gray-500">
                                ({category.brands.length} marque{category.brands.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                          {hasBrands && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategoryExpansion(category.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded transition-colors duration-200"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          )}
                        </div>
                      </button>

                      {/* Category Brands */}
                      {isExpanded && hasBrands && (
                        <div className="border-t border-gray-200 bg-gray-50 p-3">
                          <div className="grid grid-cols-2 gap-2">
                            {category.brands.map((brand) => {
                              const isBrandSelected = exchangeBrands.includes(brand.id);
                              return (
                                <button
                                  key={brand.id}
                                  type="button"
                                  onClick={() => handleExchangeBrandToggle(brand.id)}
                                  className={`p-2 border rounded-lg text-left transition-all ${
                                    isBrandSelected
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                                      isBrandSelected
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300'
                                    }`}>
                                      {isBrandSelected && (
                                        <div className="w-1 h-1 bg-white rounded-sm"></div>
                                      )}
                                    </div>
                                    {brand.logo && (
                                      <img src={brand.logo} alt={brand.name} className="w-4 h-4 object-contain" />
                                    )}
                                    <span className="text-xs font-medium">{brand.name}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Exchange Summary */}
            {(exchangeCategories.length > 0 || exchangeBrands.length > 0) && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">Sélections d'échange :</div>
                  {exchangeCategories.length > 0 && (
                    <div className="mb-1">
                      <span className="font-medium">Catégories :</span> {exchangeCategories.length}
                    </div>
                  )}
                  {exchangeBrands.length > 0 && (
                    <div>
                      <span className="font-medium">Marques :</span> {exchangeBrands.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isLoading ? 'Mise à jour...' : 'Mettre à jour l\'offre'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditOfferModal;