#!/usr/bin/env python3
"""
Test simple de connexion Neo4j
"""

from neo4j import GraphDatabase
import sys

# Test avec différents mots de passe
passwords = ['neo4j', 'neo4j123', '']
uri = 'bolt://localhost:7687'
user = 'neo4j'

print("Test de connexion Neo4j...")
print(f"URI: {uri}")
print(f"User: {user}")

for password in passwords:
    try:
        print(f"\nTest avec mot de passe: '{password}'")
        driver = GraphDatabase.driver(uri, auth=(user, password))
        
        with driver.session() as session:
            result = session.run("RETURN 'Connexion réussie!' as message")
            record = result.single()
            print(f"✅ SUCCÈS: {record['message']}")
            print(f"✅ Mot de passe correct: '{password}'")
            driver.close()
            sys.exit(0)
            
    except Exception as e:
        print(f"❌ ÉCHEC: {e}")
        continue

print("\n❌ Aucun mot de passe ne fonctionne!")
print("Solutions:")
print("1. Vérifier que Neo4j est démarré: docker ps | findstr neo4j")
print("2. Réinitialiser Neo4j: docker-compose down neo4j && docker volume rm server_neo4j_data && docker-compose up -d neo4j")
print("3. Attendre 30 secondes après le démarrage")
