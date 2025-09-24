"""
Utilitaires pour le calcul de similarité
"""

import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
from sklearn.metrics.pairwise import cosine_similarity, euclidean_distances
from sklearn.feature_extraction.text import TfidfVectorizer
import re

logger = logging.getLogger(__name__)

class SimilarityCalculator:
    """Calculateur de similarité pour le chatbot"""
    
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='french',
            ngram_range=(1, 2)
        )
    
    def calculate_text_similarity(self, text1: str, text2: str, method: str = "cosine") -> float:
        """
        Calcule la similarité entre deux textes
        
        Args:
            text1: Premier texte
            text2: Deuxième texte
            method: Méthode de calcul ("cosine", "jaccard", "levenshtein")
            
        Returns:
            Score de similarité (0-1)
        """
        try:
            if method == "cosine":
                return self._cosine_text_similarity(text1, text2)
            elif method == "jaccard":
                return self._jaccard_similarity(text1, text2)
            elif method == "levenshtein":
                return self._levenshtein_similarity(text1, text2)
            else:
                raise ValueError(f"Méthode de similarité non supportée: {method}")
                
        except Exception as e:
            logger.error(f"Erreur lors du calcul de similarité textuelle: {e}")
            return 0.0
    
    def _cosine_text_similarity(self, text1: str, text2: str) -> float:
        """Calcule la similarité cosinus entre deux textes"""
        try:
            # Nettoyer les textes
            clean_text1 = self._clean_text(text1)
            clean_text2 = self._clean_text(text2)
            
            if not clean_text1 or not clean_text2:
                return 0.0
            
            # Vectoriser les textes
            vectors = self.tfidf_vectorizer.fit_transform([clean_text1, clean_text2])
            
            # Calculer la similarité cosinus
            similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
            
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul de similarité cosinus: {e}")
            return 0.0
    
    def _jaccard_similarity(self, text1: str, text2: str) -> float:
        """Calcule la similarité de Jaccard entre deux textes"""
        try:
            # Nettoyer et tokeniser
            tokens1 = set(self._tokenize(text1))
            tokens2 = set(self._tokenize(text2))
            
            if not tokens1 or not tokens2:
                return 0.0
            
            # Calculer l'intersection et l'union
            intersection = len(tokens1.intersection(tokens2))
            union = len(tokens1.union(tokens2))
            
            return intersection / union if union > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul de similarité Jaccard: {e}")
            return 0.0
    
    def _levenshtein_similarity(self, text1: str, text2: str) -> float:
        """Calcule la similarité de Levenshtein entre deux textes"""
        try:
            # Normaliser les textes
            text1 = text1.lower().strip()
            text2 = text2.lower().strip()
            
            if not text1 or not text2:
                return 0.0
            
            # Calculer la distance de Levenshtein
            distance = self._levenshtein_distance(text1, text2)
            
            # Convertir en similarité (0-1)
            max_len = max(len(text1), len(text2))
            similarity = 1 - (distance / max_len) if max_len > 0 else 0.0
            
            return max(0.0, similarity)
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul de similarité Levenshtein: {e}")
            return 0.0
    
    def _levenshtein_distance(self, s1: str, s2: str) -> int:
        """Calcule la distance de Levenshtein entre deux chaînes"""
        if len(s1) < len(s2):
            return self._levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = list(range(len(s2) + 1))
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]
    
    def calculate_semantic_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Calcule la similarité sémantique entre deux embeddings
        
        Args:
            embedding1: Premier embedding
            embedding2: Deuxième embedding
            
        Returns:
            Score de similarité sémantique (0-1)
        """
        try:
            # Normaliser les embeddings
            norm1 = embedding1 / np.linalg.norm(embedding1)
            norm2 = embedding2 / np.linalg.norm(embedding2)
            
            # Calculer la similarité cosinus
            similarity = np.dot(norm1, norm2)
            
            return float(max(0.0, min(1.0, similarity)))
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul de similarité sémantique: {e}")
            return 0.0
    
    def find_most_similar_offers(self, 
                                query_embedding: np.ndarray,
                                offer_embeddings: List[np.ndarray],
                                offer_metadata: List[Dict[str, Any]],
                                top_k: int = 10,
                                threshold: float = 0.0) -> List[Dict[str, Any]]:
        """
        Trouve les offres les plus similaires à une requête
        
        Args:
            query_embedding: Embedding de la requête
            offer_embeddings: Liste des embeddings d'offres
            offer_metadata: Liste des métadonnées d'offres
            top_k: Nombre de résultats à retourner
            threshold: Seuil de similarité minimum
            
        Returns:
            Liste des offres similaires triées par similarité
        """
        try:
            if not offer_embeddings or not offer_metadata:
                return []
            
            if len(offer_embeddings) != len(offer_metadata):
                logger.warning("Le nombre d'embeddings ne correspond pas au nombre de métadonnées")
                return []
            
            # Calculer les similarités
            similarities = []
            for i, offer_embedding in enumerate(offer_embeddings):
                similarity = self.calculate_semantic_similarity(query_embedding, offer_embedding)
                
                if similarity >= threshold:
                    similarities.append({
                        "index": i,
                        "similarity": similarity,
                        "metadata": offer_metadata[i]
                    })
            
            # Trier par similarité décroissante
            similarities.sort(key=lambda x: x["similarity"], reverse=True)
            
            # Retourner les top_k résultats
            return similarities[:top_k]
            
        except Exception as e:
            logger.error(f"Erreur lors de la recherche d'offres similaires: {e}")
            return []
    
    def calculate_hybrid_similarity(self, 
                                  text_similarity: float,
                                  semantic_similarity: float,
                                  weights: Tuple[float, float] = (0.3, 0.7)) -> float:
        """
        Calcule une similarité hybride combinant texte et sémantique
        
        Args:
            text_similarity: Similarité textuelle (0-1)
            semantic_similarity: Similarité sémantique (0-1)
            weights: Poids pour chaque type de similarité (texte, sémantique)
            
        Returns:
            Score de similarité hybride (0-1)
        """
        try:
            if len(weights) != 2:
                raise ValueError("Les poids doivent être un tuple de 2 éléments")
            
            if not (0 <= weights[0] <= 1 and 0 <= weights[1] <= 1):
                raise ValueError("Les poids doivent être entre 0 et 1")
            
            if abs(weights[0] + weights[1] - 1.0) > 1e-6:
                logger.warning("La somme des poids n'est pas égale à 1, normalisation appliquée")
                total_weight = weights[0] + weights[1]
                weights = (weights[0] / total_weight, weights[1] / total_weight)
            
            hybrid_similarity = (weights[0] * text_similarity + 
                               weights[1] * semantic_similarity)
            
            return float(max(0.0, min(1.0, hybrid_similarity)))
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul de similarité hybride: {e}")
            return 0.0
    
    def _clean_text(self, text: str) -> str:
        """Nettoie un texte pour l'analyse"""
        if not text:
            return ""
        
        # Convertir en minuscules
        text = text.lower()
        
        # Supprimer les caractères spéciaux excessifs
        text = re.sub(r'[^\w\s\-.,!?]', ' ', text)
        
        # Normaliser les espaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _tokenize(self, text: str) -> List[str]:
        """Tokenise un texte"""
        if not text:
            return []
        
        # Nettoyer le texte
        clean_text = self._clean_text(text)
        
        # Diviser en mots
        tokens = clean_text.split()
        
        # Filtrer les tokens trop courts
        tokens = [token for token in tokens if len(token) > 2]
        
        return tokens

