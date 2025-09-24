"""
Service de récupération des préférences utilisateur depuis le Graph Service
"""

import logging
import axios
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)

class GraphPreferencesService:
    """Service pour récupérer les préférences utilisateur depuis Neo4j via Graph Service"""
    
    def __init__(self, graph_service_url: str = "http://localhost:8002"):
        self.graph_service_url = graph_service_url
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes en secondes
        
    async def get_user_preferences(self, user_id: int, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """
        Récupère les préférences complètes d'un utilisateur depuis le Graph Service
        
        Args:
            user_id: ID de l'utilisateur
            use_cache: Utiliser le cache si disponible
            
        Returns:
            Préférences utilisateur ou None si erreur
        """
        try:
            # Vérifier le cache
            if use_cache and user_id in self.cache:
                cached_data = self.cache[user_id]
                if datetime.now().timestamp() - cached_data['timestamp'] < self.cache_ttl:
                    logger.debug(f"Préférences utilisateur {user_id} récupérées du cache")
                    return cached_data['preferences']
            
            # Récupérer depuis le Graph Service
            try:
                response = await axios.get(f"{self.graph_service_url}/user-preferences/{user_id}", {
                    'timeout': 10000  # 10 secondes
                })
                
                if response.status == 200:
                    preferences = response.data
                    
                    # Mettre en cache
                    self.cache[user_id] = {
                        'preferences': preferences,
                        'timestamp': datetime.now().timestamp()
                    }
                    
                    logger.info(f"Préférences utilisateur {user_id} récupérées depuis Graph Service")
                    return preferences
                else:
                    logger.warning(f"Erreur lors de la récupération des préférences: {response.status}")
                    return None
            except axios.AxiosError as e:
                logger.error(f"Erreur axios lors de la récupération des préférences: {e}")
                return None
                    
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des préférences utilisateur {user_id}: {e}")
            return None
    
    async def get_user_category_preferences(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Récupère les préférences de catégories d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            limit: Nombre maximum de catégories
            
        Returns:
            Liste des préférences de catégories
        """
        try:
            response = await axios.get(f"{self.graph_service_url}/user-preferences/{user_id}/categories", {
                'params': {"limit": limit},
                'timeout': 10000
            })
            
            if response.status == 200:
                return response.data
            else:
                logger.warning(f"Erreur lors de la récupération des catégories: {response.status}")
                return []
                    
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des catégories utilisateur {user_id}: {e}")
            return []
    
    async def get_user_brand_preferences(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Récupère les préférences de marques d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            limit: Nombre maximum de marques
            
        Returns:
            Liste des préférences de marques
        """
        try:
            response = await axios.get(f"{self.graph_service_url}/user-preferences/{user_id}/brands", {
                'params': {"limit": limit},
                'timeout': 10000
            })
            
            if response.status == 200:
                return response.data
            else:
                logger.warning(f"Erreur lors de la récupération des marques: {response.status}")
                return []
                    
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des marques utilisateur {user_id}: {e}")
            return []
    
    async def get_user_price_range(self, user_id: int) -> Dict[str, float]:
        """
        Récupère la gamme de prix préférée d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Gamme de prix (min, max)
        """
        try:
            response = await axios.get(f"{self.graph_service_url}/user-preferences/{user_id}/price-range", {
                'timeout': 10000
            })
            
            if response.status == 200:
                return response.data
            else:
                logger.warning(f"Erreur lors de la récupération de la gamme de prix: {response.status}")
                return {"min": 0, "max": 10000}
                    
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la gamme de prix utilisateur {user_id}: {e}")
            return {"min": 0, "max": 10000}
    
    async def get_user_interaction_stats(self, user_id: int) -> Dict[str, Any]:
        """
        Récupère les statistiques d'interaction d'un utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Statistiques d'interaction
        """
        try:
            response = await axios.get(f"{self.graph_service_url}/user-preferences/{user_id}/interaction-stats", {
                'timeout': 10000
            })
            
            if response.status == 200:
                return response.data
            else:
                logger.warning(f"Erreur lors de la récupération des statistiques: {response.status}")
                return {}
                    
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques utilisateur {user_id}: {e}")
            return {}
    
    async def convert_to_chatbot_format(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Convertit les préférences du Graph Service au format du chatbot
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Préférences au format chatbot ou None
        """
        try:
            preferences = await self.get_user_preferences(user_id)
            if not preferences:
                return None
            
            # Convertir au format du chatbot
            chatbot_preferences = {
                "user_id": user_id,
                "preferred_categories": [
                    cat["category_name_fr"] for cat in preferences.get("preferred_categories", [])
                ],
                "preferred_brands": [
                    brand["brand_name_fr"] for brand in preferences.get("preferred_brands", [])
                ],
                "price_range": preferences.get("price_range", {"min": 0, "max": 10000}),
                "interaction_history": self._convert_interaction_history(preferences.get("interaction_stats", {})),
                "conversation_style": self._determine_conversation_style(preferences.get("interaction_stats", {})),
                "language_preference": "fr",  # Par défaut
                "last_interaction": preferences.get("last_updated"),
                "preferences_updated_at": preferences.get("last_updated")
            }
            
            return chatbot_preferences
            
        except Exception as e:
            logger.error(f"Erreur lors de la conversion des préférences: {e}")
            return None
    
    def _convert_interaction_history(self, stats: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Convertit les statistiques en historique d'interaction"""
        history = []
        
        if stats.get("total_views", 0) > 0:
            history.append({
                "action": "viewed",
                "count": stats["total_views"],
                "timestamp": datetime.now().isoformat()
            })
        
        if stats.get("total_likes", 0) > 0:
            history.append({
                "action": "liked",
                "count": stats["total_likes"],
                "timestamp": datetime.now().isoformat()
            })
        
        if stats.get("total_searches", 0) > 0:
            history.append({
                "action": "searched",
                "count": stats["total_searches"],
                "timestamp": datetime.now().isoformat()
            })
        
        return history
    
    def _determine_conversation_style(self, stats: Dict[str, Any]) -> str:
        """Détermine le style de conversation basé sur les statistiques"""
        total_interactions = stats.get("total_views", 0) + stats.get("total_likes", 0) + stats.get("total_searches", 0)
        
        if total_interactions > 100:
            return "technical"  # Utilisateur expérimenté
        elif total_interactions > 20:
            return "casual"     # Utilisateur régulier
        else:
            return "formal"     # Nouvel utilisateur
    
    async def clear_user_cache(self, user_id: int):
        """Vide le cache d'un utilisateur"""
        if user_id in self.cache:
            del self.cache[user_id]
            logger.info(f"Cache vidé pour l'utilisateur {user_id}")
    
    async def clear_all_cache(self):
        """Vide tout le cache"""
        self.cache.clear()
        logger.info("Cache des préférences vidé")
    
    async def health_check(self) -> bool:
        """Vérifie la santé du Graph Service"""
        try:
            response = await axios.get(f"{self.graph_service_url}/health", {
                'timeout': 5000
            })
            return response.status == 200
        except Exception as e:
            logger.error(f"Erreur lors de la vérification de santé du Graph Service: {e}")
            return False

# Instance globale du service
graph_preferences_service = GraphPreferencesService()
