"""
Routes FastAPI pour le Chatbot MyReprise
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import Dict, Any

from ..controllers.chatbot_controller import chatbot_controller
from ..models.chat_models import (
    ChatRequest, ChatResponse, SessionCreateRequest, SessionCreateResponse,
    SessionInfo, UserPreferencesUpdate, HealthCheck, ChatbotStats
)

# Créer le routeur
router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest):
    """
    Envoie un message au chatbot et reçoit une réponse
    
    Args:
        request: Requête de chat contenant le message et les métadonnées
        
    Returns:
        Réponse du chatbot avec le message et les suggestions
    """
    return await chatbot_controller.process_chat_message(request)

@router.post("/sessions", response_model=SessionCreateResponse)
async def create_session(request: SessionCreateRequest):
    """
    Crée une nouvelle session de conversation
    
    Args:
        request: Requête de création de session
        
    Returns:
        Informations de la session créée
    """
    return await chatbot_controller.create_session(request)

@router.get("/sessions/{session_id}", response_model=SessionInfo)
async def get_session_info(session_id: str):
    """
    Récupère les informations d'une session
    
    Args:
        session_id: ID de la session
        
    Returns:
        Informations détaillées de la session
    """
    return await chatbot_controller.get_session_info(session_id)

@router.put("/sessions/{session_id}/clear")
async def clear_session(session_id: str):
    """
    Vide le contexte d'une session
    
    Args:
        session_id: ID de la session
        
    Returns:
        Confirmation du vidage
    """
    return await chatbot_controller.clear_session(session_id)

@router.delete("/sessions/{session_id}")
async def end_session(session_id: str):
    """
    Termine une session de conversation
    
    Args:
        session_id: ID de la session
        
    Returns:
        Confirmation de la fin de session
    """
    return await chatbot_controller.end_session(session_id)

@router.put("/users/{user_id}/preferences")
async def update_user_preferences(user_id: int, preferences: UserPreferencesUpdate):
    """
    Met à jour les préférences d'un utilisateur
    
    Args:
        user_id: ID de l'utilisateur
        preferences: Nouvelles préférences
        
    Returns:
        Confirmation de la mise à jour
    """
    return await chatbot_controller.update_user_preferences(user_id, preferences)

@router.get("/users/{user_id}/preferences")
async def get_user_preferences(user_id: int):
    """
    Récupère les préférences d'un utilisateur
    
    Args:
        user_id: ID de l'utilisateur
        
    Returns:
        Préférences de l'utilisateur
    """
    return await chatbot_controller.get_user_preferences(user_id)

@router.get("/users/{user_id}/preferences/refresh")
async def refresh_user_preferences(user_id: int):
    """
    Force la mise à jour des préférences depuis le Graph Service
    
    Args:
        user_id: ID de l'utilisateur
        
    Returns:
        Confirmation de la mise à jour
    """
    return await chatbot_controller.refresh_user_preferences(user_id)

@router.get("/users/{user_id}/preferences/from-graph")
async def get_user_preferences_from_graph(user_id: int):
    """
    Récupère les préférences directement depuis le Graph Service (sans cache)
    
    Args:
        user_id: ID de l'utilisateur
        
    Returns:
        Préférences depuis le Graph Service
    """
    return await chatbot_controller.get_user_preferences_from_graph(user_id)

@router.get("/stats", response_model=ChatbotStats)
async def get_chatbot_stats():
    """
    Récupère les statistiques du chatbot
    
    Returns:
        Statistiques détaillées du chatbot
    """
    return await chatbot_controller.get_chatbot_stats()

@router.get("/health", response_model=HealthCheck)
async def health_check():
    """
    Vérification de santé du service chatbot
    
    Returns:
        État de santé du service
    """
    return await chatbot_controller.health_check()

# Routes utilitaires
@router.get("/intents")
async def get_supported_intents():
    """
    Récupère la liste des intents supportés
    
    Returns:
        Liste des intents supportés
    """
    from ..models.chat_models import IntentType
    
    intents = [
        {
            "name": intent.value,
            "description": _get_intent_description(intent)
        }
        for intent in IntentType
    ]
    
    return {
        "success": True,
        "intents": intents
    }

@router.get("/response-types")
async def get_response_types():
    """
    Récupère la liste des types de réponses
    
    Returns:
        Liste des types de réponses
    """
    from ..models.chat_models import ResponseType
    
    response_types = [
        {
            "name": response_type.value,
            "description": _get_response_type_description(response_type)
        }
        for response_type in ResponseType
    ]
    
    return {
        "success": True,
        "response_types": response_types
    }

def _get_intent_description(intent) -> str:
    """Retourne la description d'un intent"""
    descriptions = {
        "product_search": "Recherche de produits spécifiques",
        "page_navigation": "Navigation vers des pages du site",
        "price_inquiry": "Demande d'informations sur les prix",
        "availability_check": "Vérification de la disponibilité",
        "recommendation_request": "Demande de recommandations",
        "general_question": "Question générale",
        "account_help": "Aide avec le compte utilisateur",
        "technical_support": "Support technique"
    }
    return descriptions.get(intent.value, "Intent non documenté")

def _get_response_type_description(response_type) -> str:
    """Retourne la description d'un type de réponse"""
    descriptions = {
        "product_list": "Liste de produits trouvés",
        "recommendation_list": "Liste de recommandations",
        "price_info": "Informations sur les prix",
        "navigation_guide": "Guide de navigation",
        "general_info": "Information générale",
        "clarification": "Demande de clarification",
        "error": "Message d'erreur"
    }
    return descriptions.get(response_type.value, "Type de réponse non documenté")
