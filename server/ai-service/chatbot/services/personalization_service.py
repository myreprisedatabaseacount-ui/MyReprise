"""
Service de Personnalisation
Responsable de la personnalisation des réponses basée sur le profil utilisateur
"""

import logging
from typing import Dict, List, Optional, Any
import json
from datetime import datetime, timedelta
import asyncio

from .graph_preferences_service import graph_preferences_service

logger = logging.getLogger(__name__)

class PersonalizationService:
    """Service de personnalisation pour le chatbot MyReprise"""
    
    def __init__(self, database_service=None):
        self.database_service = database_service
        self.user_profiles_cache = {}
        self.cache_ttl = 3600  # 1 heure en secondes
        
    async def get_user_context(self, user_id: int) -> Optional[Dict]:
        """
        Récupère le contexte utilisateur pour la personnalisation
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Dict contenant le contexte utilisateur
        """
        try:
            # Vérifier le cache
            if user_id in self.user_profiles_cache:
                cached_data = self.user_profiles_cache[user_id]
                if datetime.now().timestamp() - cached_data['timestamp'] < self.cache_ttl:
                    return cached_data['context']
            
            # Récupérer le profil depuis la base de données
            user_context = await self._fetch_user_profile(user_id)
            
            # Mettre en cache
            self.user_profiles_cache[user_id] = {
                'context': user_context,
                'timestamp': datetime.now().timestamp()
            }
            
            return user_context
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du contexte utilisateur {user_id}: {e}")
            return None
    
    async def _fetch_user_profile(self, user_id: int) -> Dict:
        """Récupère le profil utilisateur depuis le Graph Service"""
        try:
            # Récupérer les préférences depuis le Graph Service
            graph_preferences = await graph_preferences_service.convert_to_chatbot_format(user_id)
            
            if graph_preferences:
                logger.info(f"Profil utilisateur {user_id} récupéré depuis Graph Service")
                return graph_preferences
            
            # Fallback vers un profil par défaut si Graph Service indisponible
            logger.warning(f"Graph Service indisponible, utilisation du profil par défaut pour l'utilisateur {user_id}")
            return {
                "user_id": user_id,
                "preferred_categories": [],
                "preferred_brands": [],
                "price_range": {"min": 0, "max": 10000},
                "interaction_history": [],
                "conversation_style": "casual",
                "language_preference": "fr",
                "last_interaction": None,
                "preferences_updated_at": None
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du profil utilisateur: {e}")
            return {}
    
    async def update_user_preferences(self, user_id: int, preferences: Dict) -> bool:
        """
        Met à jour les préférences utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            preferences: Nouvelles préférences
            
        Returns:
            True si la mise à jour a réussi
        """
        try:
            # Valider les préférences
            validated_preferences = await self._validate_preferences(preferences)
            
            # Mettre à jour en base de données
            success = await self._save_user_preferences(user_id, validated_preferences)
            
            if success:
                # Invalider le cache
                if user_id in self.user_profiles_cache:
                    del self.user_profiles_cache[user_id]
                
                logger.info(f"Préférences mises à jour pour l'utilisateur {user_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour des préférences: {e}")
            return False
    
    async def _validate_preferences(self, preferences: Dict) -> Dict:
        """Valide et nettoie les préférences utilisateur"""
        validated = {}
        
        # Valider les catégories préférées
        if "preferred_categories" in preferences:
            categories = preferences["preferred_categories"]
            if isinstance(categories, list):
                validated["preferred_categories"] = [str(cat) for cat in categories if cat]
        
        # Valider les marques préférées
        if "preferred_brands" in preferences:
            brands = preferences["preferred_brands"]
            if isinstance(brands, list):
                validated["preferred_brands"] = [str(brand) for brand in brands if brand]
        
        # Valider la gamme de prix
        if "price_range" in preferences:
            price_range = preferences["price_range"]
            if isinstance(price_range, dict):
                min_price = price_range.get("min", 0)
                max_price = price_range.get("max", 100000)
                
                if isinstance(min_price, (int, float)) and min_price >= 0:
                    validated["price_range"] = {
                        "min": float(min_price),
                        "max": float(max_price) if isinstance(max_price, (int, float)) else 100000
                    }
        
        # Valider le style de conversation
        if "conversation_style" in preferences:
            style = preferences["conversation_style"]
            if style in ["formal", "casual", "technical"]:
                validated["conversation_style"] = style
        
        # Valider la langue
        if "language_preference" in preferences:
            lang = preferences["language_preference"]
            if lang in ["fr", "ar", "en"]:
                validated["language_preference"] = lang
        
        return validated
    
    async def _save_user_preferences(self, user_id: int, preferences: Dict) -> bool:
        """Sauvegarde les préférences utilisateur en base de données"""
        try:
            # Ici, vous implémenteriez la sauvegarde en base de données
            # Pour l'instant, simuler un succès
            logger.info(f"Sauvegarde des préférences pour l'utilisateur {user_id}: {preferences}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde des préférences: {e}")
            return False
    
    async def learn_from_interaction(self, user_id: int, interaction_data: Dict) -> bool:
        """
        Apprend des interactions utilisateur pour améliorer la personnalisation
        
        Args:
            user_id: ID de l'utilisateur
            interaction_data: Données de l'interaction
            
        Returns:
            True si l'apprentissage a réussi
        """
        try:
            # Extraire les informations d'apprentissage
            learning_data = await self._extract_learning_data(interaction_data)
            
            if not learning_data:
                return False
            
            # Mettre à jour le profil utilisateur
            await self._update_profile_from_interaction(user_id, learning_data)
            
            logger.info(f"Apprentissage effectué pour l'utilisateur {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'apprentissage: {e}")
            return False
    
    async def _extract_learning_data(self, interaction_data: Dict) -> Optional[Dict]:
        """Extrait les données d'apprentissage d'une interaction"""
        try:
            learning_data = {}
            
            # Apprendre des offres consultées
            if "viewed_offers" in interaction_data:
                offers = interaction_data["viewed_offers"]
                if offers:
                    # Extraire les catégories et marques
                    categories = set()
                    brands = set()
                    
                    for offer in offers:
                        if offer.get("category"):
                            categories.add(offer["category"])
                        if offer.get("brand"):
                            brands.add(offer["brand"])
                    
                    if categories:
                        learning_data["preferred_categories"] = list(categories)
                    if brands:
                        learning_data["preferred_brands"] = list(brands)
            
            # Apprendre des offres aimées
            if "liked_offers" in interaction_data:
                liked_offers = interaction_data["liked_offers"]
                if liked_offers:
                    # Renforcer les préférences existantes
                    learning_data["liked_offers"] = liked_offers
            
            # Apprendre des prix consultés
            if "price_interactions" in interaction_data:
                prices = interaction_data["price_interactions"]
                if prices:
                    min_price = min(prices)
                    max_price = max(prices)
                    learning_data["price_range"] = {
                        "min": min_price,
                        "max": max_price
                    }
            
            return learning_data if learning_data else None
            
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction des données d'apprentissage: {e}")
            return None
    
    async def _update_profile_from_interaction(self, user_id: int, learning_data: Dict):
        """Met à jour le profil utilisateur basé sur les interactions"""
        try:
            # Récupérer le profil actuel
            current_profile = await self.get_user_context(user_id)
            if not current_profile:
                return
            
            # Mettre à jour les préférences
            updated_preferences = {}
            
            # Mettre à jour les catégories préférées
            if "preferred_categories" in learning_data:
                current_categories = set(current_profile.get("preferred_categories", []))
                new_categories = set(learning_data["preferred_categories"])
                updated_categories = list(current_categories.union(new_categories))
                updated_preferences["preferred_categories"] = updated_categories
            
            # Mettre à jour les marques préférées
            if "preferred_brands" in learning_data:
                current_brands = set(current_profile.get("preferred_brands", []))
                new_brands = set(learning_data["preferred_brands"])
                updated_brands = list(current_brands.union(new_brands))
                updated_preferences["preferred_brands"] = updated_brands
            
            # Mettre à jour la gamme de prix
            if "price_range" in learning_data:
                current_range = current_profile.get("price_range", {"min": 0, "max": 100000})
                new_range = learning_data["price_range"]
                
                updated_range = {
                    "min": min(current_range["min"], new_range["min"]),
                    "max": max(current_range["max"], new_range["max"])
                }
                updated_preferences["price_range"] = updated_range
            
            # Sauvegarder les mises à jour
            if updated_preferences:
                await self.update_user_preferences(user_id, updated_preferences)
            
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour du profil: {e}")
    
    async def get_personalized_recommendations(self, user_id: int, base_offers: List[Dict]) -> List[Dict]:
        """
        Personnalise une liste d'offres basée sur le profil utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            base_offers: Liste d'offres de base
            
        Returns:
            Liste d'offres personnalisées
        """
        try:
            user_context = await self.get_user_context(user_id)
            if not user_context:
                return base_offers
            
            # Calculer les scores de personnalisation
            personalized_offers = []
            
            for offer in base_offers:
                score = await self._calculate_personalization_score(offer, user_context)
                offer["personalization_score"] = score
                personalized_offers.append(offer)
            
            # Trier par score de personnalisation
            personalized_offers.sort(key=lambda x: x["personalization_score"], reverse=True)
            
            return personalized_offers
            
        except Exception as e:
            logger.error(f"Erreur lors de la personnalisation des recommandations: {e}")
            return base_offers
    
    async def _calculate_personalization_score(self, offer: Dict, user_context: Dict) -> float:
        """Calcule le score de personnalisation d'une offre"""
        try:
            score = 0.0
            
            # Score basé sur les catégories préférées
            if user_context.get("preferred_categories"):
                offer_category = offer.get("category", {}).get("nameFr", "")
                if offer_category in user_context["preferred_categories"]:
                    score += 0.3
            
            # Score basé sur les marques préférées
            if user_context.get("preferred_brands"):
                offer_brand = offer.get("brand", {}).get("nameFr", "")
                if offer_brand in user_context["preferred_brands"]:
                    score += 0.3
            
            # Score basé sur la gamme de prix
            if user_context.get("price_range") and offer.get("price"):
                price_range = user_context["price_range"]
                offer_price = offer["price"]
                
                if price_range["min"] <= offer_price <= price_range["max"]:
                    score += 0.2
                elif offer_price < price_range["min"]:
                    score += 0.1  # Prix inférieur peut être acceptable
                elif offer_price > price_range["max"]:
                    score -= 0.1  # Prix supérieur pénalisé
            
            # Score basé sur l'historique d'interactions
            if user_context.get("interaction_history"):
                # Analyser l'historique pour des patterns
                score += 0.2
            
            return min(max(score, 0.0), 1.0)  # Normaliser entre 0 et 1
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul du score de personnalisation: {e}")
            return 0.0
    
    async def clear_user_cache(self, user_id: int):
        """Vide le cache d'un utilisateur"""
        if user_id in self.user_profiles_cache:
            del self.user_profiles_cache[user_id]
            logger.info(f"Cache vidé pour l'utilisateur {user_id}")
    
    async def clear_all_cache(self):
        """Vide tout le cache"""
        self.user_profiles_cache.clear()
        await graph_preferences_service.clear_all_cache()
        logger.info("Cache de personnalisation vidé")
    
    async def refresh_user_preferences_from_graph(self, user_id: int) -> bool:
        """
        Force la mise à jour des préférences utilisateur depuis le Graph Service
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            True si la mise à jour a réussi
        """
        try:
            # Vider le cache local
            if user_id in self.user_profiles_cache:
                del self.user_profiles_cache[user_id]
            
            # Vider le cache du Graph Service
            await graph_preferences_service.clear_user_cache(user_id)
            
            # Récupérer les nouvelles préférences
            new_preferences = await self._fetch_user_profile(user_id)
            
            if new_preferences:
                logger.info(f"Préférences utilisateur {user_id} mises à jour depuis Graph Service")
                return True
            else:
                logger.warning(f"Impossible de récupérer les préférences pour l'utilisateur {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour des préférences depuis Graph Service: {e}")
            return False
    
    async def get_user_preferences_from_graph(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Récupère directement les préférences depuis le Graph Service (sans cache)
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Préférences utilisateur ou None
        """
        try:
            return await graph_preferences_service.convert_to_chatbot_format(user_id)
        except Exception as e:
            logger.error(f"Erreur lors de la récupération directe des préférences: {e}")
            return None
