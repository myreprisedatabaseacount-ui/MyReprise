"""
Service Chatbot MyReprise - Point d'entrée principal
"""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from .routes.chatbot_routes import router as chatbot_router
from .controllers.chatbot_controller import chatbot_controller

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire de cycle de vie de l'application"""
    # Startup
    logger.info("🚀 Démarrage du service Chatbot MyReprise")
    
    try:
        # Initialiser les services du chatbot
        await chatbot_controller._initialize_services()
        logger.info("✅ Services du chatbot initialisés avec succès")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du démarrage: {e}")
        raise
    finally:
        # Shutdown
        logger.info("🔄 Arrêt du service Chatbot MyReprise...")
        logger.info("✅ Service Chatbot arrêté proprement")

# Création de l'application FastAPI
app = FastAPI(
    title="MyReprise Chatbot Service",
    description="Service d'intelligence artificielle conversationnelle pour la plateforme MyReprise",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Inclure les routes du chatbot
app.include_router(chatbot_router)

# Routes de base
@app.get("/", tags=["Base"])
async def root():
    """Endpoint racine du service chatbot"""
    return {
        "message": "🤖 Service Chatbot MyReprise",
        "version": "1.0.0",
        "status": "actif",
        "description": "Service d'intelligence artificielle conversationnelle",
        "features": [
            "Classification d'intentions",
            "Génération d'embeddings",
            "Recherche sémantique",
            "Recommandations personnalisées",
            "Gestion de contexte conversationnel",
            "Génération de réponses intelligentes"
        ],
        "endpoints": {
            "chat": "/chatbot/chat",
            "sessions": "/chatbot/sessions",
            "health": "/chatbot/health",
            "docs": "/docs"
        }
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Vérification de santé du service"""
    try:
        health_status = await chatbot_controller.health_check()
        return health_status
    except Exception as e:
        logger.error(f"Erreur lors de la vérification de santé: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "2024-01-01T00:00:00Z"
        }

# Gestionnaires d'erreurs globaux
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Gestionnaire d'erreurs HTTP"""
    logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return {
        "error": exc.detail,
        "status_code": exc.status_code,
        "timestamp": "2024-01-01T00:00:00Z"
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Gestionnaire d'erreurs générique"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return {
        "error": "Erreur interne du serveur",
        "status_code": 500,
        "timestamp": "2024-01-01T00:00:00Z"
    }

if __name__ == "__main__":
    # Configuration pour le développement
    uvicorn.run(
        "chatbot.main:app",
        host="0.0.0.0",
        port=8001,  # Port différent du service principal
        reload=True,
        workers=1,
        log_level="info"
    )
