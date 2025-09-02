'use client'

import React, { useState } from 'react';
import { ArrowLeft, Upload, X, Save, Eye, FileImage, Users, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useInsertCategoryMutation } from '../../../../../services/CategoryApi';

interface CategoryFormData {
    titleFr: string;
    titleAr: string;
    descriptionFr: string;
    descriptionAr: string;
    icon: File | null;
    image: File | null;
    targetGender: 'homme' | 'femme' | 'mixte';
    ageRangeMin: number;
    ageRangeMax: number;
}

const AddCategoryPage: React.FC = () => {
    const router = useRouter();
    const [insertCategory, { isLoading: isInsertCategoryLoading }] = useInsertCategoryMutation();
    
    const [formData, setFormData] = useState<CategoryFormData>({
        titleFr: '',
        titleAr: '',
        descriptionFr: '',
        descriptionAr: '',
        icon: null,
        image: null,
        targetGender: 'mixte',
        ageRangeMin: 0,
        ageRangeMax: 100,
    });

    const [imagePreview, setImagePreview] = useState<string>('');
    const [iconPreview, setIconPreview] = useState<string>('');
    const [errors, setErrors] = useState<Partial<CategoryFormData>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: keyof CategoryFormData, value: string | number | File | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Effacer l'erreur quand l'utilisateur commence à taper
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Gestion de l'upload d'image
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Vérifier que c'est une image
            if (!file.type.startsWith('image/')) {
                setErrors(prev => ({ ...prev, image: 'Veuillez sélectionner un fichier image valide' }));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setImagePreview(result);
                // @ts-ignore
                setFormData(prev => ({ ...prev, image: file }));
                // Effacer l'erreur si elle existait
                if (errors.image) {
                    setErrors(prev => ({ ...prev, image: '' as any }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Gestion de l'upload d'icône SVG
    const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Vérifier que c'est un fichier SVG
            if (file.type !== 'image/svg+xml') {
                setErrors(prev => ({ ...prev, icon: 'Veuillez sélectionner un fichier SVG valide' }));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setIconPreview(result);
                // @ts-ignore
                setFormData(prev => ({ ...prev, icon: file }));
                // Effacer l'erreur si elle existait
                if (errors.icon) {
                    setErrors(prev => ({ ...prev, icon: '' as any }));
                }
            };
            reader.readAsDataURL(file);
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

        if (!formData.image) {
            newErrors.image = 'Une image est obligatoire' as any;
        }

        if (!formData.icon) {
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
            // Appel API pour créer la catégorie
            const result = await insertCategory(formData).unwrap();
            
            console.log('Catégorie créée avec succès:', result);
            
            // Redirection vers la page des catégories
            router.push('/back-office/categories');
        } catch (error: any) {
            console.error('Erreur lors de la création de la catégorie:', error);
            
            // Gestion des erreurs de validation
            if (error?.data?.error) {
                alert(`Erreur: ${error.data.error}`);
            } else {
                alert('Une erreur est survenue lors de la création de la catégorie');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePreview = () => {
        console.log('Aperçu de la catégorie:', formData);
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
                        <span>Retour aux catégories</span>
                    </button>

                    <h1 className="text-3xl font-bold text-gray-900">Ajouter une catégorie</h1>
                    <p className="text-gray-600 mt-2">Créez une nouvelle catégorie parent pour organiser vos contenus</p>
                </div>

                <div className="grid gap-8 w-full relative">
                    {/* Formulaire */}
                    <div className="w-full relative">
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 w-full">
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
                                        <p className="text-gray-600 mb-2">Cliquez pour ajouter une icône SVG</p>
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
                                        <div className="w-full h-32 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                                            <div
                                                className="w-16 h-16"
                                                dangerouslySetInnerHTML={{
                                                    __html: atob(iconPreview.split(',')[1])
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeIcon}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
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
                                        <p className="text-gray-600 mb-2">Cliquez pour ajouter une image</p>
                                        <p className="text-sm text-gray-400">PNG, JPG jusqu'à 10MB</p>
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
                                    disabled={isSubmitting}
                                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex-1"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSubmitting ? 'Création...' : 'Créer la catégorie'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCategoryPage;
