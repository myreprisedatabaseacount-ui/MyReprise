'use client'

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Upload, X, Save, Eye, FileImage, Award, Tag, ChevronDown, ChevronRight, Folder, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetAllCategoriesQuery } from '../../../../../services/api/CategoryApi';
import { useCreateBrandMutation } from '../../../../../services/api/BrandApi';
import { toast } from 'sonner';
import { compressImageByType } from '../../../../../utils/imageCompression';
import CategoryFiltersBar from '../../../../../components/common/CategoryFiltersBar';

interface BrandFormData {
    nameFr: string;
    nameAr: string;
    descriptionFr: string;
    descriptionAr: string;
    logo: File | null;
    categoryIds: number[];
}

interface ApiCategory {
    id: number;
    name: string;
    description: string;
    image: string | null;
    icon: string | null;
    parentId: number | null;
    gender: 'male' | 'female' | 'mixte';
    ageMin: number;
    ageMax: number;
}

interface Category {
    id: number;
    name: string;
    description: string;
    image: string | null;
    icon: string | null;
    parentId: number | null;
    gender: 'male' | 'female' | 'mixte';
    ageMin: number;
    ageMax: number;
    children: Category[];
    isSelected?: boolean;
    isExpanded?: boolean;
}

const AddBrandPage: React.FC = () => {
    const router = useRouter();
    
    // États pour la pagination des catégories
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [categoryPage, setCategoryPage] = useState(1);
    const [categoryLimit, setCategoryLimit] = useState(10);
    
    const { data: categoriesResponse, isLoading: categoriesLoading } = useGetAllCategoriesQuery({
        search: categorySearchTerm || undefined,
        page: categoryPage,
        limit: categoryLimit
    });
    const [createBrand, { isLoading: isCreateBrandLoading }] = useCreateBrandMutation();

    const [formData, setFormData] = useState<BrandFormData>({
        nameFr: '',
        nameAr: '',
        descriptionFr: '',
        descriptionAr: '',
        logo: null,
        categoryIds: [],
    });

    const [logoPreview, setLogoPreview] = useState<string>('');
    const [errors, setErrors] = useState<Partial<BrandFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    // Fonction pour construire l'arbre des catégories
    const buildCategoryTree = (categories: ApiCategory[]): Category[] => {
        const categoryMap = new Map<number, Category>();
        const rootCategories: Category[] = [];

        // Créer un map de toutes les catégories
        categories.forEach(cat => {
            categoryMap.set(cat.id, {
                ...cat,
                children: [],
                isSelected: formData.categoryIds.includes(cat.id),
                isExpanded: expandedCategories.has(cat.id)
            });
        });

        // Construire l'arbre
        categories.forEach(cat => {
            const category = categoryMap.get(cat.id)!;
            if (cat.parentId === null) {
                rootCategories.push(category);
            } else {
                const parent = categoryMap.get(cat.parentId);
                if (parent) {
                    parent.children.push(category);
                }
            }
        });

        return rootCategories;
    };

    // Construire l'arbre des catégories à partir des données de l'API
    const categoriesTree = useMemo(() => {
        if (!categoriesResponse?.data) return [];
        return buildCategoryTree(categoriesResponse.data);
    }, [categoriesResponse, formData.categoryIds, expandedCategories]);

    const handleInputChange = (field: keyof BrandFormData, value: string | boolean | File | null | number[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Effacer l'erreur quand l'utilisateur commence à taper
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
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

    // Fonction pour basculer la sélection d'une catégorie
    const toggleCategorySelection = (categoryId: number) => {
        setFormData(prev => {
            const newCategoryIds = prev.categoryIds.includes(categoryId)
                ? prev.categoryIds.filter(id => id !== categoryId)
                : [...prev.categoryIds, categoryId];
            return { ...prev, categoryIds: newCategoryIds };
        });
    };

    // Fonctions de gestion de la pagination des catégories
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

        if (formData.categoryIds.length === 0) {
            newErrors.categoryIds = 'Au moins une catégorie doit être sélectionnée' as any;
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
            // Préparer les données pour l'envoi avec FormData
            const formDataToSend = new FormData();
            formDataToSend.append('nameAr', formData.nameAr);
            formDataToSend.append('nameFr', formData.nameFr);
            formDataToSend.append('descriptionAr', formData.descriptionAr);
            formDataToSend.append('descriptionFr', formData.descriptionFr);
            formDataToSend.append('categoryIds', JSON.stringify(formData.categoryIds));
            
            if (formData.logo) {
                formDataToSend.append('logo', formData.logo);
            }

            // Appel API pour créer la marque
            const result = await createBrand(formDataToSend).unwrap();

            // Toast de succès (le wrapper baseQuery gère déjà la vérification de success)
            toast.success(result.message || 'Marque créée avec succès', {
                description: `Nom: ${result.data?.nameFr || formData.nameFr}`,
                duration: 4000,
            });

            // Redirection vers la page des marques
            router.push('/back-office/brands');
        } catch (error: any) {
            console.error('❌ Erreur lors de la création de la marque:', error);

            // Gestion des erreurs avec toast
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
            } else if (error?.message) {
                toast.error('Erreur de connexion', {
                    description: error.message,
                    duration: 6000,
                });
            } else {
                toast.error('Erreur inattendue', {
                    description: 'Une erreur est survenue lors de la création de la marque',
                    duration: 6000,
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Composant pour afficher une catégorie dans l'arbre
    const CategoryTreeNode: React.FC<{ category: Category; level: number }> = ({ category, level }) => {
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = formData.categoryIds.includes(category.id);

        return (
            <div className="ml-4">
                <div
                    className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${isSelected ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                    style={{ marginLeft: `${level * 20}px` }}
                >
                    {/* Bouton d'expansion */}
                    {category.children.length > 0 && (
                        <button
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

                    {/* Icône de catégorie */}
                    <div className="w-6 h-6 flex items-center justify-center">
                        {category.image ? (
                            <img
                                src={category.image}
                                alt={category.name}
                                className="w-6 h-6 rounded object-cover"
                            />
                        ) : (
                            <Folder className="w-5 h-5 text-gray-400" />
                        )}
                    </div>

                    {/* Checkbox de sélection */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleCategorySelection(category.id);
                        }}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'border-gray-300 hover:border-blue-400'
                            }`}
                    >
                        {isSelected && <Check className="w-3 h-3" />}
                    </button>

                    {/* Nom de la catégorie */}
                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                        {category.name}
                    </span>

                    {/* Badge genre/âge */}
                    <div className="flex items-center space-x-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {category.gender === 'male' ? 'Homme' : category.gender === 'female' ? 'Femme' : 'Mixte'}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {category.ageMin}-{category.ageMax} ans
                        </span>
                    </div>
                </div>

                {/* Sous-catégories */}
                {isExpanded && category.children.length > 0 && (
                    <div className="mt-1">
                        {category.children.map((child) => (
                            <CategoryTreeNode
                                key={child.id}
                                category={child}
                                level={level + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
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

                            {/* Sélection des catégories */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Folder className="w-4 h-4 inline mr-2" />
                                    Catégories associées *
                                </label>

                                {/* Barre de filtres pour les catégories */}
                                <CategoryFiltersBar
                                    searchTerm={categorySearchTerm}
                                    currentPage={categoryPage}
                                    totalPages={categoriesResponse?.totalPages || 0}
                                    limit={categoryLimit}
                                    onSearchChange={handleCategorySearchChange}
                                    onPageChange={handleCategoryPageChange}
                                    onLimitChange={handleCategoryLimitChange}
                                    totalCount={categoriesResponse?.totalCount || 0}
                                    isLoading={categoriesLoading}
                                />

                                {categoriesLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <span className="ml-2 text-gray-600">Chargement des catégories...</span>
                                    </div>
                                ) : (
                                    <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                                        {categoriesTree.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">
                                                Aucune catégorie disponible
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {categoriesTree.map((category) => (
                                                    <CategoryTreeNode
                                                        key={category.id}
                                                        category={category}
                                                        level={0}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {formData.categoryIds.length > 0 && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        {formData.categoryIds.length} catégorie(s) sélectionnée(s)
                                    </div>
                                )}

                                {errors.categoryIds && (
                                    <p className="mt-1 text-sm text-red-600">{errors.categoryIds as unknown as string}</p>
                                )}
                            </div>

                            {/* Note: Le statut isActive a été supprimé car le champ n'existe pas dans la base de données */}

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
                                    type="submit"
                                    disabled={isSubmitting || isCreateBrandLoading}
                                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex-1"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSubmitting || isCreateBrandLoading ? 'Création...' : 'Créer la marque'}</span>
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
