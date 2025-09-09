'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Save, Eye, Folder, FileImage, Users, Calendar, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useGetCategoryByIdQuery, useUpdateCategoryMutation } from '../../../../../../services/api/CategoryApi';
import { compressImageByType } from '../../../../../../utils/imageCompression';
import { toast } from 'sonner';

interface CategoryFormData {
    titleFr: string;
    titleAr: string;
    descriptionFr: string;
    descriptionAr: string;
    icon: File | null;
    image: File | null;
    parentId: string | null;
    targetGender: 'homme' | 'femme' | 'mixte';
    ageRangeMin: number;
    ageRangeMax: number;
    listingType: 'item' | 'vehicle' | 'property' | '';
}

const EditCategoryPage: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const categoryId = params.id as string;
    
    const { data: categoryData, isLoading: isCategoryLoading, error: categoryError } = useGetCategoryByIdQuery(categoryId);
    const [updateCategory, { isLoading: isUpdateLoading }] = useUpdateCategoryMutation();

    const [formData, setFormData] = useState<CategoryFormData>({
        titleFr: '',
        titleAr: '',
        descriptionFr: '',
        descriptionAr: '',
        icon: null,
        image: null,
        parentId: null,
        targetGender: 'mixte',
        ageRangeMin: 0,
        ageRangeMax: 100,
        listingType: '',
    });

    const [imagePreview, setImagePreview] = useState<string>('');
    const [iconPreview, setIconPreview] = useState<string>('');
    const [errors, setErrors] = useState<Partial<CategoryFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Charger les données de la catégorie
    useEffect(() => {
        if (categoryData?.data) {
            const category = categoryData.data;
            setFormData({
                titleFr: category.nameFr || '',
                titleAr: category.nameAr || '',
                descriptionFr: category.descriptionFr || '',
                descriptionAr: category.descriptionAr || '',
                icon: null, // Pas de fichier par défaut
                image: null, // Pas de fichier par défaut
                parentId: category.parentId || null,
                targetGender: category.gender === 'male' ? 'homme' : 
                             category.gender === 'female' ? 'femme' : 'mixte',
                ageRangeMin: category.ageMin || 0,
                ageRangeMax: category.ageMax || 100,
                listingType: category.listingType || '',
            });

            // Charger les aperçus des images existantes
            if (category.image) {
                setImagePreview(category.image);
            }
            if (category.icon) {
                setIconPreview(category.icon);
            }
        }
    }, [categoryData]);

    const handleInputChange = (field: keyof CategoryFormData, value: string | number | File | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Effacer l'erreur quand l'utilisateur commence à taper
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Gestion de l'upload d'image avec compression
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Vérifier que c'est une image
            if (!file.type.startsWith('image/')) {
                setErrors((prev: any) => ({ ...prev, image: 'Veuillez sélectionner un fichier image valide' }));
                return;
            }

            try {
                // Compresser l'image si nécessaire
                const compressedResult = await compressImageByType(file, {
                    maxSizeKB: 512, // 0.5MB max
                    maxWidth: 1920,
                    maxHeight: 1920,
                    quality: 0.85
                });

                // Toast informatif si compression effectuée
                if (compressedResult.compressionRatio < 1) {
                    const originalSizeKB = Math.round(file.size / 1024);
                    const compressedSizeKB = Math.round(compressedResult.compressedSize / 1024);
                    toast.info('Image compressée', {
                        description: `Taille réduite de ${originalSizeKB}KB à ${compressedSizeKB}KB`,
                        duration: 3000,
                    });
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    setImagePreview(result);
                    setFormData(prev => ({ ...prev, image: compressedResult.file }));
                    // Effacer l'erreur si elle existait
                    if (errors.image) {
                        setErrors(prev => ({ ...prev, image: '' as any }));
                    }
                };
                reader.readAsDataURL(compressedResult.file);
            } catch (error) {
                console.error('Erreur lors de la compression de l\'image:', error);
                setErrors((prev: any) => ({ ...prev, image: 'Erreur lors de la compression de l\'image' }));
                toast.error('Erreur de compression', {
                    description: 'Impossible de compresser l\'image. Veuillez réessayer.',
                    duration: 4000,
                });
            }
        }
    };

    // Gestion de l'upload d'icône SVG avec compression
    const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Vérifier que c'est un fichier SVG
            if (file.type !== 'image/svg+xml') {
                setErrors((prev: any) => ({ ...prev, icon: 'Veuillez sélectionner un fichier SVG valide' }));
                return;
            }

            try {
                // Compresser l'icône SVG si nécessaire
                const compressedResult = await compressImageByType(file);

                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    setIconPreview(result);
                    setFormData(prev => ({ ...prev, icon: compressedResult.file }));
                    // Effacer l'erreur si elle existait
                    if (errors.icon) {
                        setErrors(prev => ({ ...prev, icon: '' as any }));
                    }
                };
                reader.readAsDataURL(compressedResult.file);
            } catch (error) {
                console.error('Erreur lors de la compression de l\'icône:', error);
                setErrors((prev: any) => ({ ...prev, icon: 'Erreur lors de la compression de l\'icône' }));
                toast.error('Erreur de compression', {
                    description: 'Impossible de traiter l\'icône SVG. Veuillez réessayer.',
                    duration: 4000,
                });
            }
        }
    };

    const removeImage = () => {
        setImagePreview('');
        setFormData(prev => ({ ...prev, image: null }));
    };

    const removeIcon = () => {
        setIconPreview('');
        setFormData(prev => ({ ...prev, icon: null }));
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<CategoryFormData> = {};

        if (!formData.titleFr.trim()) {
            newErrors.titleFr = 'Le titre en français est obligatoire';
        } else if (formData.titleFr.length < 3) {
            newErrors.titleFr = 'Le titre doit contenir au moins 3 caractères';
        }

        if (!formData.titleAr.trim()) {
            newErrors.titleAr = 'العنوان بالعربية مطلوب';
        } else if (formData.titleAr.length < 3) {
            newErrors.titleAr = 'يجب أن يحتوي العنوان على 3 أحرف على الأقل';
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

        // Pour l'édition, l'image et l'icône ne sont pas obligatoires si elles existent déjà
        if (!formData.image && !imagePreview) {
            newErrors.image = 'Une image est obligatoire' as any;
        }

        if (!formData.icon && !iconPreview) {
            newErrors.icon = 'Une icône SVG est obligatoire' as any;
        }

        if (formData.ageRangeMin < 0 || formData.ageRangeMin > 120) {
            newErrors.ageRangeMin = 'L\'âge minimum doit être entre 0 et 120 ans' as any;
        }

        if (formData.ageRangeMax < 0 || formData.ageRangeMax > 120) {
            newErrors.ageRangeMax = 'L\'âge maximum doit être entre 0 et 120 ans' as any;
        }

        if (formData.ageRangeMin >= formData.ageRangeMax) {
            newErrors.ageRangeMax = 'L\'âge maximum doit être supérieur à l\'âge minimum' as any;
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
            // Appel API pour mettre à jour la catégorie
            const result = await updateCategory({
                id: categoryId,
                nameAr: formData.titleAr,
                nameFr: formData.titleFr,
                descriptionAr: formData.descriptionAr,
                descriptionFr: formData.descriptionFr,
                gender: formData.targetGender,
                ageMin: formData.ageRangeMin,
                ageMax: formData.ageRangeMax,
                parentId: formData.parentId,
                listingType: formData.listingType || null,
                image: formData.image,
                icon: formData.icon
            }).unwrap();
            
            console.log('📤 Données envoyées au backend pour mise à jour:', {
                id: categoryId,
                nameAr: formData.titleAr,
                nameFr: formData.titleFr,
                descriptionAr: formData.descriptionAr,
                descriptionFr: formData.descriptionFr,
                gender: formData.targetGender,
                ageMin: formData.ageRangeMin,
                ageMax: formData.ageRangeMax,
                parentId: formData.parentId,
                listingType: formData.listingType || null,
                image: formData.image,
                icon: formData.icon
            });
            console.log('Catégorie mise à jour avec succès:', result);
            
            // Toast de succès
            toast.success(result.message || 'Catégorie mise à jour avec succès', {
                description: `Titre: ${result.data?.nameFr || formData.titleFr}`,
                duration: 4000,
            });
            
            // Redirection vers la page des catégories
            router.push('/back-office/categories');
        } catch (error: any) {
            console.error('Erreur lors de la mise à jour de la catégorie:', error);
            
            // Gestion des erreurs avec toast
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
                    description: 'Une erreur est survenue lors de la mise à jour de la catégorie',
                    duration: 6000,
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreview = () => {
        console.log('Aperçu de la catégorie:', formData);
    };

    // Affichage du loading
    if (isCategoryLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Chargement de la catégorie...</span>
                </div>
            </div>
        );
    }

    // Affichage de l'erreur
    if (categoryError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
                    <p className="text-gray-600 mb-4">Impossible de charger la catégorie</p>
                    <button
                        onClick={() => router.push('/back-office/categories')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retour aux catégories
                    </button>
                </div>
            </div>
        );
    }

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
                        <span>Retour aux catégories</span>
                    </button>

                    <h1 className="text-3xl font-bold text-gray-900">Modifier la catégorie</h1>
                    <p className="text-gray-600 mt-2">
                        Modifiez les informations de la catégorie{' '}
                        <span className="font-medium text-blue-600">{formData.titleFr || '...'}</span>
                    </p>
                </div>

                <div className="grid gap-8 w-full relative">
                    {/* Formulaire */}
                    <div className="w-full relative">
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 w-full">
                            {/* Information sur la catégorie parent si applicable */}
                            {formData.parentId && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2">
                                        <Folder className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">
                                            Catégorie parent: {formData.parentId}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Titre en Français */}
                            <div>
                                <label htmlFor="titleFr" className="block text-sm font-medium text-gray-700 mb-2">
                                    Titre en Français *
                                </label>
                                <input
                                    type="text"
                                    id="titleFr"
                                    value={formData.titleFr}
                                    onChange={(e) => handleInputChange('titleFr', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.titleFr ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    placeholder="Ex: Design & Créativité"
                                    dir="ltr"
                                />
                                {errors.titleFr && (
                                    <p className="mt-1 text-sm text-red-600">{errors.titleFr}</p>
                                )}
                            </div>

                            {/* Titre en Arabe */}
                            <div>
                                <label htmlFor="titleAr" className="block text-sm font-medium text-gray-700 mb-2">
                                    العنوان بالعربية *
                                </label>
                                <input
                                    type="text"
                                    id="titleAr"
                                    value={formData.titleAr}
                                    onChange={(e) => handleInputChange('titleAr', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.titleAr ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                        }`}
                                    placeholder="مثال: التصميم والإبداع"
                                    dir="rtl"
                                />
                                {errors.titleAr && (
                                    <p className="mt-1 text-sm text-red-600 text-right" dir="rtl">{errors.titleAr}</p>
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
                                    placeholder="Outils et ressources pour la création visuelle et l'expérience utilisateur"
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
                                    placeholder="أدوات وموارد للإبداع البصري وتجربة المستخدم"
                                    dir="rtl"
                                />
                                {errors.descriptionAr && (
                                    <p className="mt-1 text-sm text-red-600 text-right" dir="rtl">{errors.descriptionAr}</p>
                                )}
                            </div>

                            {/* Genre Cible */}
                            <div>
                                <label htmlFor="targetGender" className="block text-sm font-medium text-gray-700 mb-2">
                                    <Users className="w-4 h-4 inline mr-2" />
                                    Genre Cible *
                                </label>
                                <select
                                    id="targetGender"
                                    value={formData.targetGender}
                                    onChange={(e) => handleInputChange('targetGender', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                >
                                    <option value="mixte">Mixte (Hommes et Femmes)</option>
                                    <option value="homme">Hommes uniquement</option>
                                    <option value="femme">Femmes uniquement</option>
                                </select>
                            </div>

                            {/* Type de Listing */}
                            <div>
                                <label htmlFor="listingType" className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de Listing
                                </label>
                                <select
                                    id="listingType"
                                    value={formData.listingType}
                                    onChange={(e) => handleInputChange('listingType', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                >
                                    <option value="">Sélectionner un type (optionnel)</option>
                                    <option value="item">Article</option>
                                    <option value="vehicle">Véhicule</option>
                                    <option value="property">Propriété</option>
                                </select>
                            </div>

                            {/* Tranche d'âge */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Tranche d'âge Cible *
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="ageRangeMin" className="block text-xs text-gray-500 mb-1">
                                            Âge minimum
                                        </label>
                                        <input
                                            type="number"
                                            id="ageRangeMin"
                                            min="0"
                                            max="120"
                                            value={formData.ageRangeMin}
                                            onChange={(e) => handleInputChange('ageRangeMin', parseInt(e.target.value) || 0)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.ageRangeMin ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                            placeholder="0"
                                        />
                                        {errors.ageRangeMin && (
                                            <p className="mt-1 text-sm text-red-600">{errors.ageRangeMin}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="ageRangeMax" className="block text-xs text-gray-500 mb-1">
                                            Âge maximum
                                        </label>
                                        <input
                                            type="number"
                                            id="ageRangeMax"
                                            min="0"
                                            max="120"
                                            value={formData.ageRangeMax}
                                            onChange={(e) => handleInputChange('ageRangeMax', parseInt(e.target.value) || 0)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.ageRangeMax ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                            placeholder="100"
                                        />
                                        {errors.ageRangeMax && (
                                            <p className="mt-1 text-sm text-red-600">{errors.ageRangeMax}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-500">
                                    Tranche d'âge: {formData.ageRangeMin} - {formData.ageRangeMax} ans
                                </div>
                            </div>

                            {/* Icône SVG */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Icône de la catégorie (SVG) *
                                </label>

                                {!iconPreview ? (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200 relative">
                                        <FileImage className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 mb-2">Cliquez pour changer l'icône SVG</p>
                                        <p className="text-sm text-gray-400">Fichiers SVG uniquement</p>
                                        <input
                                            type="file"
                                            accept=".svg,image/svg+xml"
                                            onChange={handleIconUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="w-full h-32 relative border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                                            {formData.icon ? (
                                                // Nouveau fichier uploadé
                                                <div
                                                    className="w-32 h-32 flex items-center justify-center"
                                                    dangerouslySetInnerHTML={{
                                                        __html: atob(iconPreview.split(',')[1])
                                                    }}
                                                />
                                            ) : (
                                                // Image existante
                                                <img
                                                    src={iconPreview}
                                                    alt="Icône actuelle"
                                                    className="w-32 h-32 object-contain"
                                                />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeIcon}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="mt-2 text-center">
                                            <input
                                                type="file"
                                                accept=".svg,image/svg+xml"
                                                onChange={handleIconUpload}
                                                className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Cliquez pour changer l'icône</p>
                                        </div>
                                    </div>
                                )}

                                {errors.icon && (
                                    <p className="mt-1 text-sm text-red-600">{errors.icon as unknown as string}</p>
                                )}
                            </div>

                            {/* Upload d'image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Image de la catégorie *
                                </label>

                                {!imagePreview ? (
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200 relative">
                                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600 mb-2">Cliquez pour changer l'image</p>
                                        <p className="text-sm text-gray-400">PNG, JPG (compressé à 0.5MB max)</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Aperçu"
                                            className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="mt-2 text-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Cliquez pour changer l'image</p>
                                        </div>
                                    </div>
                                )}

                                {errors.image && (
                                    <p className="mt-1 text-sm text-red-600">{errors.image as unknown as string}</p>
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
                                    disabled={isSubmitting || isUpdateLoading}
                                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex-1"
                                >
                                    {isSubmitting || isUpdateLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    <span>{isSubmitting || isUpdateLoading ? 'Mise à jour...' : 'Mettre à jour la catégorie'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditCategoryPage;
