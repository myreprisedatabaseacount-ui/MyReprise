"""
Service d'Embedding
Responsable de la génération et gestion des embeddings vectoriels
"""

import logging
import numpy as np
from typing import List, Dict, Optional, Union
import asyncio
from sentence_transformers import SentenceTransformer
import faiss
import json
import os
from datetime import datetime

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service de gestion des embeddings vectoriels pour le chatbot"""
    
    def __init__(self, model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
        self.model_name = model_name
        self.model = None
        self.faiss_index = None
        self.dimension = 384  # Dimension pour le modèle multilingue
        self.embeddings_metadata = {}
        
    async def initialize(self):
        """Initialise le service d'embedding"""
        try:
            logger.info(f"Chargement du modèle d'embedding: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("Modèle d'embedding chargé avec succès")
            
            # Initialiser l'index FAISS
            self.faiss_index = faiss.IndexFlatIP(self.dimension)  # Inner Product pour similarité cosinus
            logger.info("Index FAISS initialisé")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation du service d'embedding: {e}")
            raise
    
    async def generate_text_embedding(self, text: str) -> np.ndarray:
        """
        Génère un embedding pour un texte
        
        Args:
            text: Texte à encoder
            
        Returns:
            Vecteur d'embedding numpy
        """
        try:
            if not self.model:
                await self.initialize()
            
            # Nettoyer et normaliser le texte
            cleaned_text = self._clean_text(text)
            
            # Générer l'embedding
            embedding = self.model.encode(cleaned_text, convert_to_numpy=True)
            
            # Normaliser pour la similarité cosinus
            embedding = embedding / np.linalg.norm(embedding)
            
            return embedding
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération d'embedding: {e}")
            raise
    
    async def generate_offer_embedding(self, offer_data: Dict) -> np.ndarray:
        """
        Génère un embedding pour une offre MyReprise
        
        Args:
            offer_data: Données de l'offre
            
        Returns:
            Vecteur d'embedding numpy
        """
        try:
            # Construire le texte à encoder
            text_parts = []
            
            # Titre
            if offer_data.get('title'):
                text_parts.append(offer_data['title'])
            
            # Description
            if offer_data.get('description'):
                text_parts.append(offer_data['description'])
            
            # Catégorie
            if offer_data.get('category', {}).get('nameFr'):
                text_parts.append(f"Catégorie: {offer_data['category']['nameFr']}")
            
            # Marque
            if offer_data.get('brand', {}).get('nameFr'):
                text_parts.append(f"Marque: {offer_data['brand']['nameFr']}")
            
            # Sujet
            if offer_data.get('subject', {}).get('nameFr'):
                text_parts.append(f"Sujet: {offer_data['subject']['nameFr']}")
            
            # Condition
            if offer_data.get('productCondition'):
                condition_map = {
                    'new': 'Neuf',
                    'like_new': 'Comme neuf',
                    'good': 'Bon état',
                    'fair': 'État correct'
                }
                text_parts.append(f"État: {condition_map.get(offer_data['productCondition'], offer_data['productCondition'])}")
            
            # Prix (ajouté comme contexte)
            if offer_data.get('price'):
                text_parts.append(f"Prix: {offer_data['price']}€")
            
            # Type de listing
            if offer_data.get('listingType'):
                type_map = {
                    'vehicle': 'Véhicule',
                    'item': 'Article',
                    'property': 'Propriété'
                }
                text_parts.append(f"Type: {type_map.get(offer_data['listingType'], offer_data['listingType'])}")
            
            # Combiner tous les éléments
            combined_text = " ".join(text_parts)
            
            return await self.generate_text_embedding(combined_text)
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération d'embedding d'offre: {e}")
            raise
    
    async def generate_user_query_embedding(self, query: str, user_context: Optional[Dict] = None) -> np.ndarray:
        """
        Génère un embedding pour une requête utilisateur avec contexte
        
        Args:
            query: Requête de l'utilisateur
            user_context: Contexte utilisateur (préférences, historique)
            
        Returns:
            Vecteur d'embedding numpy
        """
        try:
            # Construire le texte enrichi
            enriched_text = query
            
            if user_context:
                # Ajouter les préférences de l'utilisateur
                if user_context.get('preferred_categories'):
                    categories = ", ".join(user_context['preferred_categories'])
                    enriched_text += f" Préférences catégories: {categories}"
                
                if user_context.get('preferred_brands'):
                    brands = ", ".join(user_context['preferred_brands'])
                    enriched_text += f" Préférences marques: {brands}"
                
                if user_context.get('price_range'):
                    price_range = user_context['price_range']
                    enriched_text += f" Budget: {price_range.get('min', 0)}-{price_range.get('max', 'illimité')}€"
            
            return await self.generate_text_embedding(enriched_text)
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération d'embedding de requête: {e}")
            raise
    
    async def add_offer_to_index(self, offer_id: int, embedding: np.ndarray, metadata: Dict):
        """
        Ajoute une offre à l'index FAISS
        
        Args:
            offer_id: ID de l'offre
            embedding: Vecteur d'embedding
            metadata: Métadonnées de l'offre
        """
        try:
            if self.faiss_index is None:
                await self.initialize()
            
            # Ajouter à l'index FAISS
            self.faiss_index.add(embedding.reshape(1, -1))
            
            # Stocker les métadonnées
            self.embeddings_metadata[offer_id] = {
                'offer_id': offer_id,
                'metadata': metadata,
                'added_at': datetime.now().isoformat(),
                'index_position': self.faiss_index.ntotal - 1
            }
            
            logger.debug(f"Offre {offer_id} ajoutée à l'index FAISS")
            
        except Exception as e:
            logger.error(f"Erreur lors de l'ajout de l'offre à l'index: {e}")
            raise
    
    async def search_similar_offers(self, query_embedding: np.ndarray, k: int = 10, filters: Optional[Dict] = None) -> List[Dict]:
        """
        Recherche des offres similaires
        
        Args:
            query_embedding: Vecteur d'embedding de la requête
            k: Nombre de résultats à retourner
            filters: Filtres à appliquer (catégorie, marque, prix, etc.)
            
        Returns:
            Liste des offres similaires avec scores
        """
        try:
            if self.faiss_index is None or self.faiss_index.ntotal == 0:
                return []
            
            # Recherche dans l'index FAISS
            scores, indices = self.faiss_index.search(query_embedding.reshape(1, -1), k)
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx == -1:  # Index invalide
                    continue
                
                # Récupérer les métadonnées
                offer_metadata = None
                for offer_id, metadata in self.embeddings_metadata.items():
                    if metadata['index_position'] == idx:
                        offer_metadata = metadata
                        break
                
                if offer_metadata:
                    # Appliquer les filtres si spécifiés
                    if filters and not self._apply_filters(offer_metadata['metadata'], filters):
                        continue
                    
                    results.append({
                        'offer_id': offer_metadata['offer_id'],
                        'similarity_score': float(score),
                        'metadata': offer_metadata['metadata']
                    })
            
            # Trier par score de similarité
            results.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            return results
            
        except Exception as e:
            logger.error(f"Erreur lors de la recherche d'offres similaires: {e}")
            return []
    
    def _apply_filters(self, metadata: Dict, filters: Dict) -> bool:
        """Applique les filtres aux métadonnées d'une offre"""
        try:
            # Filtre par catégorie
            if filters.get('category_id') and metadata.get('category_id') != filters['category_id']:
                return False
            
            # Filtre par marque
            if filters.get('brand_id') and metadata.get('brand_id') != filters['brand_id']:
                return False
            
            # Filtre par gamme de prix
            if filters.get('min_price') and metadata.get('price', 0) < filters['min_price']:
                return False
            
            if filters.get('max_price') and metadata.get('price', float('inf')) > filters['max_price']:
                return False
            
            # Filtre par condition
            if filters.get('condition') and metadata.get('product_condition') != filters['condition']:
                return False
            
            # Filtre par statut
            if filters.get('status') and metadata.get('status') != filters['status']:
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'application des filtres: {e}")
            return True  # En cas d'erreur, inclure l'offre
    
    def _clean_text(self, text: str) -> str:
        """Nettoie et normalise le texte"""
        if not text:
            return ""
        
        # Supprimer les caractères spéciaux excessifs
        import re
        text = re.sub(r'[^\w\s\-.,!?]', ' ', text)
        
        # Normaliser les espaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    async def save_index(self, filepath: str):
        """Sauvegarde l'index FAISS et les métadonnées"""
        try:
            if self.faiss_index:
                faiss.write_index(self.faiss_index, f"{filepath}.faiss")
            
            with open(f"{filepath}.metadata", 'w', encoding='utf-8') as f:
                json.dump(self.embeddings_metadata, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Index sauvegardé: {filepath}")
            
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde de l'index: {e}")
            raise
    
    async def load_index(self, filepath: str):
        """Charge l'index FAISS et les métadonnées"""
        try:
            if os.path.exists(f"{filepath}.faiss"):
                self.faiss_index = faiss.read_index(f"{filepath}.faiss")
            
            if os.path.exists(f"{filepath}.metadata"):
                with open(f"{filepath}.metadata", 'r', encoding='utf-8') as f:
                    self.embeddings_metadata = json.load(f)
            
            logger.info(f"Index chargé: {filepath}")
            
        except Exception as e:
            logger.error(f"Erreur lors du chargement de l'index: {e}")
            raise
