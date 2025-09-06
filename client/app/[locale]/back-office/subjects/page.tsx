'use client'

import React, { useMemo } from 'react';
import { Plus, Edit3, Trash2, Eye, BookOpen, Calendar, Tag } from 'lucide-react';
import { useGetSubjectsQuery } from '@/services/api/SubjectApi';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Category {
  id: number;
  nameFr: string;
  nameAr: string;
  image: string | null;
}

// Interface pour les données de l'API
interface ApiSubject {
  id: number;
  name: string;
  description: string;
  image: string | null;
  nameAr: string;
  nameFr: string;
  descriptionAr: string;
  descriptionFr: string;
  createdAt: string;
  updatedAt: string;
  categories?: Category[];
}

interface Subject {
  id: number;
  name: string;
  description: string;
  image: string | null;
  nameAr: string;
  nameFr: string;
  descriptionAr: string;
  descriptionFr: string;
  createdAt: string;
  updatedAt: string;
  categories?: Category[];
}

const SubjectsPage: React.FC = () => {
  const router = useRouter();

  // Récupération des données
  const { data: subjectsResponse, isLoading: subjectsLoading, error: subjectsError } = useGetSubjectsQuery({});

  console.log('🔍 SubjectsResponse:', subjectsResponse);
  
  // Transformation des données
  const subjects: Subject[] = useMemo(() => {
    if (!subjectsResponse) return [];
    return subjectsResponse.map((subject: ApiSubject) => ({
      ...subject,
      categories: subject.categories || []
    }));
  }, [subjectsResponse]);

  // Actions
  const handleAddSubject = () => {
    router.push('/back-office/subjects/add');
  };

  const handleEditSubject = (subjectId: number) => {
    router.push(`/back-office/subjects/edit/${subjectId}`);
  };

  const handleViewSubject = (subjectId: number) => {
    router.push(`/back-office/subjects/${subjectId}`);
  };

  const handleDeleteSubject = (subjectId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
      // TODO: Implémenter la suppression
      toast.info('Suppression en cours...', {
        description: 'Cette fonctionnalité sera bientôt disponible'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Matières</h1>
            <p className="text-gray-600">Gérez et organisez vos matières d'enseignement</p>
          </div>
          <button
            onClick={handleAddSubject}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Ajouter une matière</span>
          </button>
        </div>
      </div>


      {/* Loading State */}
      {subjectsLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des matières...</span>
        </div>
      )}

      {/* Error State */}
      {subjectsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erreur lors du chargement des matières
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Impossible de charger les matières. Veuillez réessayer plus tard.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!subjectsLoading && !subjectsError && subjects.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune matière</h3>
          <p className="mt-1 text-sm text-gray-500">Commencez par créer votre première matière.</p>
          <div className="mt-6">
            <button
              onClick={handleAddSubject}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une matière
            </button>
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      {!subjectsLoading && !subjectsError && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleEditSubject}
              onView={handleViewSubject}
              onDelete={handleDeleteSubject}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {!subjectsLoading && !subjectsError && subjects.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{subjects.length}</div>
            <div className="text-sm text-gray-600">Total des matières</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant SubjectCard
interface SubjectCardProps {
  subject: Subject;
  onEdit: (subjectId: number) => void;
  onView: (subjectId: number) => void;
  onDelete: (subjectId: number) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onEdit, onView, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50">
        {subject.image ? (
          <img
            src={subject.image}
            alt={subject.nameFr}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Actions */}
        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onView(subject.id)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors duration-200"
            title="Voir les détails"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => onEdit(subject.id)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors duration-200"
            title="Modifier"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => onDelete(subject.id)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors duration-200"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Titre */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{subject.nameFr}</h3>
          <p className="text-sm text-gray-600" dir="rtl">{subject.nameAr}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {subject.descriptionFr}
        </p>

        {/* Catégories */}
        {subject.categories && subject.categories.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {subject.categories.slice(0, 3).map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {category.nameFr}
                </span>
              ))}
              {subject.categories.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{subject.categories.length - 3} autres
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(subject.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectsPage;
