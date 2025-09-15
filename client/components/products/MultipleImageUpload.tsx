'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { compressImageByType } from '../../utils/imageCompression';
import { toast } from 'sonner';

interface MultipleImageUploadProps {
  images: File[];
  setImages: (images: File[]) => void;
  maxImages?: number;
  minImages?: number;
  className?: string;
}

interface ImagePreview {
  file: File;
  preview: string;
  compressed: boolean;
}

const MultipleImageUpload: React.FC<MultipleImageUploadProps> = ({
  images,
  setImages,
  maxImages = 10,
  minImages = 1,
  className = ''
}) => {
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mettre à jour les previews quand les images changent
  React.useEffect(() => {
    const newPreviews: ImagePreview[] = images.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      compressed: true // On assume que les images sont déjà compressées
    }));
    setImagePreviews(newPreviews);
    
    // Nettoyer les URLs précédentes
    return () => {
      newPreviews.forEach(preview => URL.revokeObjectURL(preview.preview));
    };
  }, [images]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`);
      return;
    }

    setIsCompressing(true);
    const compressedFiles: File[] = [];

    try {
      for (const file of files) {
        // Vérifier que c'est une image
        if (!file.type.startsWith('image/')) {
          toast.error(`Le fichier ${file.name} n'est pas une image valide`);
          continue;
        }

        try {
          // Compresser l'image
          const compressedResult = await compressImageByType(file, {
            maxSizeKB: 512, // 0.5MB max
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85
          });

          compressedFiles.push(compressedResult.file);

          // Toast informatif si compression effectuée
          if (compressedResult.compressionRatio < 1) {
            const originalSizeKB = Math.round(file.size / 1024);
            const compressedSizeKB = Math.round(compressedResult.compressedSize / 1024);
            toast.info('Image compressée', {
              description: `${file.name}: ${originalSizeKB}KB → ${compressedSizeKB}KB`,
              duration: 2000,
            });
          }
        } catch (error) {
          console.error('Erreur compression:', error);
          toast.error(`Erreur lors de la compression de ${file.name}`);
        }
      }

      // Ajouter les fichiers compressés
      setImages([...images, ...compressedFiles]);

      if (compressedFiles.length > 0) {
        toast.success(`${compressedFiles.length} image(s) ajoutée(s)`, {
          duration: 2000,
        });
      }

    } finally {
      setIsCompressing(false);
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    // Ajuster l'index courant de manière plus robuste
    if (newImages.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= newImages.length) {
      // Si l'index courant est au-delà de la nouvelle longueur
      setCurrentIndex(newImages.length - 1);
    } else if (currentIndex > index) {
      // Si on supprime une image avant l'index courant, décrémenter
      setCurrentIndex(currentIndex - 1);
    }
    // Si currentIndex < index, on ne fait rien car l'index reste valide
  };

  const nextImage = () => {
    if (imagePreviews.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % imagePreviews.length);
    }
  };

  const prevImage = () => {
    if (imagePreviews.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + imagePreviews.length) % imagePreviews.length);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Zone d'upload */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={isCompressing}
        />
        
        {imagePreviews.length === 0 ? (
          <div 
            onClick={openFileDialog}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200 cursor-pointer"
          >
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Cliquez pour ajouter des photos</p>
            <p className="text-sm text-gray-400">
              {minImages === maxImages 
                ? `Ajoutez ${maxImages} photo${maxImages > 1 ? 's' : ''}`
                : `Minimum ${minImages}, maximum ${maxImages} photos`
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG (compressé automatiquement)</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Affichage principal avec slider */}
            <div className="relative">
              <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden relative">
                <img
                  src={imagePreviews[currentIndex]?.preview}
                  alt={`Photo ${currentIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Bouton supprimer */}
                <button
                  onClick={() => removeImage(currentIndex)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {/* Navigation slider */}
                {imagePreviews.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors duration-200"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors duration-200"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                {/* Indicateurs de position */}
                {imagePreviews.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {imagePreviews.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                          index === currentIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Compteur */}
              <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {currentIndex + 1} / {imagePreviews.length}
              </div>
            </div>

            {/* Miniatures */}
            {imagePreviews.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {imagePreviews.map((preview, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors duration-200 ${
                      index === currentIndex 
                        ? 'border-blue-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={preview.preview}
                      alt={`Miniature ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Bouton ajouter plus */}
            {imagePreviews.length < maxImages && (
              <button
                onClick={openFileDialog}
                disabled={isCompressing}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors duration-200 disabled:opacity-50"
              >
                <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <span className="text-gray-600">
                  {isCompressing ? 'Compression en cours...' : 'Ajouter plus de photos'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages d'erreur/validation */}
      {imagePreviews.length > 0 && imagePreviews.length < minImages && (
        <p className="text-red-500 text-sm">
          Au moins {minImages} photo{minImages > 1 ? 's' : ''} requise{minImages > 1 ? 's' : ''}
        </p>
      )}
      
      {imagePreviews.length >= maxImages && (
        <p className="text-blue-600 text-sm">
          Maximum {maxImages} photos atteint
        </p>
      )}
    </div>
  );
};

export default MultipleImageUpload;
