#!/usr/bin/env python3
"""
Script de test pour vérifier la connexion à Neo4j
"""

from neo4j import GraphDatabase
import os

def test_neo4j_connection():
    """Test la connexion à Neo4j"""
    
    # Configuration
    NEO4J_URI = 'bolt://localhost:7687'
    NEO4J_USER = 'neo4j'
    NEO4J_PASSWORD = 'neo4j123'
    
    print(f"🔗 Test de connexion à Neo4j...")
    print(f"📡 URI: {NEO4J_URI}")
    print(f"👤 Utilisateur: {NEO4J_USER}")
    print()
    
    try:
        # Connexion
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        
        # Test de connexion
        with driver.session() as session:
            result = session.run("RETURN 1 as test")
            record = result.single()
            
            if record and record["test"] == 1:
                print("✅ Connexion réussie !")
                print("🎉 Neo4j est accessible et fonctionne correctement")
                return True
            else:
                print("❌ Connexion échouée : résultat inattendu")
                return False
                
    except Exception as e:
        print(f"❌ Erreur de connexion : {e}")
        return False
    finally:
        if 'driver' in locals():
            driver.close()

if __name__ == "__main__":
    success = test_neo4j_connection()
    exit(0 if success else 1)
