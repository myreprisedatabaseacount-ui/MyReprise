'use client'

import React, { useState } from 'react';
import { ArrowLeft, Upload, X, Save, Eye, FileImage, Award, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { compressImageByType } from '../../../../../utils/imageCompression';

interface BrandFormData {
    nameFr: string;
    nameAr: string;
    descriptionFr: string;
    descriptionAr: string;
    logo: File | null;
    categories: string[];
    isActive: boolean;
}

const AddBrandPage: React.FC = () => {
    const router = useRouter();

    const [formData, setFormData] = useState<BrandFormData>({
        nameFr: '',
        nameAr: '',
        descriptionFr: '',
        descriptionAr: '',
        logo: null,
        categories: [],
        isActive: true,
    });

    const [logoPreview, setLogoPreview] = useState<string>('');
    const [errors, setErrors] = useState<Partial<BrandFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Catégories prédéfinies disponibles
    const availableCategories = [
        'Vêtements', 'Chaussures', 'Sport', 'Mode', 'Accessoires', 
        'Électronique', 'Smartphones', 'Ordinateurs', 'Électroménager',
        'Fitness', 'Beauté', 'Maison', 'Jardin', 'Automobile', 'Loisirs'
    ];

    const handleInputChange = (field: keyof BrandFormData, value: string | boolean | File | null | string[]) => {
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
            // Vérifier que c'est une image
            if (!file.type.startsWith('image/')) {
                setErrors((prev: any) => ({ ...prev, logo: 'Veuillez sélectionner un fichier image valide' }));
                return;
            }

            try {
                // Compresser l'image si nécessaire
                const compressedResult = await compressImageByType(file, {
                    maxSizeKB: 256, // 0.25MB max pour les logos
                    maxWidth: 800,
                    maxHeight: 800,
                    quality: 0.9
                });

                // Toast informatif si compression effectuée
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
                    // Effacer l'erreur si elle existait
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

    const removeLogo = () => {
        setLogoPreview('');
        setFormData(prev => ({ ...prev, logo: null }));
    };

    const toggleCategory = (category: string) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<BrandFormData> = {};

        if (!formData.nameFr.trim()) {
            newErrors.nameFr = 'Le nom en français est obligatoire';
        } else if (formData.nameFr.length < 2) {
            newErrors.nameFr = 'Le nom doit contenir au moins 2 caractères';
        }

        if (!formData.nameAr.trim()) {
            newErrors.nameAr = 'الاسم بالعربية مطلوب';
        } else if (formData.nameAr.length < 2) {
            newErrors.nameAr = 'يجب أن يحتوي الاسم على حرفين على الأقل';
        }

        if (!formData.descriptionFr.trim()) {
            newErrors.descriptionFr = 'La description en français est obligatoire';
        } else if (formData.descriptionFr.length < 10) {
            newErrors.descriptionFr = 'La description doit contenir au moins 10 caractères';
        }

        if (!formData.descriptionAr.trim()) {
            newErrors.descriptionAr = 'الوصف بالعربية مطلوب';
        } else if (formData.descriptionAr.length < 10) {
            newErrors.descriptionAr = 'يجب أن يحتوي الوصف على 10 أحرف على الأقل';
        }

        if (!formData.logo) {
            newErrors.logo = 'Un logo est obligatoire' as any;
        }

        if (formData.categories.length === 0) {
            newErrors.categories = 'Au moins une catégorie doit être sélectionnée' as any;
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
            // TODO: Appel API pour créer la marque
            console.log('Données de la marque à créer:', formData);

            // Simulation d'un délai d'API
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Toast de succès
            toast.success('Marque créée avec succès', {
                description: `Nom: ${formData.nameFr}`,
                duration: 4000,
            });

            // Redirection vers la page des marques
            router.push('/back-office/brands');
        } catch (error: any) {
            console.error('Erreur lors de la création de la marque:', error);

            // Gestion des erreurs avec toast
            toast.error('Erreur lors de la création', {
                description: 'Une erreur est survenue lors de la création de la marque',
                duration: 6000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreview = () => {
        console.log('Aperçu de la marque:', formData);
    };

    return (
        <div className="min-h-screen relative flex justify-center">
            <div className="w-full relative mx-auto">
                {/* Header */}
                <div className="mb-8 w-full">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Retour aux marques</span>
                    </button>

                    <h1 className="text-3xl font-bold text-gray-900">Ajouter une marque</h1>
                    <p className="text-gray-600 mt-2">Créez une nouvelle marque pour votre catalogue</p>
                </div>

                <div className="grid gap-8 w-full relative">
                    {/* Formulaire */}
                    <div className="w-full relative">
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 w-full">
                            {/* Nom en Français */}
                            <div>
                                <label htmlFor="nameFr" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom en Français *
                                </label>
                                <input
                                    type="text"
                                    id="nameFr"
                                    value={formData.nameFr}
                                    onChange={(e) => handleInputChange('nameFr', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.nameFr ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    placeholder="Ex: Adidas"
                                    dir="ltr"
                                />
                                {errors.nameFr && (
                                    <p className="mt-1 text-sm text-red-600">{errors.nameFr}</p>
                                )}
                            </div>

                            {/* Nom en Arabe */}
                            <div>
                                <label htmlFor="nameAr" className="block text-sm font-medium text-gray-700 mb-2">
                                    الاسم بالعربية *
                                </label>
                                <input
                                    type="text"
                                    id="nameAr"
                                    value={formData.nameAr}
                                    onChange={(e) => handleInputChange('nameAr', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.nameAr ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    placeholder="مثال: أديداس"
                                    dir="rtl"
                                />
                                {errors.nameAr && (
                                    <p className="mt-1 text-sm text-red-600 text-right" dir="rtl">{errors.nameAr}</p>
                                )}
                            </div>

                            {/* Description en Français */}
                            <div>
                                <label htmlFor="descriptionFr" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description en Français *
                                </label>
                                <textarea
                                    id="descriptionFr"
                                    rows={4}
                                    value={formData.descriptionFr}
                                    onChange={(e) => handleInputChange('descriptionFr', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none ${errors.descriptionFr ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    placeholder="Description de la marque en français"
                                    dir="ltr"
                                />
                                {errors.descriptionFr && (
                                    <p className="mt-1 text-sm text-red-600">{errors.descriptionFr}</p>
                                )}
                            </div>

                            {/* Description en Arabe */}
                            <div>
                                <label htmlFor="descriptionAr" className="block text-sm font-medium text-gray-700 mb-2">
                                    الوصف بالعربية *
                                </label>
                                <textarea
                                    id="descriptionAr"
                                    rows={4}
                                    value={formData.descriptionAr}
                                    onChange={(e) => handleInputChange('descriptionAr', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none ${errors.descriptionAr ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    placeholder="وصف العلامة التجارية بالعربية"
                                    dir="rtl"
                                />
                                {errors.descriptionAr && (
                                    <p className="mt-1 text-sm text-red-600 text-right" dir="rtl">{errors.descriptionAr}</p>
                                )}
                            </div>

                            {/* Catégories */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Tag className="w-4 h-4 inline mr-2" />
                                    Catégories *
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {availableCategories.map((category) => (
                                        <label
                                            key={category}
                                            className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors duration-200 ${
                                                formData.categories.includes(category)
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.categories.includes(category)}
                                                onChange={() => toggleCategory(category)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium">{category}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.categories && (
                                    <p className="mt-1 text-sm text-red-600">{errors.categories as unknown as string}</p>
                                )}
                                <div className="mt-2 text-sm text-gray-500">
                                    {formData.categories.length} catégorie(s) sélectionnée(s)
                                </div>
                            </div>

                            {/* Statut */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Award className="w-4 h-4 inline mr-2" />
                                    Statut de la marque
                                </label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={() => handleInputChange('isActive', true)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-green-700">Active</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="isActive"
                                            checked={!formData.isActive}
                                            onChange={() => handleInputChange('isActive', false)}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-red-700">Inactive</span>
                                    </label>
                                </div>
                            </div>

                            {/* Upload de logo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Logo de la marque *
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
                                        <div className="w-full h-48 relative border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={logoPreview}
                                                alt="Aperçu du logo"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeLogo}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {errors.logo && (
                                    <p className="mt-1 text-sm text-red-600">{errors.logo as unknown as string}</p>
                                )}
                            </div>

                            {/* Boutons d'action */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handlePreview}
                                    className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>Aperçu</span>
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex-1"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSubmitting ? 'Création...' : 'Créer la marque'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddBrandPage;
