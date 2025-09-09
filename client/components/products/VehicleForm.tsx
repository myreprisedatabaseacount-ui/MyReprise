'use client';

import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

import { ArrowLeft, Car, Bike, Truck, Anchor, Save, Upload, X, MapPin } from 'lucide-react';
import { useProduct } from '../../services/hooks/useProduct';
import * as Yup from 'yup';

interface VehicleFormProps {
  onBack?: () => void;
  onClose?: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onBack, onClose }) => {
  const { updateData, setStep } = useProduct();
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Valeurs initiales
  const initialValues = {
    vehicleType: '',
    year: new Date().getFullYear(),
    brand: '',
    model: '',
    mileage: '',
    value: '',
    description: '',
    photos: [],
  };

  const [formValues, setFormValues] = useState(initialValues);

  // Schéma de validation pour véhicule
  const vehicleSchema = Yup.object({
    vehicleType: Yup.string()
      .oneOf(['moto', 'voiture-camion', 'remorque', 'bateau', 'autre'], 'Type de véhicule invalide')
      .required('Le type de véhicule est obligatoire'),
    year: Yup.number()
      .min(1900, 'Année invalide')
      .max(new Date().getFullYear() + 1, 'Année invalide')
      .required('L\'année est obligatoire'),
    brand: Yup.string().required('La marque est obligatoire'),
    model: Yup.string().required('Le modèle est obligatoire'),
    mileage: Yup.string()
      .required('Le kilométrage est obligatoire')
      .test('is-number', 'Le kilométrage doit être un nombre', (value) => {
        if (!value) return false;
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
      .max(2000, 'La description ne peut pas dépasser 2000 caractères')
      .required('La description est obligatoire'),
    // Les photos sont gérées séparément via l'état local
  });

  // Types de véhicules avec icônes
  const vehicleTypes = [
    { value: 'moto', label: 'Moto', icon: Bike, color: 'text-orange-600' },
    { value: 'voiture-camion', label: 'Voiture/Camion', icon: Car, color: 'text-blue-600' },
    { value: 'remorque', label: 'Remorque', icon: Truck, color: 'text-green-600' },
    { value: 'bateau', label: 'Bateau', icon: Anchor, color: 'text-cyan-600' },
    { value: 'autre', label: 'Autre', icon: Car, color: 'text-gray-600' },
  ];

  // Gestion des photos
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (photos.length + files.length > 10) {
      alert('Maximum 10 photos autorisées');
      return;
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto = e.target?.result as string;
        setPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });
    
    // Réinitialiser l'input
    event.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const newPhotos = prev.filter((_, i) => i !== index);
      // Ajuster l'index de la photo courante
      if (currentPhotoIndex >= newPhotos.length && newPhotos.length > 0) {
        setCurrentPhotoIndex(newPhotos.length - 1);
      } else if (newPhotos.length === 0) {
        setCurrentPhotoIndex(0);
      }
      return newPhotos;
    });
  };

  const handleSubmit = async (values: typeof initialValues) => {
    // Validation des photos
    if (photos.length === 0) {
      alert('Au moins une photo est obligatoire');
      return;
    }
    
    setIsLoading(true);
    try {
      // Construire le titre pour l'offre
      const title = `${values.brand} ${values.model} ${values.year}`;
      
      // Données pour l'offre
      const offerData = {
        title: title,
        description: values.description,
        price: Number(values.value),
        status: 'available',
        productCondition: 'good', // Valeur par défaut
        listingType: 'vehicle',
        vehicleType: values.vehicleType,
        year: values.year,
        brand: values.brand,
        model: values.model,
        mileage: Number(values.mileage),
        photos: photos,
        // Localisation mockup
        location: {
          city: 'Fès',
          sector: 'Zouagha',
          latitude: 34.0181,
          longitude: -4.9828
        }
      };
      
      // Sauvegarder les données dans le state
      updateData(offerData);
      
      // TODO: Appel API pour créer l'offre
      console.log('Données offre véhicule:', offerData);
      
      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Passer à l'étape suivante ou fermer
      setStep(3);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setIsLoading(false);
    }
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
              className="p-2 hover:bg-gray-100 rounded-lg"
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
            <button className="text-blue-600 text-sm hover:underline">
              Enregistrer le brouillon
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
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
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue }) => {
                // Mettre à jour formValues de manière simple
                if (JSON.stringify(values) !== JSON.stringify(formValues)) {
                  setFormValues(values);
                }
                
                return (
                <Form className="space-y-6">
                  {/* Type de véhicule */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Type de véhicule *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {vehicleTypes.map((type) => {
                        const IconComponent = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFieldValue('vehicleType', type.value)}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                              values.vehicleType === type.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <IconComponent className={`w-6 h-6 ${type.color}`} />
                              <span className="font-medium">{type.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <ErrorMessage name="vehicleType" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  {/* Photos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Photos * (1-10 photos)
                    </label>
                    <div className="space-y-4">
                      {/* Upload area */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Cliquez pour ajouter des photos
                          </span>
                          <span className="text-xs text-gray-500">
                            {photos.length}/10 photos
                          </span>
                        </label>
                      </div>

                      {/* Photo preview */}
                      {photos.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {photos.map((photo, index) => (
                              <div key={index} className="relative flex-shrink-0">
                                <img
                                  src={photo}
                                  alt={`Photo ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {photos.length === 0 && (
                      <p className="text-red-500 text-sm mt-1">Au moins une photo est obligatoire</p>
                    )}
                  </div>

                  {/* Année, Marque, Modèle */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Année *
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
                        Marque *
                      </label>
                      <Field
                        as={Input}
                        name="brand"
                        placeholder="Ex: Toyota, BMW..."
                        className="w-full"
                      />
                      <ErrorMessage name="brand" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modèle *
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

                  {/* Kilométrage et Valeur */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kilométrage (km) *
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

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description - Plus de détails *
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

                  {/* Footer */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {isLoading ? 'Enregistrement...' : 'Suivant'}
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
                {photos.length > 0 ? (
                  <div className="relative">
                    <img
                      src={photos[currentPhotoIndex]}
                      alt="Véhicule"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    {photos.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {photos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`w-2 h-2 rounded-full ${
                              index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Aucune photo</span>
                  </div>
                )}
              </div>

              {/* Titre et prix */}
              <div className="mb-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {formValues.brand && formValues.model && formValues.year 
                    ? `${formValues.brand} ${formValues.model} ${formValues.year}`
                    : 'Titre de l\'annonce'
                  }
                </h4>
                <p className="text-2xl font-bold text-green-600">
                  {formValues.value ? `${Number(formValues.value).toLocaleString()} د.م` : 'Prix'}
                </p>
              </div>

              {/* Détails */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <p>Publié il y a quelques secondes dans فاس</p>
                {formValues.vehicleType && (
                  <p>Type: {vehicleTypes.find(t => t.value === formValues.vehicleType)?.label}</p>
                )}
                {formValues.mileage && (
                  <p>Kilométrage: {Number(formValues.mileage).toLocaleString()} km</p>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-sm text-gray-700">
                  {formValues.description || 'Description fournie par le ou la vendeur(se)'}
                </p>
              </div>

              {/* Localisation */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Localisation</span>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <div className="h-32 bg-gray-200 rounded flex items-center justify-center mb-2">
                    <span className="text-xs text-gray-500">Carte OpenStreetMap</span>
                  </div>
                  <p className="text-sm text-gray-600">Fès - Zouagha</p>
                  <p className="text-xs text-gray-500">La localisation est approximative</p>
                  <p className="text-sm text-gray-600">فاس</p>
                </div>
              </div>

              {/* Informations vendeur */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Informations sur le vendeur</h5>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">MR</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">MyReprise Dev</span>
                </div>
              </div>

              {/* Bouton contact */}
              <Button className="w-full bg-gray-600 hover:bg-gray-700">
                Envoyer un message
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleForm;
