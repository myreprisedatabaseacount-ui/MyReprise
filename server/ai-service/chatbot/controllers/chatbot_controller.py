"""
Contrôleur principal du Chatbot MyReprise
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime

from ..models.chat_models import (
    ChatRequest, ChatResponse, SessionCreateRequest, SessionCreateResponse,
    SessionInfo, UserPreferencesUpdate, HealthCheck, ChatbotStats
)
from ..services.intent_classifier import IntentClassifier, IntentType
from ..services.embedding_service import EmbeddingService
from ..services.rag_service import RAGService
from ..services.personalization_service import PersonalizationService
from ..services.context_manager import ContextManager
from ..services.response_generator import ResponseGenerator

logger = logging.getLogger(__name__)

class ChatbotController:
    """Contrôleur principal du chatbot"""
    
    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.embedding_service = EmbeddingService()
        self.personalization_service = PersonalizationService()
        self.context_manager = ContextManager()
        self.rag_service = RAGService(
            self.embedding_service, 
            self.personalization_service
        )
        self.response_generator = ResponseGenerator()
        
        # Initialiser les services
        self._initialize_services()
    
    async def _initialize_services(self):
        """Initialise tous les services"""
        try:
            await self.embedding_service.initialize()
            logger.info("Services du chatbot initialisés avec succès")
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation des services: {e}")
            raise
    
    async def process_chat_message(self, request: ChatRequest) -> ChatResponse:
        """
        Traite un message de chat et retourne une réponse
        
        Args:
            request: Requête de chat
            
        Returns:
            Réponse du chatbot
        """
        try:
            # 1. Créer ou récupérer la session
            session_id = request.session_id
            if not session_id:
                session_id = await self.context_manager.create_session(
                    user_id=request.user_id,
                    session_data={"language": request.language or "fr"}
                )
            
            # 2. Classifier l'intent
            intent_result = await self.intent_classifier.classify_intent(
                request.message, 
                request.user_id
            )
            
            # 3. Mettre à jour le contexte de la session
            await self.context_manager.update_intent_context(
                session_id, 
                intent_result["intent"], 
                intent_result["entities"]
            )
            
            # 4. Générer la réponse avec RAG
            rag_response = await self.rag_service.generate_response(
                query=request.message,
                user_id=request.user_id,
                intent=intent_result["intent"],
                entities=intent_result["entities"]
            )
            
            # 5. Générer la réponse finale
            final_response = await self.response_generator.generate_response(
                query=request.message,
                context=rag_response["context"],
                intent=intent_result["intent"],
                entities=intent_result["entities"],
                user_context=rag_response.get("user_context")
            )
            
            # 6. Ajouter le message à l'historique
            await self.context_manager.add_message_to_context(
                session_id,
                {
                    "role": "user",
                    "content": request.message,
                    "intent": intent_result["intent"],
                    "entities": intent_result["entities"]
                }
            )
            
            await self.context_manager.add_message_to_context(
                session_id,
                {
                    "role": "bot",
                    "content": final_response["message"],
                    "type": final_response["type"],
                    "intent": intent_result["intent"]
                }
            )
            
            # 7. Apprendre de l'interaction (en arrière-plan)
            if request.user_id:
                await self._learn_from_interaction(request.user_id, {
                    "message": request.message,
                    "intent": intent_result["intent"],
                    "response": final_response,
                    "context": rag_response["context"]
                })
            
            return ChatResponse(
                success=True,
                data=final_response,
                session_id=session_id,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement du message: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors du traitement du message: {str(e)}"
            )
    
    async def create_session(self, request: SessionCreateRequest) -> SessionCreateResponse:
        """
        Crée une nouvelle session de conversation
        
        Args:
            request: Requête de création de session
            
        Returns:
            Réponse de création de session
        """
        try:
            session_id = await self.context_manager.create_session(
                user_id=request.user_id,
                session_data={
                    "language": request.language,
                    "initial_context": request.initial_context or {}
                }
            )
            
            return SessionCreateResponse(
                success=True,
                session_id=session_id,
                message="Session créée avec succès"
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la création de session: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la création de session: {str(e)}"
            )
    
    async def get_session_info(self, session_id: str) -> SessionInfo:
        """
        Récupère les informations d'une session
        
        Args:
            session_id: ID de la session
            
        Returns:
            Informations de la session
        """
        try:
            session = await self.context_manager.get_session(session_id)
            if not session:
                raise HTTPException(
                    status_code=404,
                    detail="Session non trouvée"
                )
            
            return SessionInfo(
                session_id=session["session_id"],
                user_id=session["user_id"],
                created_at=datetime.fromisoformat(session["created_at"]),
                last_activity=datetime.fromisoformat(session["last_activity"]),
                message_count=session["metadata"]["message_count"],
                current_intent=session["context"].get("current_intent"),
                is_active=True
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la session: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la récupération de la session: {str(e)}"
            )
    
    async def update_user_preferences(self, user_id: int, preferences: UserPreferencesUpdate) -> Dict[str, Any]:
        """
        Met à jour les préférences utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            preferences: Nouvelles préférences
            
        Returns:
            Résultat de la mise à jour
        """
        try:
            success = await self.personalization_service.update_user_preferences(
                user_id, 
                preferences.dict(exclude_unset=True)
            )
            
            if success:
                return {
                    "success": True,
                    "message": "Préférences mises à jour avec succès",
                    "user_id": user_id
                }
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Erreur lors de la mise à jour des préférences"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour des préférences: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la mise à jour des préférences: {str(e)}"
            )
    
    async def get_user_preferences(self, user_id: int) -> Dict[str, Any]:
        """
        Récupère les préférences utilisateur
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Préférences utilisateur
        """
        try:
            user_context = await self.personalization_service.get_user_context(user_id)
            
            if not user_context:
                raise HTTPException(
                    status_code=404,
                    detail="Utilisateur non trouvé"
                )
            
            return {
                "success": True,
                "data": user_context,
                "user_id": user_id
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des préférences: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la récupération des préférences: {str(e)}"
            )
    
    async def refresh_user_preferences(self, user_id: int) -> Dict[str, Any]:
        """
        Force la mise à jour des préférences depuis le Graph Service
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Confirmation de la mise à jour
        """
        try:
            success = await self.personalization_service.refresh_user_preferences_from_graph(user_id)
            
            if success:
                return {
                    "success": True,
                    "message": "Préférences mises à jour depuis le Graph Service",
                    "user_id": user_id
                }
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Erreur lors de la mise à jour des préférences"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour des préférences: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la mise à jour des préférences: {str(e)}"
            )
    
    async def get_user_preferences_from_graph(self, user_id: int) -> Dict[str, Any]:
        """
        Récupère les préférences directement depuis le Graph Service
        
        Args:
            user_id: ID de l'utilisateur
            
        Returns:
            Préférences depuis le Graph Service
        """
        try:
            preferences = await self.personalization_service.get_user_preferences_from_graph(user_id)
            
            if preferences:
                return {
                    "success": True,
                    "data": preferences,
                    "user_id": user_id,
                    "source": "graph_service"
                }
            else:
                raise HTTPException(
                    status_code=404,
                    detail="Préférences non trouvées dans le Graph Service"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des préférences depuis Graph Service: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la récupération des préférences: {str(e)}"
            )
    
    async def clear_session(self, session_id: str) -> Dict[str, Any]:
        """
        Vide le contexte d'une session
        
        Args:
            session_id: ID de la session
            
        Returns:
            Résultat du vidage
        """
        try:
            success = await self.context_manager.clear_session_context(session_id)
            
            if success:
                return {
                    "success": True,
                    "message": "Contexte de session vidé avec succès",
                    "session_id": session_id
                }
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Erreur lors du vidage de la session"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors du vidage de la session: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors du vidage de la session: {str(e)}"
            )
    
    async def end_session(self, session_id: str) -> Dict[str, Any]:
        """
        Termine une session
        
        Args:
            session_id: ID de la session
            
        Returns:
            Résultat de la fin de session
        """
        try:
            success = await self.context_manager.end_session(session_id)
            
            if success:
                return {
                    "success": True,
                    "message": "Session terminée avec succès",
                    "session_id": session_id
                }
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Erreur lors de la fin de session"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Erreur lors de la fin de session: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la fin de session: {str(e)}"
            )
    
    async def get_chatbot_stats(self) -> ChatbotStats:
        """
        Récupère les statistiques du chatbot
        
        Returns:
            Statistiques du chatbot
        """
        try:
            session_stats = await self.context_manager.get_session_stats()
            
            return ChatbotStats(
                total_sessions=session_stats.get("active_sessions", 0),
                total_messages=session_stats.get("total_messages", 0),
                active_sessions=session_stats.get("active_sessions", 0),
                average_messages_per_session=session_stats.get("average_messages_per_session", 0.0)
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des statistiques: {e}")
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la récupération des statistiques: {str(e)}"
            )
    
    async def health_check(self) -> HealthCheck:
        """
        Vérification de santé du service chatbot
        
        Returns:
            État de santé du service
        """
        try:
            # Vérifier l'état des services
            services_status = {
                "intent_classifier": "healthy",
                "embedding_service": "healthy" if self.embedding_service.model else "unhealthy",
                "rag_service": "healthy",
                "personalization_service": "healthy",
                "context_manager": "healthy",
                "response_generator": "healthy"
            }
            
            return HealthCheck(
                status="healthy",
                timestamp=datetime.now(),
                version="1.0.0",
                services=services_status
            )
            
        except Exception as e:
            logger.error(f"Erreur lors de la vérification de santé: {e}")
            return HealthCheck(
                status="unhealthy",
                timestamp=datetime.now(),
                version="1.0.0",
                services={"error": str(e)}
            )
    
    async def _learn_from_interaction(self, user_id: int, interaction_data: Dict[str, Any]):
        """Apprend des interactions utilisateur en arrière-plan"""
        try:
            await self.personalization_service.learn_from_interaction(user_id, interaction_data)
        except Exception as e:
            logger.error(f"Erreur lors de l'apprentissage: {e}")

# Instance globale du contrôleur
chatbot_controller = ChatbotController()
