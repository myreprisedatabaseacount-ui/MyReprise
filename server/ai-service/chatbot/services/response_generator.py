"""
Service de Génération de Réponse
Responsable de la génération des réponses du chatbot
"""

import logging
from typing import Dict, List, Optional, Any
import json
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class ResponseGenerator:
    """Générateur de réponses pour le chatbot MyReprise"""
    
    def __init__(self, llm_service=None):
        self.llm_service = llm_service
        self.response_templates = self._load_response_templates()
        
    def _load_response_templates(self) -> Dict:
        """Charge les templates de réponse"""
        return {
            "greeting": [
                "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
                "Salut ! Que cherchez-vous sur MyReprise ?",
                "Hello ! Je suis là pour vous aider à trouver ce que vous cherchez."
            ],
            "product_search": {
                "found": "J'ai trouvé {count} offre(s) qui correspondent à votre recherche :",
                "not_found": "Je n'ai trouvé aucune offre correspondant à votre recherche. Essayez avec d'autres mots-clés.",
                "partial": "J'ai trouvé quelques offres, mais pas exactement ce que vous cherchez. Voici ce qui s'en rapproche le plus :"
            },
            "recommendation": {
                "personalized": "Voici mes recommandations personnalisées pour vous :",
                "general": "Voici quelques offres qui pourraient vous intéresser :",
                "no_preferences": "Je n'ai pas encore assez d'informations sur vos préférences. Parlez-moi de ce que vous aimez !"
            },
            "price_inquiry": {
                "found": "Voici les informations de prix pour cette recherche :",
                "not_found": "Je n'ai pas d'informations de prix pour cette recherche.",
                "range": "Les prix varient entre {min_price}€ et {max_price}€."
            },
            "navigation": {
                "account": "Pour gérer votre compte, allez dans la section 'Mon Profil' en haut à droite.",
                "seller": "Pour devenir vendeur, cliquez sur 'Devenir Vendeur' dans le menu principal.",
                "orders": "Pour voir vos commandes, allez dans 'Mes Commandes' dans votre profil.",
                "support": "Pour le support, contactez-nous via le formulaire de contact ou l'email support@myreprise.com.",
                "general": "Comment puis-je vous aider à naviguer sur MyReprise ?"
            },
            "error": {
                "general": "Je suis désolé, une erreur s'est produite. Pouvez-vous reformuler votre question ?",
                "no_offers": "Je n'ai pas d'offres à vous montrer pour le moment.",
                "technical": "Je rencontre un problème technique. Veuillez réessayer dans quelques instants."
            },
            "clarification": {
                "product": "Pouvez-vous me donner plus de détails sur le produit que vous cherchez ?",
                "price": "Quel est votre budget approximatif ?",
                "category": "Dans quelle catégorie cherchez-vous ?",
                "general": "Pouvez-vous être plus précis dans votre demande ?"
            }
        }
    
    async def generate_response(self, 
                              query: str,
                              context: Dict,
                              intent: str,
                              entities: Optional[Dict] = None,
                              user_context: Optional[Dict] = None) -> Dict:
        """
        Génère une réponse complète pour le chatbot
        
        Args:
            query: Requête de l'utilisateur
            context: Contexte de la conversation
            intent: Intent classifié
            entities: Entités extraites
            user_context: Contexte utilisateur
            
        Returns:
            Dict contenant la réponse et les métadonnées
        """
        try:
            # Déterminer le type de réponse
            response_type = await self._determine_response_type(intent, context)
            
            # Générer le contenu de la réponse
            response_content = await self._generate_response_content(
                query, context, intent, entities, user_context, response_type
            )
            
            # Construire la réponse finale
            response = {
                "message": response_content["text"],
                "type": response_type,
                "intent": intent,
                "entities": entities or {},
                "context": context,
                "suggestions": response_content.get("suggestions", []),
                "actions": response_content.get("actions", []),
                "metadata": {
                    "timestamp": datetime.now().isoformat(),
                    "response_id": self._generate_response_id(),
                    "confidence": response_content.get("confidence", 1.0)
                }
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de réponse: {e}")
            return self._generate_error_response(str(e))
    
    async def _determine_response_type(self, intent: str, context: Dict) -> str:
        """Détermine le type de réponse basé sur l'intent et le contexte"""
        if intent == "product_search":
            offers = context.get("offers", [])
            if offers:
                return "product_list"
            else:
                return "no_results"
        
        elif intent == "recommendation_request":
            return "recommendation_list"
        
        elif intent == "price_inquiry":
            return "price_info"
        
        elif intent == "page_navigation":
            return "navigation_guide"
        
        elif intent == "general_question":
            return "general_info"
        
        else:
            return "general_response"
    
    async def _generate_response_content(self, 
                                       query: str,
                                       context: Dict,
                                       intent: str,
                                       entities: Optional[Dict],
                                       user_context: Optional[Dict],
                                       response_type: str) -> Dict:
        """Génère le contenu de la réponse"""
        
        if response_type == "product_list":
            return await self._generate_product_list_response(context, entities)
        
        elif response_type == "no_results":
            return await self._generate_no_results_response(query, intent)
        
        elif response_type == "recommendation_list":
            return await self._generate_recommendation_response(context, user_context)
        
        elif response_type == "price_info":
            return await self._generate_price_info_response(context, entities)
        
        elif response_type == "navigation_guide":
            return await self._generate_navigation_response(entities)
        
        elif response_type == "general_info":
            return await self._generate_general_info_response(query, context)
        
        else:
            return await self._generate_fallback_response(query)
    
    async def _generate_product_list_response(self, context: Dict, entities: Optional[Dict]) -> Dict:
        """Génère une réponse pour une liste de produits"""
        offers = context.get("offers", [])
        
        if not offers:
            return {
                "text": self.response_templates["product_search"]["not_found"],
                "suggestions": ["Essayer d'autres mots-clés", "Voir toutes les offres", "Demander des recommandations"]
            }
        
        # Construire la réponse
        response_parts = []
        
        if len(offers) == 1:
            response_parts.append("J'ai trouvé 1 offre qui correspond à votre recherche :")
        else:
            response_parts.append(f"J'ai trouvé {len(offers)} offres qui correspondent à votre recherche :")
        
        # Ajouter les détails des offres
        for i, offer in enumerate(offers[:5], 1):  # Limiter à 5 offres
            offer_text = f"\n{i}. **{offer.get('title', 'Sans titre')}**"
            
            if offer.get("price"):
                offer_text += f" - {offer['price']}€"
            
            if offer.get("condition"):
                condition_map = {
                    'new': 'Neuf',
                    'like_new': 'Comme neuf',
                    'good': 'Bon état',
                    'fair': 'État correct'
                }
                condition_text = condition_map.get(offer["condition"], offer["condition"])
                offer_text += f" ({condition_text})"
            
            if offer.get("brand"):
                offer_text += f" - {offer['brand']}"
            
            response_parts.append(offer_text)
        
        if len(offers) > 5:
            response_parts.append(f"\n... et {len(offers) - 5} autres offres.")
        
        response_parts.append("\nVoulez-vous plus de détails sur une offre spécifique ?")
        
        return {
            "text": "\n".join(response_parts),
            "suggestions": [
                "Voir plus d'offres",
                "Modifier les filtres",
                "Demander des recommandations",
                "Voir les détails d'une offre"
            ],
            "actions": [
                {"type": "view_offers", "label": "Voir toutes les offres"},
                {"type": "filter", "label": "Appliquer des filtres"}
            ]
        }
    
    async def _generate_no_results_response(self, query: str, intent: str) -> Dict:
        """Génère une réponse quand aucun résultat n'est trouvé"""
        return {
            "text": self.response_templates["product_search"]["not_found"],
            "suggestions": [
                "Essayer d'autres mots-clés",
                "Voir toutes les offres disponibles",
                "Demander des recommandations",
                "Parler à un conseiller"
            ],
            "actions": [
                {"type": "search_help", "label": "Aide à la recherche"},
                {"type": "contact_support", "label": "Contacter le support"}
            ]
        }
    
    async def _generate_recommendation_response(self, context: Dict, user_context: Optional[Dict]) -> Dict:
        """Génère une réponse de recommandation"""
        offers = context.get("offers", [])
        
        if not offers:
            return {
                "text": self.response_templates["recommendation"]["no_preferences"],
                "suggestions": [
                    "Parlons de vos préférences",
                    "Voir les offres populaires",
                    "Explorer par catégorie"
                ]
            }
        
        # Déterminer le type de recommandation
        if user_context and user_context.get("preferred_categories"):
            template = self.response_templates["recommendation"]["personalized"]
        else:
            template = self.response_templates["recommendation"]["general"]
        
        response_parts = [template]
        
        # Ajouter les offres recommandées
        for i, offer in enumerate(offers[:5], 1):
            offer_text = f"\n{i}. **{offer.get('title', 'Sans titre')}**"
            
            if offer.get("price"):
                offer_text += f" - {offer['price']}€"
            
            if offer.get("brand"):
                offer_text += f" ({offer['brand']})"
            
            response_parts.append(offer_text)
        
        return {
            "text": "\n".join(response_parts),
            "suggestions": [
                "Voir plus de recommandations",
                "Modifier mes préférences",
                "Voir les détails d'une offre"
            ]
        }
    
    async def _generate_price_info_response(self, context: Dict, entities: Optional[Dict]) -> Dict:
        """Génère une réponse d'information de prix"""
        offers = context.get("offers", [])
        
        if not offers:
            return {
                "text": self.response_templates["price_inquiry"]["not_found"],
                "suggestions": ["Essayer une autre recherche", "Voir toutes les offres"]
            }
        
        prices = [offer.get("price") for offer in offers if offer.get("price")]
        
        if not prices:
            return {
                "text": "Les prix ne sont pas disponibles pour ces offres.",
                "suggestions": ["Contacter le vendeur", "Voir d'autres offres"]
            }
        
        min_price = min(prices)
        max_price = max(prices)
        avg_price = sum(prices) / len(prices)
        
        response_parts = [
            "Voici les informations de prix :",
            f"• Prix minimum : {min_price}€",
            f"• Prix maximum : {max_price}€",
            f"• Prix moyen : {avg_price:.0f}€",
            f"• {len(prices)} offres trouvées"
        ]
        
        return {
            "text": "\n".join(response_parts),
            "suggestions": [
                "Voir les offres dans ma gamme de prix",
                "Filtrer par prix",
                "Voir les détails d'une offre"
            ]
        }
    
    async def _generate_navigation_response(self, entities: Optional[Dict]) -> Dict:
        """Génère une réponse de navigation"""
        if not entities or not entities.get("target_page"):
            return {
                "text": self.response_templates["navigation"]["general"],
                "suggestions": [
                    "Créer un compte",
                    "Devenir vendeur",
                    "Voir mes commandes",
                    "Contacter le support"
                ]
            }
        
        target_page = entities["target_page"]
        page_responses = self.response_templates["navigation"]
        
        text = page_responses.get(target_page, page_responses["general"])
        
        return {
            "text": text,
            "actions": [
                {"type": "navigate", "page": target_page, "label": f"Aller à {target_page}"}
            ]
        }
    
    async def _generate_general_info_response(self, query: str, context: Dict) -> Dict:
        """Génère une réponse d'information générale"""
        return {
            "text": "Je suis là pour vous aider ! Posez-moi une question sur nos offres ou nos services.",
            "suggestions": [
                "Chercher un produit",
                "Voir les recommandations",
                "Obtenir de l'aide",
                "Explorer les catégories"
            ]
        }
    
    async def _generate_fallback_response(self, query: str) -> Dict:
        """Génère une réponse de fallback"""
        return {
            "text": "Je ne comprends pas votre demande. Pouvez-vous être plus précis ?",
            "suggestions": [
                "Chercher un produit",
                "Obtenir de l'aide",
                "Voir les offres populaires"
            ]
        }
    
    def _generate_error_response(self, error_message: str) -> Dict:
        """Génère une réponse d'erreur"""
        return {
            "message": self.response_templates["error"]["general"],
            "type": "error",
            "intent": "error",
            "entities": {},
            "context": {},
            "suggestions": ["Réessayer", "Contacter le support"],
            "actions": [],
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "response_id": self._generate_response_id(),
                "error": error_message
            }
        }
    
    def _generate_response_id(self) -> str:
        """Génère un ID unique pour la réponse"""
        return f"resp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(str(datetime.now()))}"
    
    async def generate_clarification_request(self, missing_info: str) -> Dict:
        """Génère une demande de clarification"""
        clarification_templates = self.response_templates["clarification"]
        
        text = clarification_templates.get(missing_info, clarification_templates["general"])
        
        return {
            "message": text,
            "type": "clarification",
            "intent": "clarification",
            "entities": {"missing_info": missing_info},
            "context": {},
            "suggestions": ["Donner plus de détails", "Annuler la recherche"],
            "actions": [],
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "response_id": self._generate_response_id()
            }
        }