def calculate_offer_relevance_score(offer: Dict[str, Any], 
                                  query_entities: Dict[str, Any],
                                  user_preferences: Optional[Dict[str, Any]] = None) -> float:
    """
    Calcule un score de pertinence pour une offre basé sur la requête et les préférences
    
    Args:
        offer: Données de l'offre
        query_entities: Entités extraites de la requête
        user_preferences: Préférences de l'utilisateur
        
    Returns:
        Score de pertinence (0-1)
    """
    try:
        score = 0.0
        
        # Score basé sur les entités de la requête
        if query_entities.get("brand") and offer.get("brand", {}).get("nameFr"):
            if query_entities["brand"].lower() in offer["brand"]["nameFr"].lower():
                score += 0.3
        
        if query_entities.get("category") and offer.get("category", {}).get("nameFr"):
            if query_entities["category"].lower() in offer["category"]["nameFr"].lower():
                score += 0.3
        
        if query_entities.get("model") and offer.get("title"):
            if query_entities["model"].lower() in offer["title"].lower():
                score += 0.2
        
        # Score basé sur les préférences utilisateur
        if user_preferences:
            if user_preferences.get("preferred_brands") and offer.get("brand", {}).get("nameFr"):
                if offer["brand"]["nameFr"] in user_preferences["preferred_brands"]:
                    score += 0.2
            
            if user_preferences.get("preferred_categories") and offer.get("category", {}).get("nameFr"):
                if offer["category"]["nameFr"] in user_preferences["preferred_categories"]:
                    score += 0.2
            
            if user_preferences.get("price_range") and offer.get("price"):
                price_range = user_preferences["price_range"]
                offer_price = offer["price"]
                
                if price_range.get("min", 0) <= offer_price <= price_range.get("max", float('inf')):
                    score += 0.1
        
        return min(1.0, score)
        
    except Exception as e:
        logger.error(f"Erreur lors du calcul du score de pertinence: {e}")
        return 0.0

# Instance globale du calculateur de similarité
similarity_calculator = SimilarityCalculator()
