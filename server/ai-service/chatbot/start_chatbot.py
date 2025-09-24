#!/usr/bin/env python3
"""
Script de démarrage du Service Chatbot MyReprise
"""

import os
import sys
import uvicorn
from pathlib import Path

# Ajouter le répertoire parent au path
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))

def main():
    """Démarre le service chatbot"""
    print("🤖 Démarrage du Service Chatbot MyReprise")
    print("=" * 50)
    
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8001"))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    workers = int(os.getenv("WORKERS", "1"))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    
    print(f"📍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🔄 Reload: {reload}")
    print(f"👥 Workers: {workers}")
    print(f"📝 Log Level: {log_level}")
    print("=" * 50)
    
    try:
        # Démarrer le serveur
        uvicorn.run(
            "chatbot.main:app",
            host=host,
            port=port,
            reload=reload,
            workers=workers if not reload else 1,
            log_level=log_level,
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du service chatbot...")
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
