"""
Service IA FastAPI pour MyReprise
Responsable des tâches d'intelligence artificielle de l'application
"""

import os
import logging
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

# Import des modules internes
from config.settings import get_settings

# Configuration du logging simple
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire de cycle de vie de l'application"""
    # Startup
    logger.info("🚀 Démarrage du service IA MyReprise")
    
    try:
        logger.info("✅ Service IA initialisé en mode simple")
        
        logger.info("🎉 Service IA démarré avec succès")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Erreur lors du démarrage: {e}")
        raise
    finally:
        # Shutdown
        logger.info("🔄 Arrêt du service IA...")
        logger.info("✅ Service IA arrêté proprement")

# Création de l'application FastAPI
app = FastAPI(
    title="MyReprise AI Service",
    description="Service d'intelligence artificielle pour l'application MyReprise",
    version="1.0.0",  
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    lifespan=lifespan
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)





# Routes de base
@app.get("/", tags=["Base"])
async def root():
    """Endpoint racine"""
    return {
        "message": "🤖 Service IA MyReprise",
        "version": "1.0.0",
        "status": "actif",
        "services": [
            "Traitement de texte",
            "Analyse d'images",
            "Traitement audio",
            "Prédictions ML",
            "Chat IA"
        ]
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check simple pour Docker et monitoring"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "service": "ai-service"
    }



@app.get("/info", tags=["Info"])
async def info():
    """Informations sur le service"""
    return {
        "name": "MyReprise AI Service",
        "version": "1.0.0",
        "environment": settings.environment,
        "python_version": "3.11",
        "framework": "FastAPI",
        "features": {
            "text_processing": True,
            "image_analysis": True,
            "audio_processing": True,
            "machine_learning": True,
            "chat_ai": True
        },
        "models": {
            "openai": "gpt-3.5-turbo",
            "transformers": "bert-base-multilingual",
            "vision": "resnet50",
            "audio": "wav2vec2"
        }
    }

# Route unique de santé
@app.get("/ai/health", tags=["Health"])
async def ai_health():
    """Route de santé unique pour le service IA"""
    print("✅ Service FastAPI IA - Démarré et en bonne santé")
    return {
        "status": "healthy",
        "service": "MyReprise-AI",
        "message": "Service démarré et en bonne santé",
        "timestamp": time.time(),
        "version": "1.0.0"
    }

# Gestionnaires d'erreurs globaux
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Gestionnaire d'erreurs HTTP"""
    logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": time.time()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Gestionnaire d'erreurs générique"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Erreur interne du serveur",
            "status_code": 500,
            "timestamp": time.time()
        }
    )



if __name__ == "__main__":
    # Configuration pour le développement
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.environment == "development" else False,
        workers=1 if settings.environment == "development" else 4,
        log_level="info"
    )
