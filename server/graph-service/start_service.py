#!/usr/bin/env python3
"""
Script de démarrage robuste pour le service Graph Service
"""

import sys
import os
import signal
import time
import logging
from pathlib import Path

# Ajouter le répertoire courant au path Python
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Configuration des logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('graph_service.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def signal_handler(signum, frame):
    """Gestionnaire de signaux pour arrêt propre"""
    logger.info(f"Signal {signum} reçu. Arrêt du service...")
    sys.exit(0)

def main():
    """Fonction principale de démarrage"""
    try:
        # Enregistrer les gestionnaires de signaux
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        logger.info("🚀 Démarrage du service Graph Service...")
        
        # Importer et démarrer le service
        import uvicorn
        from main import app
        
        logger.info("✅ Application chargée avec succès")
        logger.info("🌐 Démarrage du serveur sur http://0.0.0.0:8002")
        
        # Démarrer le serveur
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8002,
            log_level="info",
            access_log=True,
            reload=False  # Désactiver le reload pour la production
        )
        
    except KeyboardInterrupt:
        logger.info("🛑 Arrêt demandé par l'utilisateur")
    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")
        sys.exit(1)
    finally:
        logger.info("👋 Service Graph Service arrêté")

if __name__ == "__main__":
    main()
