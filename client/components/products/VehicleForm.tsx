'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

import { ArrowLeft, Car, Bike, Truck, Anchor, Save, X, MapPin, Search, Map, User, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import CategoryFiltersBar from '../common/CategoryFiltersBar';
import { useProduct } from '../../services/hooks/useProduct';
import { useCreateOfferMutation } from '../../services/api/OfferApi';
import { useSearchLocationsMutation } from '../../services/api/AddressApi';
import { useGetCategoriesByListingTypeQuery, useGetAllCategoriesQuery } from '../../services/api/CategoryApi';
import { useCurrentUser, useUserDisplay } from '../../services/hooks/useCurrentUser';
import MultipleImageUpload from './MultipleImageUpload';
import OpenStreetMap from '../ui/OpenStreetMap';
import { toast } from 'sonner';
import * as Yup from 'yup';

interface VehicleFormProps {
  onBack?: () => void;
  onClose?: () => void;
}

interface Characteristic {
  key: string;
  value: string;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onBack, onClose }) => {
  const { updateData, setStep } = useProduct();
  const [createOffer, { isLoading }] = useCreateOfferMutation();
  const [searchLocations, { isLoading: isSearchingLocations }] = useSearchLocationsMutation();
  const { currentUser, isAuthenticated } = useCurrentUser();
  const { displayName, initials, fullName } = useUserDisplay();
  
  // États pour la pagination des catégories d'échange
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLimit, setCategoryLimit] = useState(10);
  
  // Récupérer les catégories pour les véhicules
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoriesByListingTypeQuery('vehicle');
  // Récupérer toutes les catégories pour les échanges avec pagination
  const { data: allCategoriesData, isLoading: isLoadingAllCategories } = useGetAllCategoriesQuery({
    search: categorySearchTerm || undefined,
    page: categoryPage,
    limit: categoryLimit
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // États pour les catégories d'échange
  const [selectedExchangeCategories, setSelectedExchangeCategories] = useState<number[]>([]);
  const [selectedExchangeBrands, setSelectedExchangeBrands] = useState<number[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  
  // États pour la sélection de marque
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState<string>('');
  const [isCustomBrand, setIsCustomBrand] = useState<boolean>(false);
  const [availableBrands, setAvailableBrands] = useState<any[]>([]);

  // États pour la recherche de localisation
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationResults, setShowLocationResults] = useState(false);

  // États pour les caractéristiques détaillées
  const [characteristics, setCharacteristics] = useState<Characteristic[]>([
    { key: '', value: '' }
  ]);

  // Valeurs initiales
  const initialValues = {
    categoryId: '',
    year: new Date().getFullYear(),
    brand: '',
    model: '',
    mileage: '',
    value: '',
    description: '',
    productCondition: 'good',
    images: [],
    location: null,
  };

  const [formValues, setFormValues] = useState(initialValues);

  // Schéma de validation pour véhicule
  const vehicleSchema = Yup.object({
    categoryId: Yup.number(),
    year: Yup.number()
      .min(1900, 'Année invalide')
      .max(new Date().getFullYear() + 1, 'Année invalide'),
    brand: Yup.string(),
    model: Yup.string(),
    mileage: Yup.string()
      .test('is-number', 'Le kilométrage doit être un nombre', (value) => {
        if (!value) return true; // Optionnel
        const num = Number(value);
        return !isNaN(num) && num >= 300 && num <= 1000000;
      }),
    value: Yup.string()
      .required('La valeur est obligatoire')
      .test('is-number', 'La valeur doit être un nombre', (value) => {
        if (!value) return false;
        const num = Number(value);
        return !isNaN(num) && num > 0;
      }),
    description: Yup.string()
      .min(20, 'La description doit contenir au moins 20 caractères')
      .max(2000, 'La description ne peut pas dépasser 2000 caractères'),
    productCondition: Yup.string()
      .oneOf(['new', 'like_new', 'good', 'fair'], 'État invalide'),
  });


  // Gestion des images via le composant MultipleImageUpload
  const handleImagesChange = (files: File[]) => {
    setImageFiles(files);
  };

  // Fonction de recherche de localisation
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

  // Fonction pour sélectionner une localisation
  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    const locationText = location.sector ? `${location.city}, ${location.sector}` : location.city;
    setLocationSearch(locationText);
    setShowLocationResults(false);
  };

  // Fonction pour effacer la sélection de localisation
  const handleLocationClear = () => {
    setSelectedLocation(null);
    setLocationSearch('');
    setLocationResults([]);
    setShowLocationResults(false);
  };

  // Gestion des caractéristiques détaillées
  const addCharacteristic = () => {
    setCharacteristics([...characteristics, { key: '', value: '' }]);
  };

  const removeCharacteristic = (index: number) => {
    if (characteristics.length > 1) {
      setCharacteristics(characteristics.filter((_, i) => i !== index));
    }
  };

  const updateCharacteristic = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...characteristics];
    updated[index][field] = value;
    setCharacteristics(updated);
  };

  // Fonction pour gérer la sélection des catégories d'échange
  const handleExchangeCategoryToggle = (categoryId: number) => {
    const isSelected = selectedExchangeCategories.includes(categoryId);

    if (isSelected) {
      // Désélectionner la catégorie et ses marques
      setSelectedExchangeCategories(prev => prev.filter(id => id !== categoryId));
      setSelectedExchangeBrands(prev => {
        // Trouver les marques de cette catégorie et les retirer
        const category = allCategoriesData?.data?.find(c => c.id === categoryId);
        if (category?.brands) {
          const brandIds = category.brands.map(brand => brand.id);
          return prev.filter(brandId => !brandIds.includes(brandId));
        }
        return prev;
      });
      // Fermer l'expansion de la catégorie
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    } else {
      // Sélectionner la catégorie
      setSelectedExchangeCategories(prev => [...prev, categoryId]);
      // Ouvrir l'expansion pour voir les marques
      setExpandedCategories(prev => new Set([...prev, categoryId]));
    }
  };

  // Fonction pour gérer la sélection des marques d'échange
  const handleExchangeBrandToggle = (brandId: number) => {
    const isSelected = selectedExchangeBrands.includes(brandId);
    
    if (isSelected) {
      setSelectedExchangeBrands(prev => prev.filter(id => id !== brandId));
    } else {
      setSelectedExchangeBrands(prev => [...prev, brandId]);
    }
  };

  // Fonctions de gestion de la pagination des catégories d'échange
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

  // Fonction pour basculer l'expansion d'une catégorie
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

  // Synchroniser currentPhotoIndex avec imageFiles
  useEffect(() => {
    if (imageFiles.length === 0) {
      setCurrentPhotoIndex(0);
    } else if (currentPhotoIndex >= imageFiles.length) {
      setCurrentPhotoIndex(imageFiles.length - 1);
    }
  }, [imageFiles, currentPhotoIndex]);

  // Mettre à jour les marques disponibles quand la catégorie principale change
  useEffect(() => {
    if (formValues.categoryId && categoriesData?.data) {
      const selectedCategory = categoriesData.data.find(cat => cat.id === formValues.categoryId);
      if (selectedCategory?.brands) {
        setAvailableBrands(selectedCategory.brands);
      } else {
        setAvailableBrands([]);
      }
      // Réinitialiser la sélection de marque
      setSelectedBrandId(null);
      setSelectedBrandName('');
      setIsCustomBrand(false);
    } else {
      setAvailableBrands([]);
      setSelectedBrandId(null);
      setSelectedBrandName('');
      setIsCustomBrand(false);
    }
  }, [formValues.categoryId, categoriesData?.data]);

  // Mettre à jour l'aperçu quand les champs de titre changent
  useEffect(() => {
    handleFormChange(formValues);
  }, [selectedBrandName, formValues.model, formValues.year, formValues.description, formValues.value, formValues.productCondition, formValues.mileage, imageFiles, selectedLocation]);

  // Fonction pour gérer la sélection d'une marque de la liste
  const handleBrandSelect = (brand: any) => {
    setSelectedBrandId(brand.id);
    setSelectedBrandName(brand.name);
    setIsCustomBrand(false);
  };

  // Fonction pour gérer la sélection "Autre"
  const handleCustomBrandSelect = () => {
    setSelectedBrandId(null);
    setSelectedBrandName('');
    setIsCustomBrand(true);
  };

  // Fonction pour gérer la saisie manuelle de marque
  const handleCustomBrandChange = (brandName: string) => {
    setSelectedBrandName(brandName);
  };

  // Fonction pour publier l'offre
  const handlePublishOffer = async (values: typeof initialValues) => {
    console.log('values', values);
    
    if (imageFiles.length === 0) {
      toast.error('Au moins une photo est obligatoire');
      return;
    }

    // Validation de la localisation (optionnelle)
    // if (!selectedLocation) {
    //   toast.error('Veuillez sélectionner une localisation');
    //   return;
    // }

    // Valider les caractéristiques (optionnelles)
    const validCharacteristics = characteristics.filter(c => c.key.trim() && c.value.trim());

    try {
      // Construire le titre pour l'offre
      const title = selectedBrandName && values.model && values.year 
        ? `${selectedBrandName} ${values.model} (${values.year})`
        : selectedBrandName && values.model
        ? `${selectedBrandName} ${values.model}`
        : selectedBrandName || values.model || values.year
        ? `${selectedBrandName || values.model || values.year}`
        : 'Véhicule à vendre';

      // Construire les caractéristiques en objet
      const characteristicsObj = validCharacteristics.reduce((acc, char) => {
        acc[char.key] = char.value;
        return acc;
      }, {} as Record<string, string>);

      // Données spécifiques au véhicule
      const specificData = {
        year: values.year,
        brand: selectedBrandName,
        model: values.model,
        mileage: Number(values.mileage),
        fuel: 'essence', // Valeur par défaut
        transmission: 'manuelle', // Valeur par défaut
        color: 'blanc', // Valeur par défaut
        characteristics: characteristicsObj
      };

      // Préparer les données pour l'API
      const apiData = {
        title: title,
        description: values.description,
        price: Number(values.value),
        status: 'available',
        productCondition: values.productCondition,
        listingType: 'vehicle',
        sellerId: currentUser?.id || 1,
        categoryId: values.categoryId,
        brandId: selectedBrandId, // Ajouter le brandId principal
        addressId: selectedLocation?.id || null,
        specificData: specificData,
        exchangeCategories: selectedExchangeCategories || [], // Catégories d'échange sélectionnées
        exchangeBrands: selectedExchangeBrands || [], // Marques d'échange sélectionnées
        images: imageFiles
      };

      console.log('📤 Envoi des données offre véhicule:', apiData);
      console.log('🔍 Debug - selectedExchangeCategories:', selectedExchangeCategories);
      console.log('🔍 Debug - selectedExchangeBrands:', selectedExchangeBrands);

      const result = await createOffer(apiData).unwrap();

      console.log('✅ Offre créée avec succès:', result);

      toast.success('Offre créée avec succès !', {
        description: `Votre véhicule "${result.data?.title || title}" est maintenant en ligne avec les catégories d'échange sélectionnées.`,
        duration: 4000,
      });

      // Fermer le formulaire après création
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);

    } catch (error: any) {
      console.error('❌ Erreur lors de la création:', error);

      if (error?.data?.error) {
        toast.error('Erreur lors de la création', {
          description: error.data.details || error.data.error,
          duration: 6000,
        });
      } else if (error?.data?.details) {
        toast.error('Erreur de validation', {
          description: error.data.details,
          duration: 6000,
        });
      } else {
        toast.error('Erreur inattendue', {
          description: 'Une erreur est survenue lors de la création du véhicule',
          duration: 6000,
        });
      }
    }
  };

  // Fonction pour mettre à jour l'aperçu
  const handleFormChange = (values: typeof initialValues) => {
    const title = selectedBrandName && values.model && values.year 
      ? `${selectedBrandName} ${values.model} (${values.year})`
      : selectedBrandName && values.model
      ? `${selectedBrandName} ${values.model}`
      : selectedBrandName || values.model || values.year
      ? `${selectedBrandName || values.model || values.year}`
      : 'Véhicule à vendre';

    const validCharacteristics = characteristics.filter(c => c.key.trim() && c.value.trim());
    const characteristicsObj = validCharacteristics.reduce((acc, char) => {
      acc[char.key] = char.value;
      return acc;
    }, {} as Record<string, string>);

    const specificData = {
      year: values.year,
      brand: selectedBrandName,
      model: values.model,
      mileage: Number(values.mileage),
      fuel: 'essence', // Valeur par défaut
      transmission: 'manuelle', // Valeur par défaut
      color: 'blanc', // Valeur par défaut
      characteristics: characteristicsObj
    };

    const offerData = {
      title: title,
      description: values.description,
      price: Number(values.value),
      status: 'available',
      productCondition: values.productCondition,
      listingType: 'vehicle',
      images: imageFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })),
      specificData: specificData,
      addressId: selectedLocation?.id
    };
    updateData(offerData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-7xl bg-white rounded-lg shadow-xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
              className="p-2 hover:shadow-md hover:border-gray-300 border border-transparent rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
            <div className="flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" />
            <Bike className="w-6 h-6 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
              Véhicule à vendre
          </h2>
          </div>
          <div className="flex items-center gap-3">
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onClose) onClose();
              }}
              className="p-2 hover:shadow-md hover:border-gray-400 border border-transparent rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content - Two panels layout */}
        <div className="flex h-[calc(95vh-80px)]">
          {/* Left Panel - Form */}
          <div className="w-full lg:w-1/2 p-6 overflow-y-auto">
        <Formik
          initialValues={initialValues}
          validationSchema={vehicleSchema}
              onSubmit={() => {}}
            >
              {({ values, setFieldValue }) => {
                useEffect(() => {
                  setFormValues(values);
                  handleFormChange(values);
                }, [values]);

                return (
                  <Form id="vehicle-form" className="space-y-6">
                    {/* Catégorie de véhicule */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Catégorie de véhicule
                      </label>
                      {isLoadingCategories ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Chargement des catégories...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {categoriesData?.data?.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => setFieldValue('categoryId', category.id)}
                              className={`p-4 border-2 rounded-lg text-left transition-all ${values.categoryId === category.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <img src={category.icon} alt={category.name} className="w-6 h-6" />
                                <span className="font-medium">{category.name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <ErrorMessage name="categoryId" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    {/* Année, Marque, Modèle */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Année
                        </label>
                        <Field
                          as={Input}
                          name="year"
                          type="number"
                          placeholder="2020"
                          className="w-full"
                        />
                        <ErrorMessage name="year" component="div" className="text-red-500 text-sm mt-1" />
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
                              disabled={!formValues.categoryId}
                              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                !formValues.categoryId ? 'bg-gray-100 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="">
                                {!formValues.categoryId ? 'Sélectionnez d\'abord une catégorie...' : 'Sélectionnez une marque...'}
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
                              placeholder="Ex: Toyota, BMW..."
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
                        {selectedBrandName && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                            {selectedBrandId && availableBrands.find(b => b.id === selectedBrandId)?.logo && (
                              <img 
                                src={availableBrands.find(b => b.id === selectedBrandId)?.logo} 
                                alt={selectedBrandName} 
                                className="w-4 h-4" 
                              />
                            )}
                            <span>Marque sélectionnée: {selectedBrandName}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modèle
                        </label>
                        <Field
                          as={Input}
                          name="model"
                          placeholder="Ex: Corolla, X5..."
                          className="w-full"
                        />
                        <ErrorMessage name="model" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                    </div>

                    {/* Upload d'images */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photos du véhicule *
                      </label>
                      <MultipleImageUpload
                        images={imageFiles}
                        setImages={handleImagesChange}
                        maxImages={10}
                        minImages={1}
                      />
                    </div>

                    {/* Kilométrage et Valeur */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kilométrage (km)
                        </label>
                        <Field
                          as={Input}
                          name="mileage"
                          type="number"
                          placeholder="50000"
                          className="w-full"
                        />
                        <ErrorMessage name="mileage" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valeur (MAD) *
                        </label>
                        <Field
                          as={Input}
                          name="value"
                          type="number"
                          placeholder="150000"
                          className="w-full"
                        />
                        <ErrorMessage name="value" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                    </div>

                    {/* État du véhicule */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        État du véhicule
                      </label>
                      <Field
                        as="select"
                        name="productCondition"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="new">Neuf</option>
                        <option value="like_new">Comme neuf</option>
                        <option value="good">Bon état</option>
                        <option value="fair">État correct</option>
                      </Field>
                      <ErrorMessage name="productCondition" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <Field
                        as="textarea"
                        name="description"
                        rows={4}
                        placeholder="Décrivez votre véhicule en détail..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    {/* Caractéristiques détaillées */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Caractéristiques détaillées
                        <span className="text-gray-500 text-sm font-normal ml-2">
                          (Ajoutez des spécifications techniques, équipements, etc.)
                        </span>
                      </label>
                      <div className="space-y-3">
                        {characteristics.map((char, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                placeholder="Ex: Couleur, Carburant, Transmission..."
                                value={char.key}
                                onChange={(e) => updateCharacteristic(index, 'key', e.target.value)}
                                className="w-full"
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                placeholder="Ex: Rouge, Diesel, Automatique..."
                                value={char.value}
                                onChange={(e) => updateCharacteristic(index, 'value', e.target.value)}
                                className="w-full"
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

                    {/* Localisation */}
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

                        {/* Résultats de recherche */}
                        {showLocationResults && locationResults.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {locationResults.map((location) => (
                              <button
                                key={location.id}
                                type="button"
                                onClick={() => handleLocationSelect(location)}
                                className="w-full px-4 py-3 text-left hover:shadow-sm hover:border-gray-200 border-b border-gray-100 last:border-b-0 transition-all duration-200"
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

                        {/* Message de chargement */}
                        {isSearchingLocations && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>

                      {/* Localisation sélectionnée */}
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

                    {/* Section des catégories d'échange */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Catégories d'échange souhaitées
                        <span className="text-gray-500 text-sm font-normal ml-2">
                          (Sélectionnez les catégories et marques que vous souhaitez recevoir en échange)
                        </span>
                      </label>
                      
                      {/* Barre de filtres pour les catégories d'échange */}
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
                            const isCategorySelected = selectedExchangeCategories.includes(category.id);
                            const isExpanded = expandedCategories.has(category.id);
                            const hasBrands = category.brands && category.brands.length > 0;
                            
                            return (
                              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* En-tête de la catégorie */}
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

                                {/* Marques de la catégorie */}
                                {isExpanded && hasBrands && (
                                  <div className="border-t border-gray-200 bg-gray-50 p-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      {category.brands.map((brand) => {
                                        const isBrandSelected = selectedExchangeBrands.includes(brand.id);
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
                      
                      {/* Résumé des sélections */}
                      {(selectedExchangeCategories.length > 0 || selectedExchangeBrands.length > 0) && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm text-blue-800">
                            <div className="font-medium mb-1">Sélections d'échange :</div>
                            {selectedExchangeCategories.length > 0 && (
                              <div className="mb-1">
                                <span className="font-medium">Catégories :</span> {selectedExchangeCategories.length}
                              </div>
                            )}
                            {selectedExchangeBrands.length > 0 && (
                              <div>
                                <span className="font-medium">Marques :</span> {selectedExchangeBrands.length}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                      <Button
                        type="button"
                        onClick={() => handlePublishOffer(values)}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isLoading ? 'Publication...' : 'Publier l\'Offre'}
                      </Button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>

          {/* Right Panel - Preview (Desktop only) */}
          <div className="hidden lg:block lg:w-1/2 border-l bg-gray-50 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperçu</h3>

              {/* Photo principale */}
              <div className="mb-4">
                {imageFiles.length > 0 && currentPhotoIndex < imageFiles.length && imageFiles[currentPhotoIndex] ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(imageFiles[currentPhotoIndex])}
                      alt="Véhicule"
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    {imageFiles.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {imageFiles.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`w-2 h-2 rounded-full ${index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Aucune photo</span>
                  </div>
                )}
              </div>

              {/* Titre et prix */}
              <div className="mb-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedBrandName && formValues.model && formValues.year
                    ? `${selectedBrandName} ${formValues.model} (${formValues.year})`
                    : selectedBrandName && formValues.model
                    ? `${selectedBrandName} ${formValues.model}`
                    : selectedBrandName || formValues.model || formValues.year
                    ? `${selectedBrandName || formValues.model || formValues.year}`
                    : 'Titre de l\'annonce'
                  }
                </h4>
                <p className="text-2xl font-bold text-green-600">
                  {formValues.value ? `${Number(formValues.value).toLocaleString()} د.م` : 'Prix'}
                </p>
              </div>

              {/* Détails */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <p>Publié il y a quelques secondes dans {selectedLocation?.city || 'فاس'}</p>
                {formValues.categoryId && categoriesData?.data && (
                  <p>Catégorie: {categoriesData.data.find(c => c.id === formValues.categoryId)?.name}</p>
                )}
                {formValues.mileage && (
                  <p>Kilométrage: {Number(formValues.mileage).toLocaleString()} km</p>
                )}
                {formValues.productCondition && (
                  <p>État: {
                    formValues.productCondition === 'new' ? 'Neuf' :
                    formValues.productCondition === 'like_new' ? 'Comme neuf' :
                    formValues.productCondition === 'good' ? 'Bon état' :
                    formValues.productCondition === 'fair' ? 'État correct' :
                    formValues.productCondition
                  }</p>
                )}
                {(selectedExchangeCategories.length > 0 || selectedExchangeBrands.length > 0) && allCategoriesData?.data && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Échange souhaité contre:</p>
                    <div className="space-y-2">
                      {/* Catégories sélectionnées */}
                      {selectedExchangeCategories.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Catégories:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedExchangeCategories.map(categoryId => {
                              const category = allCategoriesData.data.find(c => c.id === categoryId);
                              return category ? (
                                <span key={categoryId} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  <img src={category.icon} alt={category.name} className="w-3 h-3" />
                                  {category.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Marques sélectionnées */}
                      {selectedExchangeBrands.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Marques:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedExchangeBrands.map(brandId => {
                              // Trouver la marque dans toutes les catégories
                              let brand = null;
                              for (const category of allCategoriesData.data) {
                                if (category.brands) {
                                  brand = category.brands.find(b => b.id === brandId);
                                  if (brand) break;
                                }
                              }
                              return brand ? (
                                <span key={brandId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {brand.logo && <img src={brand.logo} alt={brand.name} className="w-3 h-3" />}
                                  {brand.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-sm text-gray-700">
                  {formValues.description || 'Description fournie par le ou la propriétaire'}
                </p>
              </div>

              {/* Caractéristiques détaillées */}
              {characteristics.some(c => c.key.trim() && c.value.trim()) && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Caractéristiques détaillées</h5>
                  <div className="space-y-1">
                    {characteristics
                      .filter(c => c.key.trim() && c.value.trim())
                      .map((char, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{char.key}:</span>
                          <span className="text-gray-900 font-medium">{char.value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Localisation */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Localisation</span>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  {selectedLocation ? (
                    <>
                      {selectedLocation.hasCoordinates ? (
                        <div className="mb-2">
                          <OpenStreetMap
                            latitude={selectedLocation.latitude}
                            longitude={selectedLocation.longitude}
                            addressName={selectedLocation.displayName}
                            height="200px"
                            className="border border-gray-200"
                          />
                        </div>
                      ) : (
                        <div className="h-32 bg-gray-200 rounded flex items-center justify-center mb-2">
                          <span className="text-xs text-gray-500">Aucune coordonnée disponible</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">{selectedLocation.city}</p>
                      {selectedLocation.sector && (
                        <p className="text-xs text-gray-500">
                          {selectedLocation.sector}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="h-32 bg-gray-200 rounded flex items-center justify-center mb-2">
                        <span className="text-xs text-gray-500">Sélectionnez une localisation</span>
                      </div>
                      <p className="text-sm text-gray-500">Aucune localisation sélectionnée</p>
                    </>
                  )}
                </div>
              </div>

              {/* Informations vendeur */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Informations sur le vendeur</h5>
                {isAuthenticated && currentUser ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {initials || <User className="h-4 w-4" />}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="text-xs text-gray-500">{fullName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="text-sm text-gray-500">Non connecté</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleForm;
