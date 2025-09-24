"""
Templates de réponse pour le chatbot MyReprise
"""

from typing import Dict, List, Any, Optional
from enum import Enum

class ResponseTemplateType(str, Enum):
    """Types de templates de réponse"""
    GREETING = "greeting"
    PRODUCT_SEARCH = "product_search"
    RECOMMENDATION = "recommendation"
    PRICE_INQUIRY = "price_inquiry"
    NAVIGATION = "navigation"
    ERROR = "error"
    CLARIFICATION = "clarification"
    CONFIRMATION = "confirmation"

class ResponseTemplates:
    """Gestionnaire des templates de réponse"""
    
    def __init__(self):
        self.templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, Dict[str, Any]]:
        """Charge tous les templates de réponse"""
        return {
            ResponseTemplateType.GREETING: {
                "templates": [
                    "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
                    "Salut ! Que cherchez-vous sur MyReprise ?",
                    "Hello ! Je suis là pour vous aider à trouver ce que vous cherchez.",
                    "Bienvenue ! Comment puis-je vous assister ?",
                    "Bonjour ! Dites-moi ce que vous recherchez."
                ],
                "variables": [],
                "suggestions": [
                    "Chercher un produit",
                    "Voir les recommandations",
                    "Obtenir de l'aide",
                    "Explorer les catégories"
                ]
            },
            
            ResponseTemplateType.PRODUCT_SEARCH: {
                "found": {
                    "templates": [
                        "J'ai trouvé {count} offre(s) qui correspondent à votre recherche :",
                        "Voici {count} résultat(s) pour votre recherche :",
                        "Parfait ! J'ai trouvé {count} offre(s) qui pourraient vous intéresser :"
                    ],
                    "variables": ["count"],
                    "suggestions": [
                        "Voir plus d'offres",
                        "Modifier les filtres",
                        "Demander des recommandations",
                        "Voir les détails d'une offre"
                    ]
                },
                "not_found": {
                    "templates": [
                        "Je n'ai trouvé aucune offre correspondant à votre recherche. Essayez avec d'autres mots-clés.",
                        "Désolé, aucun résultat trouvé. Pouvez-vous reformuler votre recherche ?",
                        "Aucune offre ne correspond à vos critères. Essayez d'autres termes de recherche."
                    ],
                    "variables": [],
                    "suggestions": [
                        "Essayer d'autres mots-clés",
                        "Voir toutes les offres disponibles",
                        "Demander des recommandations",
                        "Parler à un conseiller"
                    ]
                },
                "partial": {
                    "templates": [
                        "J'ai trouvé quelques offres, mais pas exactement ce que vous cherchez. Voici ce qui s'en rapproche le plus :",
                        "Pas de correspondance exacte, mais voici des offres similaires :",
                        "Voici des offres proches de votre recherche :"
                    ],
                    "variables": [],
                    "suggestions": [
                        "Affiner la recherche",
                        "Voir toutes les offres",
                        "Demander des recommandations"
                    ]
                }
            },
            
            ResponseTemplateType.RECOMMENDATION: {
                "personalized": {
                    "templates": [
                        "Voici mes recommandations personnalisées pour vous :",
                        "Basé sur vos préférences, je vous recommande :",
                        "Voici des offres qui correspondent à vos goûts :"
                    ],
                    "variables": [],
                    "suggestions": [
                        "Voir plus de recommandations",
                        "Modifier mes préférences",
                        "Voir les détails d'une offre"
                    ]
                },
                "general": {
                    "templates": [
                        "Voici quelques offres qui pourraient vous intéresser :",
                        "Découvrez ces offres populaires :",
                        "Voici des suggestions pour vous :"
                    ],
                    "variables": [],
                    "suggestions": [
                        "Voir plus d'offres",
                        "Personnaliser mes préférences",
                        "Explorer par catégorie"
                    ]
                },
                "no_preferences": {
                    "templates": [
                        "Je n'ai pas encore assez d'informations sur vos préférences. Parlez-moi de ce que vous aimez !",
                        "Pour vous faire de meilleures recommandations, dites-moi ce qui vous intéresse.",
                        "Aidez-moi à vous connaître mieux en me parlant de vos goûts !"
                    ],
                    "variables": [],
                    "suggestions": [
                        "Parlons de vos préférences",
                        "Voir les offres populaires",
                        "Explorer par catégorie"
                    ]
                }
            },
            
            ResponseTemplateType.PRICE_INQUIRY: {
                "found": {
                    "templates": [
                        "Voici les informations de prix pour cette recherche :",
                        "Voici les prix que j'ai trouvés :",
                        "Voici les informations tarifaires :"
                    ],
                    "variables": [],
                    "suggestions": [
                        "Voir les offres dans ma gamme de prix",
                        "Filtrer par prix",
                        "Voir les détails d'une offre"
                    ]
                },
                "not_found": {
                    "templates": [
                        "Je n'ai pas d'informations de prix pour cette recherche.",
                        "Les prix ne sont pas disponibles pour cette recherche.",
                        "Aucune information tarifaire trouvée."
                    ],
                    "variables": [],
                    "suggestions": [
                        "Essayer une autre recherche",
                        "Voir toutes les offres",
                        "Contacter le vendeur"
                    ]
                },
                "range": {
                    "templates": [
                        "Les prix varient entre {min_price}€ et {max_price}€.",
                        "Vous trouverez des offres entre {min_price}€ et {max_price}€.",
                        "La gamme de prix va de {min_price}€ à {max_price}€."
                    ],
                    "variables": ["min_price", "max_price"],
                    "suggestions": [
                        "Voir les offres dans cette gamme",
                        "Filtrer par prix",
                        "Voir les détails"
                    ]
                }
            },
            
            ResponseTemplateType.NAVIGATION: {
                "account": {
                    "templates": [
                        "Pour gérer votre compte, allez dans la section 'Mon Profil' en haut à droite.",
                        "Vous pouvez accéder à votre compte via le menu 'Mon Profil'.",
                        "Cliquez sur 'Mon Profil' pour gérer votre compte."
                    ],
                    "variables": [],
                    "suggestions": [
                        "Aller à mon profil",
                        "Modifier mes informations",
                        "Voir mes paramètres"
                    ]
                },
                "seller": {
                    "templates": [
                        "Pour devenir vendeur, cliquez sur 'Devenir Vendeur' dans le menu principal.",
                        "Vous pouvez vous inscrire comme vendeur via le menu 'Devenir Vendeur'.",
                        "Accédez à l'inscription vendeur depuis le menu principal."
                    ],
                    "variables": [],
                    "suggestions": [
                        "Devenir vendeur",
                        "Voir les conditions",
                        "En savoir plus"
                    ]
                },
                "orders": {
                    "templates": [
                        "Pour voir vos commandes, allez dans 'Mes Commandes' dans votre profil.",
                        "Vous trouverez vos commandes dans la section 'Mes Commandes'.",
                        "Accédez à vos commandes via votre profil."
                    ],
                    "variables": [],
                    "suggestions": [
                        "Voir mes commandes",
                        "Suivre une commande",
                        "Historique des achats"
                    ]
                },
                "support": {
                    "templates": [
                        "Pour le support, contactez-nous via le formulaire de contact ou l'email support@myreprise.com.",
                        "Vous pouvez nous contacter via le formulaire de contact ou par email.",
                        "Notre équipe support est disponible via le formulaire de contact."
                    ],
                    "variables": [],
                    "suggestions": [
                        "Contacter le support",
                        "Voir la FAQ",
                        "Signaler un problème"
                    ]
                },
                "general": {
                    "templates": [
                        "Comment puis-je vous aider à naviguer sur MyReprise ?",
                        "Que souhaitez-vous faire sur notre site ?",
                        "Dites-moi ce que vous cherchez à accomplir."
                    ],
                    "variables": [],
                    "suggestions": [
                        "Créer un compte",
                        "Devenir vendeur",
                        "Voir mes commandes",
                        "Contacter le support"
                    ]
                }
            },
            
            ResponseTemplateType.ERROR: {
                "general": {
                    "templates": [
                        "Je suis désolé, une erreur s'est produite. Pouvez-vous reformuler votre question ?",
                        "Une erreur technique s'est produite. Veuillez réessayer.",
                        "Désolé, je rencontre un problème. Pouvez-vous répéter votre demande ?"
                    ],
                    "variables": [],
                    "suggestions": [
                        "Réessayer",
                        "Contacter le support",
                        "Reformuler la question"
                    ]
                },
                "no_offers": {
                    "templates": [
                        "Je n'ai pas d'offres à vous montrer pour le moment.",
                        "Aucune offre disponible actuellement.",
                        "Pas d'offres trouvées dans notre base de données."
                    ],
                    "variables": [],
                    "suggestions": [
                        "Réessayer plus tard",
                        "Voir toutes les offres",
                        "Contacter le support"
                    ]
                },
                "technical": {
                    "templates": [
                        "Je rencontre un problème technique. Veuillez réessayer dans quelques instants.",
                        "Service temporairement indisponible. Réessayez bientôt.",
                        "Problème technique détecté. Veuillez patienter."
                    ],
                    "variables": [],
                    "suggestions": [
                        "Réessayer",
                        "Contacter le support",
                        "Vérifier la connexion"
                    ]
                }
            },
            
            ResponseTemplateType.CLARIFICATION: {
                "product": {
                    "templates": [
                        "Pouvez-vous me donner plus de détails sur le produit que vous cherchez ?",
                        "Quel type de produit recherchez-vous exactement ?",
                        "Pouvez-vous préciser le produit souhaité ?"
                    ],
                    "variables": [],
                    "suggestions": [
                        "Donner plus de détails",
                        "Annuler la recherche",
                        "Voir les catégories"
                    ]
                },
                "price": {
                    "templates": [
                        "Quel est votre budget approximatif ?",
                        "Dans quelle gamme de prix souhaitez-vous rester ?",
                        "Avez-vous un budget en tête ?"
                    ],
                    "variables": [],
                    "suggestions": [
                        "Indiquer mon budget",
                        "Voir toutes les gammes",
                        "Pas de limite de prix"
                    ]
                },
                "category": {
                    "templates": [
                        "Dans quelle catégorie cherchez-vous ?",
                        "Quel type d'articles vous intéresse ?",
                        "Pouvez-vous préciser la catégorie ?"
                    ],
                    "variables": [],
                    "suggestions": [
                        "Voir les catégories",
                        "Indiquer la catégorie",
                        "Explorer les options"
                    ]
                },
                "general": {
                    "templates": [
                        "Pouvez-vous être plus précis dans votre demande ?",
                        "Je ne suis pas sûr de comprendre. Pouvez-vous clarifier ?",
                        "Pouvez-vous reformuler votre question ?"
                    ],
                    "variables": [],
                    "suggestions": [
                        "Donner plus de détails",
                        "Reformuler",
                        "Obtenir de l'aide"
                    ]
                }
            },
            
            ResponseTemplateType.CONFIRMATION: {
                "templates": [
                    "Parfait ! J'ai bien compris votre demande.",
                    "Excellent ! Je vais traiter votre demande.",
                    "Très bien ! Laissez-moi vous aider avec cela."
                ],
                "variables": [],
                "suggestions": [
                    "Continuer",
                    "Modifier ma demande",
                    "Voir les résultats"
                ]
            }
        }
    
    def get_template(self, 
                    template_type: ResponseTemplateType, 
                    subtype: Optional[str] = None,
                    variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Récupère un template de réponse
        
        Args:
            template_type: Type de template
            subtype: Sous-type (optionnel)
            variables: Variables à remplacer dans le template
            
        Returns:
            Template avec texte et suggestions
        """
        try:
            template_data = self.templates.get(template_type)
            if not template_data:
                return self._get_fallback_template()
            
            # Si un sous-type est spécifié
            if subtype and isinstance(template_data, dict) and subtype in template_data:
                template_data = template_data[subtype]
            
            # Sélectionner un template aléatoire
            import random
            templates = template_data.get("templates", [])
            if not templates:
                return self._get_fallback_template()
            
            selected_template = random.choice(templates)
            
            # Remplacer les variables
            if variables:
                try:
                    selected_template = selected_template.format(**variables)
                except KeyError as e:
                    logger.warning(f"Variable manquante dans le template: {e}")
            
            return {
                "text": selected_template,
                "suggestions": template_data.get("suggestions", []),
                "variables": template_data.get("variables", [])
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du template: {e}")
            return self._get_fallback_template()
    
    def _get_fallback_template(self) -> Dict[str, Any]:
        """Retourne un template de fallback"""
        return {
            "text": "Je suis là pour vous aider ! Comment puis-je vous assister ?",
            "suggestions": [
                "Chercher un produit",
                "Obtenir de l'aide",
                "Voir les offres"
            ],
            "variables": []
        }
    
    def format_offer_list(self, offers: List[Dict[str, Any]], max_offers: int = 5) -> str:
        """
        Formate une liste d'offres en texte
        
        Args:
            offers: Liste des offres
            max_offers: Nombre maximum d'offres à afficher
            
        Returns:
            Texte formaté de la liste d'offres
        """
        try:
            if not offers:
                return "Aucune offre trouvée."
            
            formatted_offers = []
            for i, offer in enumerate(offers[:max_offers], 1):
                offer_text = f"{i}. **{offer.get('title', 'Sans titre')}**"
                
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
                
                formatted_offers.append(offer_text)
            
            result = "\n".join(formatted_offers)
            
            if len(offers) > max_offers:
                result += f"\n... et {len(offers) - max_offers} autres offres."
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors du formatage de la liste d'offres: {e}")
            return "Erreur lors de l'affichage des offres."

# Instance globale des templates
response_templates = ResponseTemplates()
