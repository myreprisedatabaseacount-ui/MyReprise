'use client';

import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowLeft, ShoppingBag, Save, Upload, MapPin } from 'lucide-react';
import { useProduct } from '../../services/hooks/useProduct';
import * as Yup from 'yup';

interface ItemFormProps {
  onBack?: () => void;
  onClose?: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ onBack, onClose }) => {
  const { updateData, setStep } = useProduct();
  const [isLoading, setIsLoading] = useState(false);

  // Schéma de validation pour article
  const itemSchema = Yup.object({
    // Bloc commun - Obligatoire
    title: Yup.string()
      .min(5, 'Le titre doit contenir au moins 5 caractères')
      .max(100, 'Le titre ne peut pas dépasser 100 caractères')
      .required('Le titre est obligatoire'),
    description: Yup.string()
      .min(20, 'La description doit contenir au moins 20 caractères')
      .max(2000, 'La description ne peut pas dépasser 2000 caractères')
      .required('La description est obligatoire'),
    price: Yup.number()
      .min(1, 'Le prix doit être supérieur à 0')
      .required('Le prix est obligatoire'),
    condition: Yup.string()
      .oneOf(['neuf', 'comme-neuf', 'bon-etat', 'utilise', 'a-reparer'], 'État invalide')
      .required('L\'état du produit est obligatoire'),
    category: Yup.string().required('La catégorie est obligatoire'),
    city: Yup.string().required('La ville est obligatoire'),
    region: Yup.string().required('La région est obligatoire'),
    
    // Bloc optionnel
    availability: Yup.string().oneOf(['disponible', 'reserve', 'vendu'], 'Disponibilité invalide'),
    tags: Yup.string(),
    deliveryAvailable: Yup.boolean(),
    returnAccepted: Yup.boolean(),
  });

  const initialValues = {
    // Bloc commun
    title: '',
    description: '',
    price: 0,
    condition: 'bon-etat',
    category: '',
    city: '',
    region: '',
    latitude: '',
    longitude: '',
    
    // Bloc optionnel
    availability: 'disponible',
    tags: '',
    deliveryAvailable: false,
    returnAccepted: false,
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setIsLoading(true);
    try {
      // Sauvegarder les données dans le state
      updateData({ ...values, listingType: 'item' });
      
      // TODO: Appel API pour créer le produit
      console.log('Données article:', values);
      
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
      <Card className="w-full max-w-3xl mx-4 p-6 relative max-h-[90vh] overflow-y-auto">
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
          <div className="p-2 bg-green-100 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Informations de l'article
          </h2>
        </div>

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={itemSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="space-y-6">
              {/* Bloc commun - Obligatoire */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations obligatoires</h3>
                
                {/* Titre */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de l'article *
                  </label>
                  <Field
                    as={Input}
                    name="title"
                    placeholder="Ex: iPhone 13 Pro Max 256GB - Excellent état"
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
                    placeholder="Décrivez votre article en détail..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
                </div>

                {/* Prix et État */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix (MAD) *
                    </label>
                    <Field
                      as={Input}
                      name="price"
                      type="number"
                      placeholder="1500"
                      className="w-full"
                    />
                    <ErrorMessage name="price" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      État du produit *
                    </label>
                    <Field
                      as="select"
                      name="condition"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="neuf">Neuf</option>
                      <option value="comme-neuf">Comme neuf</option>
                      <option value="bon-etat">Bon état</option>
                      <option value="utilise">Utilisé</option>
                      <option value="a-reparer">À réparer</option>
                    </Field>
                    <ErrorMessage name="condition" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>

                {/* Catégorie */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <Field
                    as="select"
                    name="category"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="electronique">Électronique</option>
                    <option value="vetements">Vêtements</option>
                    <option value="meubles">Meubles</option>
                    <option value="livres">Livres</option>
                    <option value="sport">Sport</option>
                    <option value="maison">Maison & Jardin</option>
                    <option value="autre">Autre</option>
                  </Field>
                  <ErrorMessage name="category" component="div" className="text-red-500 text-sm mt-1" />
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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

              {/* Bloc optionnel */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations optionnelles</h3>
                
                {/* Disponibilité */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponibilité
                  </label>
                  <Field
                    as="select"
                    name="availability"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="reserve">Réservé</option>
                    <option value="vendu">Vendu</option>
                  </Field>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags / Mots-clés
                  </label>
                  <Field
                    as={Input}
                    name="tags"
                    placeholder="Ex: smartphone, apple, 5g, reconditionné"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">Séparez les tags par des virgules</p>
                </div>

                {/* Options de livraison et retour */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      name="deliveryAvailable"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Livraison disponible
                    </label>
                  </div>
                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      name="returnAccepted"
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Retour accepté
                    </label>
                  </div>
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

export default ItemForm;
