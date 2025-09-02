#!/usr/bin/env python3
"""
Script de test pour vérifier la migration MySQL → Neo4j
"""

import requests
from neo4j import GraphDatabase
import mysql.connector
import os
import json
from datetime import datetime

class MigrationTester:
    def __init__(self):
        # Configuration Neo4j
        self.neo4j_uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        self.neo4j_user = os.getenv('NEO4J_USER', 'neo4j')
        self.neo4j_password = os.getenv('NEO4J_PASSWORD', 'neo4j123')
        
        # Configuration service Graph
        self.graph_service_url = os.getenv('GRAPH_SERVICE_URL', 'http://localhost:8002')
        
        self.driver = GraphDatabase.driver(
            self.neo4j_uri,
            auth=(self.neo4j_user, self.neo4j_password)
        )

    def test_neo4j_connection(self):
        """Test de la connexion Neo4j"""
        print("🔗 Test connexion Neo4j...")
        try:
            with self.driver.session() as session:
                result = session.run("RETURN 'Hello Neo4j!' as message")
                record = result.single()
                print(f"✅ Neo4j connecté: {record['message']}")
                return True
        except Exception as e:
            print(f"❌ Erreur Neo4j: {e}")
            return False

    def test_graph_service_connection(self):
        """Test de la connexion au service Graph"""
        print("🔗 Test connexion service Graph...")
        try:
            response = requests.get(f"{self.graph_service_url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Service Graph: {data['status']}")
                return True
            else:
                print(f"❌ Service Graph inaccessible: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Erreur service Graph: {e}")
            return False

    def test_data_integrity(self):
        """Vérifie l'intégrité des données migrées"""
        print("📊 Test intégrité des données...")
        
        with self.driver.session() as session:
            # Compter les nœuds
            counts = {}
            node_types = ['User', 'Offer', 'Category', 'Brand', 'Subject', 'Product']
            
            for node_type in node_types:
                result = session.run(f"MATCH (n:{node_type}) RETURN count(n) as count")
                count = result.single()['count']
                counts[node_type] = count
                print(f"   {node_type}: {count} nœuds")
            
            # Compter les relations
            result = session.run("MATCH ()-[r]->() RETURN count(r) as count")
            rel_count = result.single()['count']
            counts['Relations'] = rel_count
            print(f"   Relations: {rel_count}")
            
            return counts

    def test_recommendations(self):
        """Test des recommandations"""
        print("🎯 Test des algorithmes de recommandation...")
        
        # Test recommandations trending
        try:
            response = requests.get(f"{self.graph_service_url}/recommendations/trending?limit=5")
            if response.status_code == 200:
                trending = response.json()
                print(f"✅ Trending: {len(trending)} recommandations")
            else:
                print(f"❌ Erreur trending: {response.status_code}")
        except Exception as e:
            print(f"❌ Erreur trending: {e}")
        
        # Test avec un utilisateur fictif
        user_id = 1
        endpoints = [
            f"/recommendations/category/{user_id}",
            f"/recommendations/collaborative/{user_id}",
            f"/recommendations/brand/{user_id}"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.graph_service_url}{endpoint}?limit=3")
                if response.status_code == 200:
                    recommendations = response.json()
                    print(f"✅ {endpoint.split('/')[-2]}: {len(recommendations)} recommandations")
                else:
                    print(f"❌ Erreur {endpoint}: {response.status_code}")
            except Exception as e:
                print(f"❌ Erreur {endpoint}: {e}")

    def test_interactions(self):
        """Test de l'enregistrement d'interactions"""
        print("📝 Test enregistrement d'interactions...")
        
        interactions = [
            {
                "userId": 1,
                "offerId": 1,
                "interactionType": "VIEW",
                "duration": 30
            },
            {
                "userId": 1,
                "offerId": 2,
                "interactionType": "LIKE"
            },
            {
                "userId": 1,
                "offerId": 3,
                "interactionType": "SEARCH",
                "keywords": "smartphone"
            }
        ]
        
        for interaction in interactions:
            try:
                response = requests.post(
                    f"{self.graph_service_url}/interactions",
                    json=interaction
                )
                if response.status_code == 200:
                    print(f"✅ Interaction {interaction['interactionType']} enregistrée")
                else:
                    print(f"❌ Erreur interaction: {response.status_code}")
            except Exception as e:
                print(f"❌ Erreur interaction: {e}")

    def test_analytics(self):
        """Test des analytics"""
        print("📈 Test des analytics...")
        
        endpoints = [
            "/analytics/exchange-patterns",
            "/analytics/popular-categories"
        ]
        
        for endpoint in endpoints:
            try:
                response = requests.get(f"{self.graph_service_url}{endpoint}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Analytics {endpoint}: données récupérées")
                else:
                    print(f"❌ Erreur analytics {endpoint}: {response.status_code}")
            except Exception as e:
                print(f"❌ Erreur analytics {endpoint}: {e}")

    def test_cypher_queries(self):
        """Test de quelques requêtes Cypher importantes"""
        print("🔍 Test requêtes Cypher...")
        
        queries = [
            # Test relations User -> Offer
            ("User-Offer relations", "MATCH (u:User)-[:SELLS]->(o:Offer) RETURN count(*) as count"),
            
            # Test relations Offer -> Category
            ("Offer-Category relations", "MATCH (o:Offer)-[:BELONGS_TO]->(c:Category) RETURN count(*) as count"),
            
            # Test hiérarchie catégories
            ("Category hierarchy", "MATCH (child:Category)-[:CHILD_OF]->(parent:Category) RETURN count(*) as count"),
            
            # Test chaînes de remplacement
            ("Replacement chains", "MATCH (o1:Offer)-[:REPLACED_BY]->(o2:Offer) RETURN count(*) as count")
        ]
        
        with self.driver.session() as session:
            for name, query in queries:
                try:
                    result = session.run(query)
                    count = result.single()['count']
                    print(f"✅ {name}: {count}")
                except Exception as e:
                    print(f"❌ Erreur {name}: {e}")

    def generate_test_report(self):
        """Génère un rapport de test complet"""
        print("\n" + "="*50)
        print("📋 RAPPORT DE TEST DE MIGRATION")
        print("="*50)
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Tests de base
        neo4j_ok = self.test_neo4j_connection()
        graph_service_ok = self.test_graph_service_connection()
        
        if not neo4j_ok or not graph_service_ok:
            print("\n❌ Tests de base échoués - Arrêt des tests")
            return
        
        print()
        
        # Tests de données
        data_counts = self.test_data_integrity()
        print()
        
        # Tests fonctionnels
        self.test_recommendations()
        print()
        
        self.test_interactions()
        print()
        
        self.test_analytics()
        print()
        
        self.test_cypher_queries()
        
        print("\n" + "="*50)
        print("✅ TESTS TERMINÉS")
        print("="*50)

    def close(self):
        """Ferme les connexions"""
        if self.driver:
            self.driver.close()

if __name__ == "__main__":
    tester = MigrationTester()
    try:
        tester.generate_test_report()
    finally:
        tester.close()
