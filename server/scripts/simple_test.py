#!/usr/bin/env python3
"""
Test simple : Créer quelques nœuds dans Neo4j depuis MySQL
"""

import mysql.connector
from neo4j import GraphDatabase
import os

# Configuration
mysql_config = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': '',
    'database': 'myreprise'
}

neo4j_uri = 'bolt://localhost:7687'
neo4j_user = 'neo4j'
neo4j_password = 'neo4j123'

print("=== Test simple MySQL → Neo4j ===")

try:
    # Test MySQL
    print("1. Test MySQL...")
    mysql_conn = mysql.connector.connect(**mysql_config)
    mysql_cursor = mysql_conn.cursor(dictionary=True)
    
    # Compter les utilisateurs
    mysql_cursor.execute("SELECT COUNT(*) as count FROM users")
    user_count = mysql_cursor.fetchone()['count']
    print(f"   ✅ MySQL: {user_count} utilisateurs trouvés")
    
    # Test Neo4j connexion simple
    print("2. Test Neo4j...")
    neo4j_driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
    
    with neo4j_driver.session() as session:
        # Test simple
        result = session.run("RETURN 'Hello Neo4j!' as message")
        record = result.single()
        print(f"   ✅ Neo4j: {record['message']}")
        
        # Compter les nœuds existants
        result = session.run("MATCH (n) RETURN count(n) as count")
        node_count = result.single()['count']
        print(f"   ✅ Neo4j: {node_count} nœuds existants")
        
        # Créer un nœud de test
        session.run("CREATE (test:Test {name: 'Migration Test', timestamp: datetime()})")
        print("   ✅ Neo4j: Nœud de test créé")
        
    print("\n🎉 Test réussi ! Les connexions fonctionnent.")
    print("Tu peux maintenant essayer la migration complète.")
    
except mysql.connector.Error as e:
    print(f"❌ Erreur MySQL: {e}")
except Exception as e:
    print(f"❌ Erreur Neo4j: {e}")
finally:
    if 'mysql_conn' in locals():
        mysql_conn.close()
    if 'neo4j_driver' in locals():
        neo4j_driver.close()
