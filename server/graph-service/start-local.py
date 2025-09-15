#!/usr/bin/env python3
"""
Script pour démarrer le graph-service en mode développement local
avec la configuration correcte pour se connecter à Neo4j Docker
"""

import os
import uvicorn

# Configuration pour développement local
os.environ['NEO4J_URI'] = 'bolt://localhost:7687'
os.environ['NEO4J_USER'] = 'neo4j'
os.environ['NEO4J_PASSWORD'] = 'neo4j123'

if __name__ == "__main__":
    print("🚀 Démarrage du Graph Service en mode local...")
    print(f"📡 Connexion Neo4j: {os.environ['NEO4J_URI']}")
    print(f"👤 Utilisateur: {os.environ['NEO4J_USER']}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )
