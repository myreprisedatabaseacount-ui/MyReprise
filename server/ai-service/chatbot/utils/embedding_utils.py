"""
Utilitaires pour les embeddings
"""

import numpy as np
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

def normalize_embedding(embedding: np.ndarray) -> np.ndarray:
    """
    Normalise un vecteur d'embedding pour la similarité cosinus
    
    Args:
        embedding: Vecteur d'embedding
        
    Returns:
        Vecteur normalisé
    """
    try:
        norm = np.linalg.norm(embedding)
        if norm == 0:
            return embedding
        return embedding / norm
    except Exception as e:
        logger.error(f"Erreur lors de la normalisation de l'embedding: {e}")
        return embedding

def calculate_cosine_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Calcule la similarité cosinus entre deux embeddings
    
    Args:
        embedding1: Premier vecteur d'embedding
        embedding2: Deuxième vecteur d'embedding
        
    Returns:
        Score de similarité cosinus (0-1)
    """
    try:
        # Normaliser les vecteurs
        norm1 = normalize_embedding(embedding1)
        norm2 = normalize_embedding(embedding2)
        
        # Calculer le produit scalaire
        similarity = np.dot(norm1, norm2)
        
        # S'assurer que le résultat est entre 0 et 1
        return max(0.0, min(1.0, similarity))
        
    except Exception as e:
        logger.error(f"Erreur lors du calcul de similarité: {e}")
        return 0.0

def calculate_euclidean_distance(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Calcule la distance euclidienne entre deux embeddings
    
    Args:
        embedding1: Premier vecteur d'embedding
        embedding2: Deuxième vecteur d'embedding
        
    Returns:
        Distance euclidienne
    """
    try:
        return float(np.linalg.norm(embedding1 - embedding2))
    except Exception as e:
        logger.error(f"Erreur lors du calcul de distance euclidienne: {e}")
        return float('inf')

def calculate_manhattan_distance(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Calcule la distance de Manhattan entre deux embeddings
    
    Args:
        embedding1: Premier vecteur d'embedding
        embedding2: Deuxième vecteur d'embedding
        
    Returns:
        Distance de Manhattan
    """
    try:
        return float(np.sum(np.abs(embedding1 - embedding2)))
    except Exception as e:
        logger.error(f"Erreur lors du calcul de distance de Manhattan: {e}")
        return float('inf')

def find_most_similar(query_embedding: np.ndarray, 
                     candidate_embeddings: List[np.ndarray],
                     similarity_threshold: float = 0.0) -> List[Dict[str, Any]]:
    """
    Trouve les embeddings les plus similaires à une requête
    
    Args:
        query_embedding: Embedding de la requête
        candidate_embeddings: Liste des embeddings candidats
        similarity_threshold: Seuil de similarité minimum
        
    Returns:
        Liste des résultats triés par similarité
    """
    try:
        results = []
        
        for i, candidate in enumerate(candidate_embeddings):
            similarity = calculate_cosine_similarity(query_embedding, candidate)
            
            if similarity >= similarity_threshold:
                results.append({
                    "index": i,
                    "similarity": similarity,
                    "distance": calculate_euclidean_distance(query_embedding, candidate)
                })
        
        # Trier par similarité décroissante
        results.sort(key=lambda x: x["similarity"], reverse=True)
        
        return results
        
    except Exception as e:
        logger.error(f"Erreur lors de la recherche de similarité: {e}")
        return []

def batch_calculate_similarities(query_embedding: np.ndarray,
                                candidate_embeddings: np.ndarray) -> np.ndarray:
    """
    Calcule les similarités pour un batch d'embeddings
    
    Args:
        query_embedding: Embedding de la requête
        candidate_embeddings: Matrice des embeddings candidats
        
    Returns:
        Array des similarités
    """
    try:
        # Normaliser la requête
        query_norm = normalize_embedding(query_embedding)
        
        # Normaliser tous les candidats
        norms = np.linalg.norm(candidate_embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1  # Éviter la division par zéro
        candidates_norm = candidate_embeddings / norms
        
        # Calculer les similarités cosinus
        similarities = np.dot(candidates_norm, query_norm)
        
        # S'assurer que les résultats sont entre 0 et 1
        similarities = np.clip(similarities, 0.0, 1.0)
        
        return similarities
        
    except Exception as e:
        logger.error(f"Erreur lors du calcul batch de similarités: {e}")
        return np.zeros(len(candidate_embeddings))

def create_embedding_index(embeddings: List[np.ndarray], 
                          metadata: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Crée un index d'embeddings avec métadonnées
    
    Args:
        embeddings: Liste des embeddings
        metadata: Liste des métadonnées correspondantes
        
    Returns:
        Index structuré
    """
    try:
        if len(embeddings) != len(metadata):
            raise ValueError("Le nombre d'embeddings doit correspondre au nombre de métadonnées")
        
        index = {
            "embeddings": np.array(embeddings),
            "metadata": metadata,
            "dimension": len(embeddings[0]) if embeddings else 0,
            "count": len(embeddings)
        }
        
        return index
        
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'index: {e}")
        return {"embeddings": np.array([]), "metadata": [], "dimension": 0, "count": 0}

def search_in_index(query_embedding: np.ndarray,
                   index: Dict[str, Any],
                   top_k: int = 10,
                   similarity_threshold: float = 0.0) -> List[Dict[str, Any]]:
    """
    Recherche dans un index d'embeddings
    
    Args:
        query_embedding: Embedding de la requête
        index: Index d'embeddings
        top_k: Nombre de résultats à retourner
        similarity_threshold: Seuil de similarité minimum
        
    Returns:
        Liste des résultats triés
    """
    try:
        if index["count"] == 0:
            return []
        
        # Calculer les similarités
        similarities = batch_calculate_similarities(
            query_embedding, 
            index["embeddings"]
        )
        
        # Créer les résultats
        results = []
        for i, similarity in enumerate(similarities):
            if similarity >= similarity_threshold:
                results.append({
                    "index": i,
                    "similarity": float(similarity),
                    "metadata": index["metadata"][i]
                })
        
        # Trier par similarité décroissante
        results.sort(key=lambda x: x["similarity"], reverse=True)
        
        # Retourner les top_k résultats
        return results[:top_k]
        
    except Exception as e:
        logger.error(f"Erreur lors de la recherche dans l'index: {e}")
        return []

def validate_embedding(embedding: np.ndarray, expected_dimension: int) -> bool:
    """
    Valide un embedding
    
    Args:
        embedding: Vecteur d'embedding
        expected_dimension: Dimension attendue
        
    Returns:
        True si l'embedding est valide
    """
    try:
        if not isinstance(embedding, np.ndarray):
            return False
        
        if embedding.ndim != 1:
            return False
        
        if len(embedding) != expected_dimension:
            return False
        
        if np.any(np.isnan(embedding)) or np.any(np.isinf(embedding)):
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de la validation de l'embedding: {e}")
        return False

def convert_to_numpy(embedding: Any) -> Optional[np.ndarray]:
    """
    Convertit un embedding en numpy array
    
    Args:
        embedding: Embedding sous forme de liste ou array
        
    Returns:
        Numpy array ou None si la conversion échoue
    """
    try:
        if isinstance(embedding, np.ndarray):
            return embedding
        
        if isinstance(embedding, (list, tuple)):
            return np.array(embedding, dtype=np.float32)
        
        return None
        
    except Exception as e:
        logger.error(f"Erreur lors de la conversion en numpy: {e}")
        return None
