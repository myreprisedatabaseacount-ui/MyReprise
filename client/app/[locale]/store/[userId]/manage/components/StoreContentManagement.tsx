import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Palette, Image, Type, FileImage, Upload, X, Save } from 'lucide-react';
import { useUpdateStoreMutation } from '../../../../../../services/api/UserStoreApi';
import { toast } from 'sonner';
import { compressImageByType } from '../../../../../../utils/imageCompression';

interface StoreFormData {
  name: string;
  description: string;
  logo: File | null;
  banner: File | null;
  primaryColor: string;
  secondaryColor: string;
}

interface StoreContentManagementProps {
  userId: string;
  store?: any;
}

const StoreContentManagement: React.FC<StoreContentManagementProps> = ({ userId, store }) => {
  const router = useRouter();
  const [updateStore, { isLoading: isUpdateLoading }] = useUpdateStoreMutation();

  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    description: '',
    logo: null,
    banner: null,
    primaryColor: '#4169e1',
    secondaryColor: '#ffa500',
  });

  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [errors, setErrors] = useState<Partial<StoreFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser le formulaire avec les données du store
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        description: store.description || '',
        logo: null,
        banner: null,
        primaryColor: store.primaryColor || '#4169e1',
        secondaryColor: store.secondaryColor || '#ffa500',
      });
      setLogoPreview(store.logo || '');
      setBannerPreview(store.banner || '');
    }
  }, [store]);

  const handleInputChange = (field: keyof StoreFormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Gestion de l'upload de logo avec compression
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev: any) => ({ ...prev, logo: 'Veuillez sélectionner un fichier image valide' }));
        return;
      }

      try {
        const compressedResult = await compressImageByType(file, {
          maxSizeKB: 256, // 0.25MB max pour le logo
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.9
        });

        if (compressedResult.compressionRatio < 1) {
          const originalSizeKB = Math.round(file.size / 1024);
          const compressedSizeKB = Math.round(compressedResult.compressedSize / 1024);
          toast.info('Logo compressé', {
            description: `Taille réduite de ${originalSizeKB}KB à ${compressedSizeKB}KB`,
            duration: 3000,
          });
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setLogoPreview(result);
          setFormData(prev => ({ ...prev, logo: compressedResult.file }));
          if (errors.logo) {
            setErrors((prev: any) => ({ ...prev, logo: '' as any }));
          }
        };
        reader.readAsDataURL(compressedResult.file);
      } catch (error) {
        console.error('Erreur lors de la compression du logo:', error);
        setErrors((prev: any) => ({ ...prev, logo: 'Erreur lors de la compression du logo' }));
        toast.error('Erreur de compression', {
          description: 'Impossible de compresser le logo. Veuillez réessayer.',
          duration: 4000,
        });
      }
    }
  };

  // Gestion de l'upload de banner avec compression
  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev: any) => ({ ...prev, banner: 'Veuillez sélectionner un fichier image valide' }));
        return;
      }

      try {
        const compressedResult = await compressImageByType(file, {
          maxSizeKB: 1024, // 1MB max pour le banner
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85
        });

        if (compressedResult.compressionRatio < 1) {
          const originalSizeKB = Math.round(file.size / 1024);
          const compressedSizeKB = Math.round(compressedResult.compressedSize / 1024);
          toast.info('Banner compressé', {
            description: `Taille réduite de ${originalSizeKB}KB à ${compressedSizeKB}KB`,
            duration: 3000,
          });
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setBannerPreview(result);
          setFormData(prev => ({ ...prev, banner: compressedResult.file }));
          if (errors.banner) {
            setErrors((prev: any) => ({ ...prev, banner: '' as any }));
          }
        };
        reader.readAsDataURL(compressedResult.file);
      } catch (error) {
        console.error('Erreur lors de la compression du banner:', error);
        setErrors((prev: any) => ({ ...prev, banner: 'Erreur lors de la compression du banner' }));
        toast.error('Erreur de compression', {
          description: 'Impossible de compresser le banner. Veuillez réessayer.',
          duration: 4000,
        });
      }
    }
  };

  const removeLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logo: null }));
  };

  const removeBanner = () => {
    setBannerPreview('');
    setFormData(prev => ({ ...prev, banner: null }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<StoreFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du store est obligatoire';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La description doit contenir au moins 10 caractères';
    }

    // Validation des couleurs
    const colorRegex = /^#[0-9A-F]{6}$/i;
    if (!colorRegex.test(formData.primaryColor)) {
      newErrors.primaryColor = 'Format de couleur invalide';
    }
    if (!colorRegex.test(formData.secondaryColor)) {
      newErrors.secondaryColor = 'Format de couleur invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const storeData = {
        name: formData.name,
        description: formData.description,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        logo: formData.logo,
        banner: formData.banner,
      };

      const result = await updateStore({ userId, storeData }).unwrap();

      toast.success(result.message || 'Store mis à jour avec succès', {
        description: `Nom: ${result.data?.name || formData.name}`,
        duration: 4000,
      });

    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du store:', error);

      if (error?.data?.error) {
        toast.error('Erreur lors de la mise à jour', {
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
          description: 'Une erreur est survenue lors de la mise à jour du store',
          duration: 6000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion de contenu</h2>
          <p className="text-gray-600">Personnalisez l'apparence et les informations de votre store</p>
        </div>
      </div>

      {/* Formulaire de modification */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-8">
        {/* Nom du Store */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <Type className="w-4 h-4 inline mr-2" />
            Nom du Store *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="Ex: Ma Boutique Moderne"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description du Store *
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none ${
              errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
            placeholder="Décrivez votre boutique, vos produits et votre vision..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        {/* Couleurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-2" />
              Couleur Principale *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="primaryColor"
                value={formData.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                  errors.primaryColor ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="#4169e1"
              />
            </div>
            {errors.primaryColor && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryColor}</p>
            )}
          </div>

          <div>
            <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-2" />
              Couleur Secondaire *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="secondaryColor"
                value={formData.secondaryColor}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                  errors.secondaryColor ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="#ffa500"
              />
            </div>
            {errors.secondaryColor && (
              <p className="mt-1 text-sm text-red-600">{errors.secondaryColor}</p>
            )}
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo du Store
          </label>

          {!logoPreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200 relative">
              <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Cliquez pour ajouter un logo</p>
              <p className="text-sm text-gray-400">PNG, JPG (compressé à 0.25MB max)</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          ) : (
            <div className="relative">
              <div className="w-32 h-32 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={removeLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errors.logo && (
            <p className="mt-1 text-sm text-red-600">{errors.logo as unknown as string}</p>
          )}
        </div>

        {/* Banner */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Banner du Store
          </label>

          {!bannerPreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200 relative">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Cliquez pour ajouter un banner</p>
              <p className="text-sm text-gray-400">PNG, JPG (compressé à 1MB max)</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          ) : (
            <div className="relative">
              <div className="w-full h-48 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={removeBanner}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {errors.banner && (
            <p className="mt-1 text-sm text-red-600">{errors.banner as unknown as string}</p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex-1"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Mise à jour...' : 'Mettre à jour le store'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreContentManagement;
