"""
Service RAG (Retrieval-Augmented Generation)
Responsable de la récupération et génération de réponses contextuelles
"""

import logging
from typing import List, Dict, Optional, Any
import asyncio
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class RAGService:
    """Service RAG pour la génération de réponses contextuelles"""
    
    def __init__(self, embedding_service, personalization_service=None):
        self.embedding_service = embedding_service
        self.personalization_service = personalization_service
        self.context_window_size = 5  # Nombre d'offres à inclure dans le contexte
        self.max_context_length = 2000  # Longueur maximale du contexte
        
    async def generate_response(self, 
                              query: str, 
                              user_id: Optional[int] = None,
                              intent: str = "general_question",
                              entities: Optional[Dict] = None) -> Dict:
        """
        Génère une réponse contextuelle basée sur la requête utilisateur
        
        Args:
            query: Requête de l'utilisateur
            user_id: ID de l'utilisateur
            intent: Intent classifié
            entities: Entités extraites
            
        Returns:
            Dict contenant la réponse et les métadonnées
        """
        try:
            # 1. Récupérer le contexte utilisateur
            user_context = None
            if user_id and self.personalization_service:
                user_context = await self.personalization_service.get_user_context(user_id)
            
            # 2. Générer l'embedding de la requête
            query_embedding = await self.embedding_service.generate_user_query_embedding(
                query, user_context
            )
            
            # 3. Construire les filtres basés sur l'intent et les entités
            filters = await self._build_filters(intent, entities, user_context)
            
            # 4. Rechercher des offres similaires
            similar_offers = await self.embedding_service.search_similar_offers(
                query_embedding, 
                k=self.context_window_size,
                filters=filters
            )
            
            # 5. Construire le contexte
            context = await self._build_context(similar_offers, intent, entities)
            
            # 6. Générer la réponse
            response = await self._generate_response_text(
                query, context, intent, entities, user_context
            )
            
            return {
                "response": response,
                "context": context,
                "similar_offers": similar_offers,
                "intent": intent,
                "entities": entities,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de réponse RAG: {e}")
            return {
                "response": "Je suis désolé, une erreur s'est produite. Pouvez-vous reformuler votre question ?",
                "context": {},
                "similar_offers": [],
                "intent": intent,
                "entities": entities,
                "user_id": user_id,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _build_filters(self, intent: str, entities: Optional[Dict], user_context: Optional[Dict]) -> Dict:
        """Construit les filtres de recherche basés sur l'intent et les entités"""
        filters = {}
        
        # Filtres basés sur l'intent
        if intent == "product_search":
            filters["status"] = "available"
        
        # Filtres basés sur les entités extraites
        if entities:
            if entities.get("brand"):
                # Convertir le nom de marque en ID (à implémenter)
                pass
            
            if entities.get("category"):
                # Convertir le nom de catégorie en ID (à implémenter)
                pass
            
            if entities.get("price_range") == "low":
                filters["max_price"] = 500
            elif entities.get("price_range") == "high":
                filters["min_price"] = 1000
        
        # Filtres basés sur le contexte utilisateur
        if user_context:
            if user_context.get("preferred_categories"):
                # Ajouter les catégories préférées
                pass
            
            if user_context.get("price_range"):
                price_range = user_context["price_range"]
                if price_range.get("min"):
                    filters["min_price"] = price_range["min"]
                if price_range.get("max"):
                    filters["max_price"] = price_range["max"]
        
        return filters
    
    async def _build_context(self, similar_offers: List[Dict], intent: str, entities: Optional[Dict]) -> Dict:
        """Construit le contexte à partir des offres similaires"""
        context = {
            "offers": [],
            "summary": "",
            "intent": intent,
            "entities": entities or {}
        }
        
        if not similar_offers:
            context["summary"] = "Aucune offre similaire trouvée."
            return context
        
        # Construire la liste des offres
        for offer in similar_offers:
            offer_data = {
                "id": offer["offer_id"],
                "title": offer["metadata"].get("title", ""),
                "price": offer["metadata"].get("price", 0),
                "condition": offer["metadata"].get("product_condition", ""),
                "category": offer["metadata"].get("category", {}).get("nameFr", ""),
                "brand": offer["metadata"].get("brand", {}).get("nameFr", ""),
                "similarity_score": offer["similarity_score"]
            }
            context["offers"].append(offer_data)
        
        # Générer un résumé contextuel
        context["summary"] = await self._generate_context_summary(context["offers"], intent)
        
        return context
    
    async def _generate_context_summary(self, offers: List[Dict], intent: str) -> str:
        """Génère un résumé du contexte"""
        if not offers:
            return "Aucune offre trouvée."
        
        if intent == "product_search":
            if len(offers) == 1:
                return f"J'ai trouvé 1 offre correspondant à votre recherche."
            else:
                return f"J'ai trouvé {len(offers)} offres correspondant à votre recherche."
        
        elif intent == "recommendation_request":
            return f"Voici {len(offers)} recommandations personnalisées pour vous."
        
        elif intent == "price_inquiry":
            prices = [offer["price"] for offer in offers if offer["price"]]
            if prices:
                min_price = min(prices)
                max_price = max(prices)
                return f"Les prix varient entre {min_price}€ et {max_price}€."
        
        return f"Voici {len(offers)} offres pertinentes."
    
    async def _generate_response_text(self, 
                                   query: str, 
                                   context: Dict, 
                                   intent: str, 
                                   entities: Optional[Dict],
                                   user_context: Optional[Dict]) -> str:
        """Génère le texte de réponse basé sur le contexte"""
        
        if intent == "product_search":
            return await self._generate_product_search_response(context, entities)
        
        elif intent == "recommendation_request":
            return await self._generate_recommendation_response(context, user_context)
        
        elif intent == "price_inquiry":
            return await self._generate_price_response(context, entities)
        
        elif intent == "availability_check":
            return await self._generate_availability_response(context)
        
        elif intent == "page_navigation":
            return await self._generate_navigation_response(entities)
        
        elif intent == "general_question":
            return await self._generate_general_response(query, context)
        
        else:
            return "Je ne comprends pas votre demande. Pouvez-vous être plus précis ?"
    
    async def _generate_product_search_response(self, context: Dict, entities: Optional[Dict]) -> str:
        """Génère une réponse pour la recherche de produits"""
        offers = context["offers"]
        
        if not offers:
            return "Je n'ai trouvé aucune offre correspondant à votre recherche. Essayez avec d'autres mots-clés."
        
        response_parts = [context["summary"]]
        
        # Ajouter les détails des offres
        for i, offer in enumerate(offers[:3], 1):  # Limiter à 3 offres
            offer_text = f"\n{i}. **{offer['title']}**"
            
            if offer["price"]:
                offer_text += f" - {offer['price']}€"
            
            if offer["condition"]:
                condition_map = {
                    'new': 'Neuf',
                    'like_new': 'Comme neuf',
                    'good': 'Bon état',
                    'fair': 'État correct'
                }
                offer_text += f" ({condition_map.get(offer['condition'], offer['condition'])})"
            
            if offer["brand"]:
                offer_text += f" - {offer['brand']}"
            
            response_parts.append(offer_text)
        
        if len(offers) > 3:
            response_parts.append(f"\n... et {len(offers) - 3} autres offres.")
        
        response_parts.append("\nVoulez-vous plus de détails sur une offre spécifique ?")
        
        return "\n".join(response_parts)
    
    async def _generate_recommendation_response(self, context: Dict, user_context: Optional[Dict]) -> str:
        """Génère une réponse pour les recommandations"""
        offers = context["offers"]
        
        if not offers:
            return "Je n'ai pas assez d'informations pour vous faire des recommandations. Parlez-moi de vos préférences !"
        
        response_parts = ["Voici mes recommandations personnalisées :"]
        
        for i, offer in enumerate(offers[:5], 1):
            offer_text = f"\n{i}. **{offer['title']}**"
            
            if offer["price"]:
                offer_text += f" - {offer['price']}€"
            
            if offer["brand"]:
                offer_text += f" ({offer['brand']})"
            
            response_parts.append(offer_text)
        
        return "\n".join(response_parts)
    
    async def _generate_price_response(self, context: Dict, entities: Optional[Dict]) -> str:
        """Génère une réponse pour les questions de prix"""
        offers = context["offers"]
        
        if not offers:
            return "Je n'ai pas d'informations sur les prix pour cette recherche."
        
        prices = [offer["price"] for offer in offers if offer["price"]]
        
        if not prices:
            return "Les prix ne sont pas disponibles pour ces offres."
        
        min_price = min(prices)
        max_price = max(prices)
        avg_price = sum(prices) / len(prices)
        
        response = f"Voici les informations de prix :\n"
        response += f"• Prix minimum : {min_price}€\n"
        response += f"• Prix maximum : {max_price}€\n"
        response += f"• Prix moyen : {avg_price:.0f}€\n"
        response += f"• {len(prices)} offres trouvées"
        
        return response
    
    async def _generate_availability_response(self, context: Dict) -> str:
        """Génère une réponse pour la vérification de disponibilité"""
        offers = context["offers"]
        
        if not offers:
            return "Aucune offre disponible pour cette recherche."
        
        available_count = len([o for o in offers if o.get("status") == "available"])
        
        if available_count == 0:
            return "Malheureusement, aucune offre n'est actuellement disponible."
        elif available_count == 1:
            return "Il y a 1 offre disponible."
        else:
            return f"Il y a {available_count} offres disponibles."
    
    async def _generate_navigation_response(self, entities: Optional[Dict]) -> str:
        """Génère une réponse pour la navigation"""
        if not entities or not entities.get("target_page"):
            return "Comment puis-je vous aider à naviguer sur MyReprise ?"
        
        target_page = entities["target_page"]
        
        page_responses = {
            "account": "Pour gérer votre compte, allez dans la section 'Mon Profil' en haut à droite.",
            "seller": "Pour devenir vendeur, cliquez sur 'Devenir Vendeur' dans le menu principal.",
            "orders": "Pour voir vos commandes, allez dans 'Mes Commandes' dans votre profil.",
            "support": "Pour le support, contactez-nous via le formulaire de contact ou l'email support@myreprise.com."
        }
        
        return page_responses.get(target_page, "Je ne trouve pas cette page. Pouvez-vous préciser ?")
    
    async def _generate_general_response(self, query: str, context: Dict) -> str:
        """Génère une réponse générale"""
        offers = context["offers"]
        
        if offers:
            return f"J'ai trouvé {len(offers)} offres qui pourraient vous intéresser. Voulez-vous que je vous en dise plus ?"
        else:
            return "Je suis là pour vous aider ! Posez-moi une question sur nos offres ou nos services."
