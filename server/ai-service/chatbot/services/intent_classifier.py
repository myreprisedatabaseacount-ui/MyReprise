"""
Service de Classification d'Intent
Responsable de la classification des intentions utilisateur
"""

import re
import logging
from typing import Dict, List, Tuple, Optional
from enum import Enum
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import joblib
import os

logger = logging.getLogger(__name__)

class IntentType(str, Enum):
    """Types d'intentions supportées par le chatbot"""
    PRODUCT_SEARCH = "product_search"
    PAGE_NAVIGATION = "page_navigation"
    PRICE_INQUIRY = "price_inquiry"
    AVAILABILITY_CHECK = "availability_check"
    RECOMMENDATION_REQUEST = "recommendation_request"
    GENERAL_QUESTION = "general_question"
    ACCOUNT_HELP = "account_help"
    TECHNICAL_SUPPORT = "technical_support"

class IntentClassifier:
    """Classificateur d'intentions pour le chatbot MyReprise"""
    
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.intent_patterns = self._initialize_patterns()
        self.confidence_threshold = 0.7
        
    def _initialize_patterns(self) -> Dict[IntentType, List[str]]:
        """Initialise les patterns de reconnaissance d'intentions"""
        return {
            IntentType.PRODUCT_SEARCH: [
                r"je cherche", r"trouve", r"montre", r"veux", r"besoin",
                r"recherche", r"disponible", r"avoir", r"acheter"
            ],
            IntentType.PAGE_NAVIGATION: [
                r"comment", r"où", r"page", r"section", r"menu",
                r"naviguer", r"aller", r"accéder", r"créer un compte"
            ],
            IntentType.PRICE_INQUIRY: [
                r"prix", r"coûte", r"combien", r"tarif", r"réduction",
                r"promotion", r"offre", r"gratuit", r"cher", r"pas cher"
            ],
            IntentType.AVAILABILITY_CHECK: [
                r"disponible", r"stock", r"encore", r"toujours",
                r"vendu", r"réservé", r"libre", r"occupé"
            ],
            IntentType.RECOMMENDATION_REQUEST: [
                r"conseille", r"recommandé", r"populaire", r"similaire",
                r"suggère", r"meilleur", r"top", r"intéressant"
            ],
            IntentType.ACCOUNT_HELP: [
                r"compte", r"profil", r"connexion", r"inscription",
                r"mot de passe", r"email", r"utilisateur"
            ],
            IntentType.TECHNICAL_SUPPORT: [
                r"problème", r"erreur", r"bug", r"ne marche pas",
                r"support", r"aide", r"technique", r"dysfonctionnement"
            ]
        }
    
    async def classify_intent(self, message: str, user_id: Optional[int] = None) -> Dict:
        """
        Classifie l'intention d'un message utilisateur
        
        Args:
            message: Message de l'utilisateur
            user_id: ID de l'utilisateur (optionnel)
            
        Returns:
            Dict contenant l'intent, la confiance et les entités extraites
        """
        try:
            message_lower = message.lower().strip()
            
            # Classification par patterns regex
            intent_scores = {}
            for intent_type, patterns in self.intent_patterns.items():
                score = 0
                for pattern in patterns:
                    if re.search(pattern, message_lower):
                        score += 1
                intent_scores[intent_type] = score / len(patterns)
            
            # Trouver l'intent avec le score le plus élevé
            best_intent = max(intent_scores.items(), key=lambda x: x[1])
            intent_type, confidence = best_intent
            
            # Si la confiance est trop faible, utiliser l'intent général
            if confidence < self.confidence_threshold:
                intent_type = IntentType.GENERAL_QUESTION
                confidence = 0.5
            
            # Extraire les entités
            entities = await self._extract_entities(message, intent_type)
            
            return {
                "intent": intent_type.value,
                "confidence": round(confidence, 3),
                "entities": entities,
                "original_message": message
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la classification d'intent: {e}")
            return {
                "intent": IntentType.GENERAL_QUESTION.value,
                "confidence": 0.0,
                "entities": {},
                "original_message": message,
                "error": str(e)
            }
    
    async def _extract_entities(self, message: str, intent_type: IntentType) -> Dict:
        """Extrait les entités pertinentes du message"""
        entities = {}
        message_lower = message.lower()
        
        # Extraction basée sur l'intent
        if intent_type == IntentType.PRODUCT_SEARCH:
            # Extraire les marques, modèles, catégories
            entities.update(self._extract_product_entities(message_lower))
        
        elif intent_type == IntentType.PRICE_INQUIRY:
            # Extraire les montants, devises
            entities.update(self._extract_price_entities(message_lower))
        
        elif intent_type == IntentType.PAGE_NAVIGATION:
            # Extraire les pages cibles
            entities.update(self._extract_navigation_entities(message_lower))
        
        return entities
    
    def _extract_product_entities(self, message: str) -> Dict:
        """Extrait les entités liées aux produits"""
        entities = {}
        
        # Marques connues
        brands = ["apple", "samsung", "sony", "lg", "huawei", "xiaomi", "bmw", "mercedes", "audi"]
        for brand in brands:
            if brand in message:
                entities["brand"] = brand.title()
                break
        
        # Catégories
        categories = ["téléphone", "smartphone", "ordinateur", "laptop", "voiture", "véhicule"]
        for category in categories:
            if category in message:
                entities["category"] = category
                break
        
        # Modèles (patterns simples)
        model_patterns = [
            r"iphone\s+(\d+)", r"galaxy\s+(\w+)", r"macbook\s+(\w+)",
            r"model\s+(\w+)", r"(\w+)\s+pro", r"(\w+)\s+max"
        ]
        
        for pattern in model_patterns:
            match = re.search(pattern, message)
            if match:
                entities["model"] = match.group(1)
                break
        
        return entities
    
    def _extract_price_entities(self, message: str) -> Dict:
        """Extrait les entités liées aux prix"""
        entities = {}
        
        # Montants
        price_patterns = [
            r"(\d+)\s*€", r"(\d+)\s*euros?", r"(\d+)\s*dh", r"(\d+)\s*dirhams?"
        ]
        
        for pattern in price_patterns:
            match = re.search(pattern, message)
            if match:
                entities["amount"] = int(match.group(1))
                break
        
        # Gammes de prix
        if "pas cher" in message or "bon marché" in message:
            entities["price_range"] = "low"
        elif "cher" in message or "luxe" in message:
            entities["price_range"] = "high"
        
        return entities
    
    def _extract_navigation_entities(self, message: str) -> Dict:
        """Extrait les entités liées à la navigation"""
        entities = {}
        
        # Pages cibles
        if "compte" in message or "profil" in message:
            entities["target_page"] = "account"
        elif "vendeur" in message or "vendre" in message:
            entities["target_page"] = "seller"
        elif "commande" in message or "achat" in message:
            entities["target_page"] = "orders"
        elif "support" in message or "aide" in message:
            entities["target_page"] = "support"
        
        return entities
    
    async def train_model(self, training_data: List[Tuple[str, str]]) -> bool:
        """
        Entraîne le modèle de classification
        
        Args:
            training_data: Liste de tuples (message, intent)
            
        Returns:
            True si l'entraînement a réussi
        """
        try:
            messages, intents = zip(*training_data)
            
            # Créer le pipeline de classification
            self.model = Pipeline([
                ('tfidf', TfidfVectorizer(max_features=1000, stop_words='french')),
                ('classifier', MultinomialNB())
            ])
            
            # Entraîner le modèle
            self.model.fit(messages, intents)
            
            # Sauvegarder le modèle
            model_path = "chatbot/models/intent_classifier.pkl"
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            joblib.dump(self.model, model_path)
            
            logger.info("Modèle d'intent entraîné avec succès")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'entraînement: {e}")
            return False
    
    async def load_model(self, model_path: str = "chatbot/models/intent_classifier.pkl") -> bool:
        """
        Charge un modèle pré-entraîné
        
        Args:
            model_path: Chemin vers le modèle
            
        Returns:
            True si le chargement a réussi
        """
        try:
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                logger.info("Modèle d'intent chargé avec succès")
                return True
            else:
                logger.warning("Modèle d'intent non trouvé, utilisation des patterns regex")
                return False
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle: {e}")
            return False
