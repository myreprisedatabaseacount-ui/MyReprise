'use client';

import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

import { ArrowLeft, Home, Save, X, MapPin, Search, User, Plus, Trash2 } from 'lucide-react';
import { useProduct } from '../../services/hooks/useProduct';
import { useCreateOfferMutation } from '../../services/api/OfferApi';
import { useSearchLocationsMutation } from '../../services/api/AddressApi';
import { useGetCategoriesByListingTypeQuery, useGetAllCategoriesQuery } from '../../services/api/CategoryApi';
import { useAddCategoryToOfferMutation, useRemoveCategoryFromOfferMutation } from '../../services/api/OfferCategoryApi';
import { useCurrentUser, useUserDisplay } from '../../services/hooks/useCurrentUser';
import MultipleImageUpload from './MultipleImageUpload';
import OpenStreetMap from '../ui/OpenStreetMap';
import { toast } from 'sonner';
import * as Yup from 'yup';

interface PropertyFormProps {
  onBack?: () => void;
  onClose?: () => void;
}

interface Characteristic {
  key: string;
  value: string;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onBack, onClose }) => {
  const { updateData, setStep } = useProduct();
  const [createOffer, { isLoading }] = useCreateOfferMutation();
  const [searchLocations, { isLoading: isSearchingLocations }] = useSearchLocationsMutation();
  const { currentUser, isAuthenticated } = useCurrentUser();
  const { displayName, initials, fullName } = useUserDisplay();
  
  // Récupérer les catégories pour l'immobilier
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoriesByListingTypeQuery('property');
  // Récupérer toutes les catégories pour les échanges
  const { data: allCategoriesData, isLoading: isLoadingAllCategories } = useGetAllCategoriesQuery({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // États pour les catégories d'échange
  const [selectedExchangeCategories, setSelectedExchangeCategories] = useState<number[]>([]);
  const [createdOfferId, setCreatedOfferId] = useState<number | null>(null);
  const [isExchangeConfirmed, setIsExchangeConfirmed] = useState(false);
  
  // Mutations pour les catégories d'échange
  const [addCategoryToOffer] = useAddCategoryToOfferMutation();
  const [removeCategoryFromOffer] = useRemoveCategoryFromOfferMutation();

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
    propertyType: '',
    area: '',
    rooms: '',
    bathrooms: '',
    floor: '',
    hasElevator: false,
    hasParking: false,
    hasGarden: false,
    hasBalcony: false,
    constructionYear: new Date().getFullYear(),
    value: '',
    description: '',
    images: [],
    location: null,
  };

  const [formValues, setFormValues] = useState(initialValues);

  // Schéma de validation pour immobilier
  const propertySchema = Yup.object({
    categoryId: Yup.number()
      .required('La catégorie d\'immobilier est obligatoire'),
    propertyType: Yup.string().required('Le type de bien est obligatoire'),
    area: Yup.string()
      .required('La superficie est obligatoire')
      .test('is-number', 'La superficie doit être un nombre', (value) => {
        if (!value) return false;
        const num = Number(value);
        return !isNaN(num) && num > 0;
      }),
    rooms: Yup.string()
      .required('Le nombre de pièces est obligatoire')
      .test('is-number', 'Le nombre de pièces doit être un nombre', (value) => {
        if (!value) return false;
        const num = Number(value);
        return !isNaN(num) && num >= 0;
      }),
    bathrooms: Yup.string()
      .required('Le nombre de salles de bain est obligatoire')
      .test('is-number', 'Le nombre de salles de bain doit être un nombre', (value) => {
        if (!value) return false;
        const num = Number(value);
        return !isNaN(num) && num >= 0;
      }),
    floor: Yup.string(),
    constructionYear: Yup.number()
      .min(1800, 'Année invalide')
      .max(new Date().getFullYear(), 'Année invalide'),
    value: Yup.string()
      .required('La valeur est obligatoire')
      .test('is-number', 'La valeur doit être un nombre', (value) => {
        if (!value) return false;
        const num = Number(value);
        return !isNaN(num) && num > 0;
      }),
    description: Yup.string()
      .min(20, 'La description doit contenir au moins 20 caractères')
      .max(2000, 'La description ne peut pas dépasser 2000 caractères')
      .required('La description est obligatoire'),
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
  const handleExchangeCategoryToggle = async (categoryId: number) => {
    if (!createdOfferId) {
      toast.error('Veuillez d\'abord créer l\'offre');
      return;
    }

    const isSelected = selectedExchangeCategories.includes(categoryId);

    try {
      if (isSelected) {
        await removeCategoryFromOffer({ offerId: createdOfferId, categoryId }).unwrap();
        setSelectedExchangeCategories(prev => prev.filter(id => id !== categoryId));
        toast.success('Catégorie d\'échange supprimée');
      } else {
        await addCategoryToOffer({ offerId: createdOfferId, categoryId }).unwrap();
        setSelectedExchangeCategories(prev => [...prev, categoryId]);
        toast.success('Catégorie d\'échange ajoutée');
      }
    } catch (error: any) {
      console.error('Erreur lors de la gestion de la catégorie d\'échange:', error);
      toast.error('Erreur lors de la gestion de la catégorie d\'échange');
    }
  };

  // Fonction pour confirmer les catégories d'échange et fermer le formulaire
  const handleConfirmExchange = () => {
    setIsExchangeConfirmed(true);
    toast.success('Configuration terminée !', {
      description: 'Votre offre est maintenant complète avec les catégories d\'échange sélectionnées.',
      duration: 3000,
    });
    
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 1500);
  };

  // Synchroniser currentPhotoIndex avec imageFiles
  useEffect(() => {
    if (imageFiles.length === 0) {
      setCurrentPhotoIndex(0);
    } else if (currentPhotoIndex >= imageFiles.length) {
      setCurrentPhotoIndex(imageFiles.length - 1);
    }
  }, [imageFiles, currentPhotoIndex]);

  // Fonction pour publier l'offre
  const handlePublishOffer = async (values: typeof initialValues) => {
    console.log('values', values);
    
    if (imageFiles.length === 0) {
      toast.error('Au moins une photo est obligatoire');
      return;
    }

    if (!selectedLocation) {
      toast.error('Veuillez sélectionner une localisation');
      return;
    }

    // Valider les caractéristiques
    const validCharacteristics = characteristics.filter(c => c.key.trim() && c.value.trim());
    if (validCharacteristics.length === 0) {
      toast.error('Veuillez ajouter au moins une caractéristique détaillée');
      return;
    }

    try {
      // Construire le titre pour l'offre
      const title = `${values.propertyType} - ${values.area}m² - ${selectedLocation.city}`;

      // Construire les caractéristiques en objet
      const characteristicsObj = validCharacteristics.reduce((acc, char) => {
        acc[char.key] = char.value;
        return acc;
      }, {} as Record<string, string>);

      // Données spécifiques à l'immobilier
      const specificData = {
        propertyType: values.propertyType,
        area: Number(values.area),
        rooms: Number(values.rooms),
        bathrooms: Number(values.bathrooms),
        floor: values.floor ? Number(values.floor) : null,
        hasElevator: values.hasElevator,
        hasParking: values.hasParking,
        hasGarden: values.hasGarden,
        hasBalcony: values.hasBalcony,
        constructionYear: values.constructionYear,
        characteristics: characteristicsObj
      };

      // Préparer les données pour l'API
      const apiData = {
        title: title,
        description: values.description,
        price: Number(values.value),
        status: 'available',
        productCondition: 'good', // Par défaut pour l'immobilier
        listingType: 'property',
        sellerId: currentUser?.id || 1,
        categoryId: values.categoryId,
        addressId: selectedLocation.id,
        specificData: specificData,
        images: imageFiles
      };

      console.log('📤 Envoi des données offre immobilier:', apiData);

      const result = await createOffer(apiData).unwrap();

      console.log('✅ Offre créée avec succès:', result);

      if (result.data?.id) {
        setCreatedOfferId(result.data.id);
      }

      toast.success('Offre créée avec succès !', {
        description: `Votre bien "${result.data?.title || title}" est maintenant en ligne. Vous pouvez maintenant sélectionner les catégories d'échange.`,
        duration: 4000,
      });

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
          description: 'Une erreur est survenue lors de la création du bien immobilier',
          duration: 6000,
        });
      }
    }
  };

  // Fonction pour mettre à jour l'aperçu
  const handleFormChange = (values: typeof initialValues) => {
    const title = `${values.propertyType} - ${values.area}m² - ${selectedLocation?.city || 'Ville'}`;

    const validCharacteristics = characteristics.filter(c => c.key.trim() && c.value.trim());
    const characteristicsObj = validCharacteristics.reduce((acc, char) => {
      acc[char.key] = char.value;
      return acc;
    }, {} as Record<string, string>);

    const specificData = {
      propertyType: values.propertyType,
      area: Number(values.area),
      rooms: Number(values.rooms),
      bathrooms: Number(values.bathrooms),
      floor: values.floor ? Number(values.floor) : null,
      hasElevator: values.hasElevator,
      hasParking: values.hasParking,
      hasGarden: values.hasGarden,
      hasBalcony: values.hasBalcony,
      constructionYear: values.constructionYear,
      characteristics: characteristicsObj
    };

    const offerData = {
      title: title,
      description: values.description,
      price: Number(values.value),
      status: 'available',
      productCondition: 'good',
      listingType: 'property',
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
            <Home className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
              Bien immobilier à vendre
          </h2>
          </div>
          <div className="flex items-center gap-3">
           
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (createdOfferId && !isExchangeConfirmed) {
                  toast.error('Veuillez d\'abord confirmer vos sélections d\'échange');
                  return;
                }
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
          validationSchema={propertySchema}
              onSubmit={() => {}}
            >
              {({ values, setFieldValue }) => {
                useEffect(() => {
                  setFormValues(values);
                  handleFormChange(values);
                }, [values]);

                return (
                  <Form id="property-form" className="space-y-6">
                    {/* Catégorie d'immobilier */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Catégorie d'immobilier *
                  </label>
                      {isLoadingCategories ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
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
                                  ? 'border-purple-500 bg-purple-50'
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

                    {/* Type de bien */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de bien *
                    </label>
                    <Field
                      as="select"
                        name="propertyType"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="">Sélectionner un type</option>
                        <option value="appartement">Appartement</option>
                      <option value="maison">Maison</option>
                      <option value="villa">Villa</option>
                      <option value="terrain">Terrain</option>
                      <option value="immeuble">Immeuble</option>
                      <option value="local-commercial">Local commercial</option>
                      <option value="bureau">Bureau</option>
                    </Field>
                      <ErrorMessage name="propertyType" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                    {/* Superficie et Pièces */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                          Superficie (m²) *
                    </label>
                    <Field
                      as={Input}
                          name="area"
                      type="number"
                      placeholder="120"
                      className="w-full"
                    />
                        <ErrorMessage name="area" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pièces *
                    </label>
                    <Field
                      as={Input}
                          name="rooms"
                      type="number"
                      placeholder="3"
                      className="w-full"
                    />
                        <ErrorMessage name="rooms" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salles de bain *
                    </label>
                    <Field
                      as={Input}
                      name="bathrooms"
                      type="number"
                      placeholder="2"
                      className="w-full"
                    />
                    <ErrorMessage name="bathrooms" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
                
                {/* Étage et Année de construction */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Étage
                    </label>
                    <Field
                      as={Input}
                      name="floor"
                      type="number"
                      placeholder="2"
                      className="w-full"
                    />
                        <ErrorMessage name="floor" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Année de construction
                    </label>
                    <Field
                      as={Input}
                      name="constructionYear"
                      type="number"
                      placeholder="2020"
                      className="w-full"
                    />
                        <ErrorMessage name="constructionYear" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>

                    {/* Équipements */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Équipements
                  </label>
                      <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                            name="hasElevator"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Ascenseur</label>
                  </div>
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                            name="hasParking"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Parking</label>
                  </div>
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                            name="hasGarden"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Jardin</label>
                  </div>
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                            name="hasBalcony"
                      className="mr-2"
                    />
                          <label className="text-sm font-medium text-gray-700">Balcon/Terrasse</label>
                  </div>
                </div>
              </div>

                    {/* Valeur */}
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valeur (MAD) *
                  </label>
                  <Field
                        as={Input}
                        name="value"
                        type="number"
                        placeholder="500000"
                        className="w-full"
                      />
                      <ErrorMessage name="value" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                    {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description - Plus de détails *
                  </label>
                  <Field
                        as="textarea"
                        name="description"
                        rows={4}
                        placeholder="Décrivez votre bien immobilier en détail..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                    </div>

                    {/* Caractéristiques détaillées */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Caractéristiques détaillées *
                        <span className="text-gray-500 text-sm font-normal ml-2">
                          (Ajoutez des spécifications techniques, équipements, etc.)
                        </span>
                      </label>
                      <div className="space-y-3">
                        {characteristics.map((char, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                placeholder="Ex: Climatisation, Chauffage, Sécurité..."
                                value={char.key}
                                onChange={(e) => updateCharacteristic(index, 'key', e.target.value)}
                                className="w-full"
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                placeholder="Ex: Central, Gaz, Gardien 24h..."
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
                          className="w-full border-dashed border-2 border-gray-300 hover:border-purple-500"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter une caractéristique
                        </Button>
                </div>
              </div>

                    {/* Localisation */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Localisation *
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

                        {isSearchingLocations && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          </div>
                        )}
                      </div>

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

                    {/* Upload d'images */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photos du bien *
                      </label>
                      <MultipleImageUpload
                        images={imageFiles}
                        setImages={handleImagesChange}
                        maxImages={10}
                        minImages={1}
                      />
                    </div>

                    {/* Section des catégories d'échange - affichée après création de l'offre */}
                    {createdOfferId && (
                      <div>
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">
                            ✅ Offre créée avec succès ! 
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            {selectedExchangeCategories.length === 0 
                              ? "Sélectionnez au moins une catégorie d'échange souhaitée, puis cliquez sur 'Confirmer les échanges'."
                              : `Vous avez sélectionné ${selectedExchangeCategories.length} catégorie(s). Cliquez sur 'Confirmer les échanges' pour terminer.`
                            }
                          </p>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Catégories d'échange souhaitées
                          <span className="text-gray-500 text-sm font-normal ml-2">
                            (Sélectionnez les catégories que vous souhaitez recevoir en échange)
                          </span>
                        </label>
                        {isLoadingAllCategories ? (
                          <div className="flex items-center justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                            <span className="ml-2 text-gray-600">Chargement des catégories...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                            {allCategoriesData?.data?.map((category) => (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => handleExchangeCategoryToggle(category.id)}
                                className={`p-3 border-2 rounded-lg text-left transition-all ${
                                  selectedExchangeCategories.includes(category.id)
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                } cursor-pointer`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                    selectedExchangeCategories.includes(category.id)
                                      ? 'border-purple-500 bg-purple-500'
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedExchangeCategories.includes(category.id) && (
                                      <div className="w-2 h-2 bg-white rounded-sm"></div>
                                    )}
                                  </div>
                                  <img src={category.icon} alt={category.name} className="w-4 h-4" />
                                  <span className="font-medium text-sm">{category.name}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

              {/* Footer */}
              <div className="flex justify-between gap-3 pt-6 border-t">
                      {createdOfferId && !isExchangeConfirmed && (
                <Button
                  type="button"
                          onClick={handleConfirmExchange}
                          disabled={selectedExchangeCategories.length === 0}
                          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                          <Save className="w-4 h-4" />
                          Confirmer les échanges
                </Button>
                      )}
                      {createdOfferId && isExchangeConfirmed && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <span className="text-sm font-medium">Configuration terminée</span>
                        </div>
                      )}
                <Button
                        type="button"
                        onClick={() => handlePublishOffer(values)}
                        disabled={isLoading || (createdOfferId && !isExchangeConfirmed)}
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
                      alt="Bien immobilier"
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
                  {formValues.propertyType && formValues.area
                    ? `${formValues.propertyType} - ${formValues.area}m² - ${selectedLocation?.city || 'Ville'}`
                    : 'Titre de l\'annonce'
                  }
                </h4>
                <p className="text-2xl font-bold text-purple-600">
                  {formValues.value ? `${Number(formValues.value).toLocaleString()} د.م` : 'Prix'}
                </p>
              </div>

              {/* Détails */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <p>Publié il y a quelques secondes dans {selectedLocation?.city || 'فاس'}</p>
                {formValues.categoryId && categoriesData?.data && (
                  <p>Catégorie: {categoriesData.data.find(c => c.id === formValues.categoryId)?.name}</p>
                )}
                {formValues.rooms && (
                  <p>Pièces: {formValues.rooms}</p>
                )}
                {formValues.bathrooms && (
                  <p>Salles de bain: {formValues.bathrooms}</p>
                )}
                {formValues.floor && (
                  <p>Étage: {formValues.floor}</p>
                )}
                {formValues.constructionYear && (
                  <p>Année: {formValues.constructionYear}</p>
                )}
                
                {selectedExchangeCategories.length > 0 && allCategoriesData?.data && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Échange souhaité contre:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedExchangeCategories.map(categoryId => {
                        const category = allCategoriesData.data.find(c => c.id === categoryId);
                        return category ? (
                          <span key={categoryId} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            <img src={category.icon} alt={category.name} className="w-3 h-3" />
                            {category.name}
                          </span>
                        ) : null;
                      })}
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
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">
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

export default PropertyForm;
