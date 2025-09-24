"""
Modèles de données pour le chatbot MyReprise
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

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

class ResponseType(str, Enum):
    """Types de réponses du chatbot"""
    PRODUCT_LIST = "product_list"
    RECOMMENDATION_LIST = "recommendation_list"
    PRICE_INFO = "price_info"
    NAVIGATION_GUIDE = "navigation_guide"
    GENERAL_INFO = "general_info"
    CLARIFICATION = "clarification"
    ERROR = "error"

class ConversationStyle(str, Enum):
    """Styles de conversation"""
    FORMAL = "formal"
    CASUAL = "casual"
    TECHNICAL = "technical"

class LanguagePreference(str, Enum):
    """Langues supportées"""
    FRENCH = "fr"
    ARABIC = "ar"
    ENGLISH = "en"

# Modèles de base
class BaseChatModel(BaseModel):
    """Modèle de base pour les données du chatbot"""
    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class IntentClassification(BaseChatModel):
    """Résultat de la classification d'intent"""
    intent: IntentType
    confidence: float = Field(..., ge=0.0, le=1.0)
    entities: Dict[str, Any] = Field(default_factory=dict)
    original_message: str

class ChatMessage(BaseChatModel):
    """Message dans une conversation"""
    role: str = Field(..., description="Rôle de l'expéditeur (user, bot, system)")
    content: str = Field(..., description="Contenu du message")
    timestamp: datetime = Field(default_factory=datetime.now)
    message_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ChatSession(BaseChatModel):
    """Session de conversation"""
    session_id: str
    user_id: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)
    last_activity: datetime = Field(default_factory=datetime.now)
    context: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class UserProfile(BaseChatModel):
    """Profil utilisateur pour la personnalisation"""
    user_id: int
    preferred_categories: List[str] = Field(default_factory=list)
    preferred_brands: List[str] = Field(default_factory=list)
    price_range: Dict[str, Union[int, float]] = Field(default_factory=lambda: {"min": 0, "max": 10000})
    interaction_history: List[Dict[str, Any]] = Field(default_factory=list)
    conversation_style: ConversationStyle = ConversationStyle.CASUAL
    language_preference: LanguagePreference = LanguagePreference.FRENCH
    last_interaction: Optional[datetime] = None
    preferences_updated_at: Optional[datetime] = None

class OfferData(BaseChatModel):
    """Données d'une offre pour le chatbot"""
    id: int
    title: str
    description: Optional[str] = None
    price: Optional[float] = None
    condition: Optional[str] = None
    category: Optional[Dict[str, str]] = None
    brand: Optional[Dict[str, str]] = None
    subject: Optional[Dict[str, str]] = None
    status: str = "available"
    similarity_score: Optional[float] = None
    personalization_score: Optional[float] = None

class ChatbotResponse(BaseChatModel):
    """Réponse du chatbot"""
    message: str
    type: ResponseType
    intent: IntentType
    entities: Dict[str, Any] = Field(default_factory=dict)
    context: Dict[str, Any] = Field(default_factory=dict)
    suggestions: List[str] = Field(default_factory=list)
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ChatbotRequest(BaseChatModel):
    """Requête vers le chatbot"""
    message: str
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class EmbeddingData(BaseChatModel):
    """Données d'embedding"""
    text: str
    embedding: List[float]
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)

class SearchFilters(BaseChatModel):
    """Filtres de recherche"""
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    condition: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None

class SimilarityResult(BaseChatModel):
    """Résultat de recherche de similarité"""
    offer_id: int
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RAGContext(BaseChatModel):
    """Contexte pour le RAG"""
    offers: List[OfferData] = Field(default_factory=list)
    summary: str = ""
    intent: IntentType
    entities: Dict[str, Any] = Field(default_factory=dict)
    user_preferences: Optional[Dict[str, Any]] = None

class ChatbotStats(BaseChatModel):
    """Statistiques du chatbot"""
    total_sessions: int = 0
    total_messages: int = 0
    active_sessions: int = 0
    average_messages_per_session: float = 0.0
    most_common_intents: List[Dict[str, Any]] = Field(default_factory=list)
    response_times: Dict[str, float] = Field(default_factory=dict)

# Modèles pour les requêtes API
class ChatRequest(BaseModel):
    """Requête de chat"""
    message: str = Field(..., min_length=1, max_length=1000)
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    language: Optional[LanguagePreference] = LanguagePreference.FRENCH

class ChatResponse(BaseModel):
    """Réponse de chat"""
    success: bool = True
    data: ChatbotResponse
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.now)

class SessionCreateRequest(BaseModel):
    """Requête de création de session"""
    user_id: Optional[int] = None
    language: Optional[LanguagePreference] = LanguagePreference.FRENCH
    initial_context: Optional[Dict[str, Any]] = None

class SessionCreateResponse(BaseModel):
    """Réponse de création de session"""
    success: bool = True
    session_id: str
    message: str = "Session créée avec succès"

class SessionInfo(BaseModel):
    """Informations sur une session"""
    session_id: str
    user_id: Optional[int] = None
    created_at: datetime
    last_activity: datetime
    message_count: int = 0
    current_intent: Optional[IntentType] = None
    is_active: bool = True

class UserPreferencesUpdate(BaseModel):
    """Mise à jour des préférences utilisateur"""
    preferred_categories: Optional[List[str]] = None
    preferred_brands: Optional[List[str]] = None
    price_range: Optional[Dict[str, Union[int, float]]] = None
    conversation_style: Optional[ConversationStyle] = None
    language_preference: Optional[LanguagePreference] = None

class EmbeddingRequest(BaseModel):
    """Requête de génération d'embedding"""
    text: str = Field(..., min_length=1, max_length=5000)
    text_type: str = Field(default="general", description="Type de texte (query, offer, description)")

class EmbeddingResponse(BaseModel):
    """Réponse d'embedding"""
    success: bool = True
    embedding: List[float]
    dimension: int
    model_used: str

class SearchRequest(BaseModel):
    """Requête de recherche"""
    query: str = Field(..., min_length=1, max_length=500)
    user_id: Optional[int] = None
    filters: Optional[SearchFilters] = None
    limit: int = Field(default=10, ge=1, le=50)

class SearchResponse(BaseModel):
    """Réponse de recherche"""
    success: bool = True
    results: List[SimilarityResult]
    total_found: int
    query: str
    filters_applied: Optional[SearchFilters] = None

class HealthCheck(BaseModel):
    """Vérification de santé du service"""
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0"
    services: Dict[str, str] = Field(default_factory=dict)
