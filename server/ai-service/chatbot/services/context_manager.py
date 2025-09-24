"""
Service de Gestion de Contexte
Responsable de la gestion des sessions et du contexte conversationnel
"""

import logging
from typing import Dict, List, Optional, Any
import json
import uuid
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)

class ContextManager:
    """Gestionnaire de contexte pour les conversations du chatbot"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self.sessions = {}  # Cache local des sessions
        self.session_ttl = 3600  # 1 heure en secondes
        self.max_context_length = 10  # Nombre maximum de messages dans le contexte
        
    async def create_session(self, user_id: Optional[int] = None, session_data: Optional[Dict] = None) -> str:
        """
        Crée une nouvelle session de conversation
        
        Args:
            user_id: ID de l'utilisateur (optionnel)
            session_data: Données initiales de la session
            
        Returns:
            ID de la session créée
        """
        try:
            session_id = str(uuid.uuid4())
            
            session = {
                "session_id": session_id,
                "user_id": user_id,
                "created_at": datetime.now().isoformat(),
                "last_activity": datetime.now().isoformat(),
                "context": {
                    "current_intent": None,
                    "entities": {},
                    "conversation_history": [],
                    "user_preferences": {},
                    "active_filters": {},
                    "current_offers": []
                },
                "metadata": {
                    "language": "fr",
                    "conversation_style": "casual",
                    "message_count": 0
                }
            }
            
            # Ajouter les données initiales si fournies
            if session_data:
                session["context"].update(session_data)
            
            # Sauvegarder la session
            await self._save_session(session)
            
            logger.info(f"Session créée: {session_id} pour l'utilisateur {user_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Erreur lors de la création de session: {e}")
            raise
    
    async def get_session(self, session_id: str) -> Optional[Dict]:
        """
        Récupère une session par son ID
        
        Args:
            session_id: ID de la session
            
        Returns:
            Dict de la session ou None si non trouvée
        """
        try:
            # Vérifier le cache local
            if session_id in self.sessions:
                session = self.sessions[session_id]
                if self._is_session_valid(session):
                    return session
            
            # Récupérer depuis Redis ou base de données
            session = await self._load_session(session_id)
            
            if session and self._is_session_valid(session):
                # Mettre en cache
                self.sessions[session_id] = session
                return session
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de session {session_id}: {e}")
            return None
    
    async def update_session(self, session_id: str, updates: Dict) -> bool:
        """
        Met à jour une session
        
        Args:
            session_id: ID de la session
            updates: Mises à jour à appliquer
            
        Returns:
            True si la mise à jour a réussi
        """
        try:
            session = await self.get_session(session_id)
            if not session:
                return False
            
            # Appliquer les mises à jour
            self._apply_updates(session, updates)
            
            # Mettre à jour la dernière activité
            session["last_activity"] = datetime.now().isoformat()
            
            # Sauvegarder
            await self._save_session(session)
            
            # Mettre à jour le cache
            self.sessions[session_id] = session
            
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour de session {session_id}: {e}")
            return False
    
    async def add_message_to_context(self, session_id: str, message: Dict) -> bool:
        """
        Ajoute un message au contexte de la session
        
        Args:
            session_id: ID de la session
            message: Message à ajouter
            
        Returns:
            True si l'ajout a réussi
        """
        try:
            session = await self.get_session(session_id)
            if not session:
                return False
            
            # Ajouter le message à l'historique
            message_with_timestamp = {
                **message,
                "timestamp": datetime.now().isoformat()
            }
            
            session["context"]["conversation_history"].append(message_with_timestamp)
            
            # Limiter la taille de l'historique
            if len(session["context"]["conversation_history"]) > self.max_context_length:
                session["context"]["conversation_history"] = session["context"]["conversation_history"][-self.max_context_length:]
            
            # Mettre à jour le compteur de messages
            session["metadata"]["message_count"] += 1
            
            # Sauvegarder
            await self._save_session(session)
            
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'ajout de message à la session {session_id}: {e}")
            return False
    
    async def get_conversation_context(self, session_id: str) -> Dict:
        """
        Récupère le contexte de conversation d'une session
        
        Args:
            session_id: ID de la session
            
        Returns:
            Dict contenant le contexte de conversation
        """
        try:
            session = await self.get_session(session_id)
            if not session:
                return {}
            
            return session["context"]
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du contexte {session_id}: {e}")
            return {}
    
    async def update_intent_context(self, session_id: str, intent: str, entities: Dict) -> bool:
        """
        Met à jour le contexte d'intent d'une session
        
        Args:
            session_id: ID de la session
            intent: Intent actuel
            entities: Entités extraites
            
        Returns:
            True si la mise à jour a réussi
        """
        try:
            updates = {
                "context": {
                    "current_intent": intent,
                    "entities": entities
                }
            }
            
            return await self.update_session(session_id, updates)
            
        except Exception as e:
            logger.error(f"Erreur lors de la mise à jour de l'intent {session_id}: {e}")
            return False
    
    async def set_active_filters(self, session_id: str, filters: Dict) -> bool:
        """
        Définit les filtres actifs d'une session
        
        Args:
            session_id: ID de la session
            filters: Filtres à appliquer
            
        Returns:
            True si la mise à jour a réussi
        """
        try:
            updates = {
                "context": {
                    "active_filters": filters
                }
            }
            
            return await self.update_session(session_id, updates)
            
        except Exception as e:
            logger.error(f"Erreur lors de la définition des filtres {session_id}: {e}")
            return False
    
    async def set_current_offers(self, session_id: str, offers: List[Dict]) -> bool:
        """
        Définit les offres actuellement affichées dans une session
        
        Args:
            session_id: ID de la session
            offers: Liste des offres
            
        Returns:
            True si la mise à jour a réussi
        """
        try:
            updates = {
                "context": {
                    "current_offers": offers
                }
            }
            
            return await self.update_session(session_id, updates)
            
        except Exception as e:
            logger.error(f"Erreur lors de la définition des offres {session_id}: {e}")
            return False
    
    async def clear_session_context(self, session_id: str) -> bool:
        """
        Vide le contexte d'une session
        
        Args:
            session_id: ID de la session
            
        Returns:
            True si le vidage a réussi
        """
        try:
            updates = {
                "context": {
                    "current_intent": None,
                    "entities": {},
                    "conversation_history": [],
                    "active_filters": {},
                    "current_offers": []
                }
            }
            
            return await self.update_session(session_id, updates)
            
        except Exception as e:
            logger.error(f"Erreur lors du vidage du contexte {session_id}: {e}")
            return False
    
    async def end_session(self, session_id: str) -> bool:
        """
        Termine une session
        
        Args:
            session_id: ID de la session
            
        Returns:
            True si la session a été terminée
        """
        try:
            # Supprimer de Redis
            if self.redis_client:
                await self.redis_client.delete(f"session:{session_id}")
            
            # Supprimer du cache local
            if session_id in self.sessions:
                del self.sessions[session_id]
            
            logger.info(f"Session terminée: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la fin de session {session_id}: {e}")
            return False
    
    def _is_session_valid(self, session: Dict) -> bool:
        """Vérifie si une session est encore valide"""
        try:
            last_activity = datetime.fromisoformat(session["last_activity"])
            return datetime.now() - last_activity < timedelta(seconds=self.session_ttl)
        except:
            return False
    
    def _apply_updates(self, session: Dict, updates: Dict):
        """Applique les mises à jour à une session"""
        def deep_update(d, u):
            for k, v in u.items():
                if isinstance(v, dict):
                    d[k] = deep_update(d.get(k, {}), v)
                else:
                    d[k] = v
            return d
        
        deep_update(session, updates)
    
    async def _save_session(self, session: Dict):
        """Sauvegarde une session"""
        try:
            if self.redis_client:
                # Sauvegarder dans Redis
                await self.redis_client.setex(
                    f"session:{session['session_id']}",
                    self.session_ttl,
                    json.dumps(session, ensure_ascii=False)
                )
            else:
                # Sauvegarder dans le cache local
                self.sessions[session["session_id"]] = session
                
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde de session: {e}")
            raise
    
    async def _load_session(self, session_id: str) -> Optional[Dict]:
        """Charge une session depuis le stockage"""
        try:
            if self.redis_client:
                # Charger depuis Redis
                session_data = await self.redis_client.get(f"session:{session_id}")
                if session_data:
                    return json.loads(session_data)
            else:
                # Charger depuis le cache local
                return self.sessions.get(session_id)
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur lors du chargement de session: {e}")
            return None
    
    async def cleanup_expired_sessions(self):
        """Nettoie les sessions expirées"""
        try:
            expired_sessions = []
            
            for session_id, session in self.sessions.items():
                if not self._is_session_valid(session):
                    expired_sessions.append(session_id)
            
            for session_id in expired_sessions:
                await self.end_session(session_id)
            
            if expired_sessions:
                logger.info(f"Sessions expirées nettoyées: {len(expired_sessions)}")
                
        except Exception as e:
            logger.error(f"Erreur lors du nettoyage des sessions: {e}")
    
    async def get_session_stats(self) -> Dict:
        """Récupère les statistiques des sessions"""
        try:
            active_sessions = len(self.sessions)
            
            # Calculer les statistiques
            total_messages = sum(
                session["metadata"]["message_count"] 
                for session in self.sessions.values()
            )
            
            return {
                "active_sessions": active_sessions,
                "total_messages": total_messages,
                "average_messages_per_session": total_messages / active_sessions if active_sessions > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du calcul des statistiques: {e}")
            return {}
