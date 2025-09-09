'use client';

import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, Home, Save, MapPin } from 'lucide-react';
import { useProduct } from '../../services/hooks/useProduct';
import * as Yup from 'yup';

interface PropertyFormProps {
  onBack?: () => void;
  onClose?: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onBack, onClose }) => {
  const { updateData, setStep } = useProduct();
  const [isLoading, setIsLoading] = useState(false);

  // Schéma de validation pour immobilier
  const propertySchema = Yup.object({
    // Bloc commun - Obligatoire
    title: Yup.string()
      .min(10, 'Le titre doit contenir au moins 10 caractères')
      .max(100, 'Le titre ne peut pas dépasser 100 caractères')
      .required('Le titre est obligatoire'),
    description: Yup.string()
      .min(50, 'La description doit contenir au moins 50 caractères')
      .max(3000, 'La description ne peut pas dépasser 3000 caractères')
      .required('La description est obligatoire'),
    price: Yup.number()
      .min(1, 'Le prix doit être supérieur à 0')
      .required('Le prix est obligatoire'),
    category: Yup.string().required('La catégorie est obligatoire'),
    city: Yup.string().required('La ville est obligatoire'),
    region: Yup.string().required('La région est obligatoire'),
    
    // Bloc spécifique immobilier - Obligatoire
    operationType: Yup.string()
      .oneOf(['vente', 'location', 'colocation', 'location-courte-duree'], 'Type d\'opération invalide')
      .required('Le type d\'opération est obligatoire'),
    surface: Yup.number()
      .min(1, 'La surface doit être supérieure à 0')
      .required('La surface est obligatoire'),
    bedrooms: Yup.number()
      .min(0, 'Le nombre de chambres ne peut pas être négatif')
      .required('Le nombre de chambres est obligatoire'),
    bathrooms: Yup.number()
      .min(0, 'Le nombre de salles de bain ne peut pas être négatif')
      .required('Le nombre de salles de bain est obligatoire'),
    
    // Bloc spécifique immobilier - Optionnel
    floor: Yup.number().min(0),
    furnished: Yup.boolean(),
    constructionYear: Yup.number().min(1800).max(new Date().getFullYear()),
    elevator: Yup.boolean(),
    parking: Yup.boolean(),
    balcony: Yup.boolean(),
    garden: Yup.boolean(),
    pool: Yup.boolean(),
    landSurface: Yup.number().min(0),
    usage: Yup.string().oneOf(['residentiel', 'commercial', 'mixte'], 'Usage invalide'),
    
    // Bloc optionnel
    availability: Yup.string().oneOf(['disponible', 'loue', 'vendu'], 'Disponibilité invalide'),
    tags: Yup.string(),
  });

  const initialValues = {
    // Bloc commun
    title: '',
    description: '',
    price: 0,
    category: '',
    city: '',
    region: '',
    latitude: '',
    longitude: '',
    
    // Bloc spécifique immobilier - Obligatoire
    operationType: 'vente',
    surface: 0,
    bedrooms: 0,
    bathrooms: 0,
    
    // Bloc spécifique immobilier - Optionnel
    floor: 0,
    furnished: false,
    constructionYear: new Date().getFullYear(),
    elevator: false,
    parking: false,
    balcony: false,
    garden: false,
    pool: false,
    landSurface: 0,
    usage: 'residentiel',
    
    // Bloc optionnel
    availability: 'disponible',
    tags: '',
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setIsLoading(true);
    try {
      // Sauvegarder les données dans le state
      updateData({ ...values, listingType: 'property' });
      
      // TODO: Appel API pour créer le produit
      console.log('Données immobilier:', values);
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-2 bg-purple-100 rounded-lg">
            <Home className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Informations de l'immobilier
          </h2>
        </div>

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={propertySchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="space-y-6">
              {/* Bloc commun - Obligatoire */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h3>
                
                {/* Titre */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de l'annonce *
                  </label>
                  <Field
                    as={Input}
                    name="title"
                    placeholder="Ex: Appartement 3 chambres à louer - Centre ville"
                    className="w-full"
                  />
                  <ErrorMessage name="title" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
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

                {/* Prix et Catégorie */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix (MAD) *
                    </label>
                    <Field
                      as={Input}
                      name="price"
                      type="number"
                      placeholder="500000"
                      className="w-full"
                    />
                    <ErrorMessage name="price" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie *
                    </label>
                    <Field
                      as="select"
                      name="category"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Sélectionner une catégorie</option>
                      <option value="maison">Maison</option>
                      <option value="appartement">Appartement</option>
                      <option value="villa">Villa</option>
                      <option value="terrain">Terrain</option>
                      <option value="immeuble">Immeuble</option>
                      <option value="local-commercial">Local commercial</option>
                      <option value="bureau">Bureau</option>
                    </Field>
                    <ErrorMessage name="category" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>

                {/* Localisation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville *
                    </label>
                    <Field
                      as={Input}
                      name="city"
                      placeholder="Ex: Casablanca"
                      className="w-full"
                    />
                    <ErrorMessage name="city" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Région *
                    </label>
                    <Field
                      as="select"
                      name="region"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Sélectionner une région</option>
                      <option value="casablanca-settat">Casablanca-Settat</option>
                      <option value="rabat-salé-kénitra">Rabat-Salé-Kénitra</option>
                      <option value="marrakech-safi">Marrakech-Safi</option>
                      <option value="fès-meknès">Fès-Meknès</option>
                      <option value="tanger-tétouan-al-hoceïma">Tanger-Tétouan-Al Hoceïma</option>
                      <option value="oriental">Oriental</option>
                      <option value="béni-mellal-khénifra">Béni Mellal-Khénifra</option>
                      <option value="souss-massa">Souss-Massa</option>
                      <option value="drâa-tafilalet">Drâa-Tafilalet</option>
                      <option value="dakhla-oued-ed-dahab">Dakhla-Oued Ed-Dahab</option>
                      <option value="laâyoune-sakia-el-hamra">Laâyoune-Sakia El Hamra</option>
                    </Field>
                    <ErrorMessage name="region" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              {/* Bloc spécifique immobilier - Obligatoire */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Caractéristiques immobilières</h3>
                
                {/* Type d'opération */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'opération *
                  </label>
                  <Field
                    as="select"
                    name="operationType"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="vente">Vente</option>
                    <option value="location">Location</option>
                    <option value="colocation">Colocation</option>
                    <option value="location-courte-duree">Location courte durée</option>
                  </Field>
                  <ErrorMessage name="operationType" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Surface et Chambres */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Surface (m²) *
                    </label>
                    <Field
                      as={Input}
                      name="surface"
                      type="number"
                      placeholder="120"
                      className="w-full"
                    />
                    <ErrorMessage name="surface" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chambres *
                    </label>
                    <Field
                      as={Input}
                      name="bedrooms"
                      type="number"
                      placeholder="3"
                      className="w-full"
                    />
                    <ErrorMessage name="bedrooms" component="div" className="text-red-500 text-sm mt-1" />
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
              </div>

              {/* Bloc spécifique immobilier - Optionnel */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Caractéristiques supplémentaires</h3>
                
                {/* Étage et Année de construction */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  </div>
                </div>

                {/* Superficie terrain */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Superficie terrain (m²)
                  </label>
                  <Field
                    as={Input}
                    name="landSurface"
                    type="number"
                    placeholder="500"
                    className="w-full"
                  />
                </div>

                {/* Usage */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage
                  </label>
                  <Field
                    as="select"
                    name="usage"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="residentiel">Résidentiel</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixte">Mixte</option>
                  </Field>
                </div>

                {/* Équipements */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      name="furnished"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Meublé</label>
                  </div>
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      name="elevator"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Ascenseur</label>
                  </div>
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      name="parking"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Parking</label>
                  </div>
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      name="balcony"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Balcon/Terrasse</label>
                  </div>
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      name="garden"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Jardin</label>
                  </div>
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      name="pool"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Piscine</label>
                  </div>
                </div>
              </div>

              {/* Bloc optionnel */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations optionnelles</h3>
                
                {/* Disponibilité */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponibilité
                  </label>
                  <Field
                    as="select"
                    name="availability"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="loue">Loué</option>
                    <option value="vendu">Vendu</option>
                  </Field>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags / Mots-clés
                  </label>
                  <Field
                    as={Input}
                    name="tags"
                    placeholder="Ex: centre-ville, proche-métro, vue-mer, sécurisé"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">Séparez les tags par des virgules</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
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
                  {isLoading ? 'Enregistrement...' : 'Continuer'}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
};

export default PropertyForm;
