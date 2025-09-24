'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Save, Store, Palette, Image, Type, FileImage } from 'lucide-react';
import Link from 'next/link';
import { useGetStoreInfoQuery, useUpdateStoreMutation } from '../../../../../services/api/UserStoreApi';
import { useCurrentUser } from '../../../../../services/hooks/useCurrentUser';
import { toast } from 'sonner';
import { compressImageByType } from '../../../../../utils/imageCompression';
import StoreSidebar from './components/StoreSidebar';
import StoreContentManagement from './components/StoreContentManagement';
import StoreOffersManagement from './components/StoreOffersManagement';
import StoreRepriseRequests from './components/StoreRepriseRequests';
import StoreRecommendations from './components/StoreRecommendations';
import StoreStatistics from './components/StoreStatistics';
import { useResponsive } from './hooks/useResponsive';

interface StoreFormData {
  name: string;
  description: string;
  logo: File | null;
  banner: File | null;
  primaryColor: string;
  secondaryColor: string;
}

const StoreManagePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [activeSection, setActiveSection] = useState('content');
  const { isAuthenticated } = useCurrentUser();
  const { isSidebarVisible } = useResponsive();

  const { data: storeData, isLoading, error } = useGetStoreInfoQuery(userId, {
    skip: !userId || !isAuthenticated
  });

  const [updateStore, { isLoading: isUpdateLoading }] = useUpdateStoreMutation();

  // Gestion de l'erreur d'authentification
  useEffect(() => {
    if (error && 'status' in error) {
      // Vérifier si c'est une erreur d'authentification (401)
      if (error.status === 401 || error.status === 403) {
        console.log('Erreur d\'authentification détectée, redirection vers la page d\'accueil');
        router.push('/');
      }
    }
  }, [error, router]);

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
    if (storeData?.data) {
      const store = storeData.data;
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
  }, [storeData]);

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

      // Redirection vers la page du store
      router.push(`/store/${userId}`);
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

  // Fonction pour rendre le contenu selon la section active
  const renderActiveSection = () => {
    const store = storeData?.data;
    const stats = store?.stats || {};

    switch (activeSection) {
      case 'content':
        return <StoreContentManagement userId={userId} store={store} />;
      case 'offers':
        return <StoreOffersManagement userId={userId} />;
      case 'reprise':
        return <StoreRepriseRequests userId={userId} />;
      case 'recommendations':
        return <StoreRecommendations userId={userId} />;
      case 'statistics':
        return <StoreStatistics userId={userId} store={store} stats={stats} />;
      default:
        return <StoreContentManagement userId={userId} store={store} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des informations du store...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Store non trouvé</h2>
          <p className="text-gray-600">Ce store n'existe pas ou vous n'avez pas les permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex w-full bg-gray-50">
      {/* Sidebar */}
      <StoreSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        store={storeData?.data}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header avec informations du store */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">

                {/* Store Info */}
                <div className="pl-12">
                  <h1 className="text-xl font-semibold text-gray-900">Gérer mon Store</h1>
                  <p className="text-sm text-gray-500">{storeData?.data?.name || 'Mon Store'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/store/${userId}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour au store
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <main className={`flex-1 p-6 bg-gray-50 overflow-y-auto transition-all duration-300 ${
          isSidebarVisible ? 'pl-6 lg:pl-20 xl:pl-28' : 'pl-6'
        }`}>
          <div className="max-w-7xl mx-auto">
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StoreManagePage;

