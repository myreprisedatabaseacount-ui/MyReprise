#!/usr/bin/env python3
"""
Service de synchronisation temps réel MySQL → Neo4j
Utilise les triggers MySQL ou polling pour maintenir la cohérence
"""

import asyncio
import mysql.connector
from neo4j import GraphDatabase
import json
import logging
from datetime import datetime

class SyncService:
    def __init__(self):
        self.mysql_config = {
            'host': 'mysql',
            'user': 'myreprise_user',
            'password': 'votre_mot_de_passe_securise',
            'database': 'myreprise'
        }
        
        self.neo4j_uri = 'bolt://localhost:7687'
        self.neo4j_auth = ('neo4j', 'neo4j123')
        
    async def sync_new_user(self, user_data):
        """Synchroniser un nouvel utilisateur"""
        driver = GraphDatabase.driver(self.neo4j_uri, auth=self.neo4j_auth)
        
        with driver.session() as session:
            session.run("""
                MERGE (u:User {id: $id})
                SET u.name = $name,
                    u.email = $email,
                    u.location = $location,
                    u.updated_at = datetime()
            """, **user_data)
        
        driver.close()
        logging.info(f"✅ Utilisateur {user_data['id']} synchronisé")

    async def sync_new_product(self, product_data):
        """Synchroniser un nouveau produit"""
        driver = GraphDatabase.driver(self.neo4j_uri, auth=self.neo4j_auth)
        
        with driver.session() as session:
            # Créer/mettre à jour le produit
            session.run("""
                MERGE (p:Product {id: $id})
                SET p.name = $name,
                    p.category = $category,
                    p.condition = $condition,
                    p.estimated_value = $estimated_value,
                    p.updated_at = datetime()
            """, **product_data)
            
            # Lier au propriétaire
            if 'owner_id' in product_data:
                session.run("""
                    MATCH (u:User {id: $owner_id})
                    MATCH (p:Product {id: $product_id})
                    MERGE (u)-[:OWNS]->(p)
                """, 
                owner_id=product_data['owner_id'],
                product_id=product_data['id']
                )
        
        driver.close()
        logging.info(f"✅ Produit {product_data['id']} synchronisé")

    async def sync_user_interaction(self, interaction_data):
        """Synchroniser une interaction utilisateur (like, recherche)"""
        driver = GraphDatabase.driver(self.neo4j_uri, auth=self.neo4j_auth)
        
        with driver.session() as session:
            if interaction_data['type'] == 'like':
                session.run("""
                    MATCH (u:User {id: $user_id})
                    MATCH (p:Product {id: $product_id})
                    MERGE (u)-[r:LIKES]->(p)
                    SET r.timestamp = datetime(),
                        r.score = 1.0
                """, **interaction_data)
            
            elif interaction_data['type'] == 'search':
                session.run("""
                    MATCH (u:User {id: $user_id})
                    MERGE (s:SearchTerm {term: $search_term})
                    MERGE (u)-[r:SEARCHES]->(s)
                    SET r.frequency = COALESCE(r.frequency, 0) + 1,
                        r.last_search = datetime()
                """, **interaction_data)
        
        driver.close()
        logging.info(f"✅ Interaction {interaction_data['type']} synchronisée")

# Intégration dans votre Node.js
async def webhook_handler(data):
    """Handler pour les webhooks depuis Node.js"""
    sync_service = SyncService()
    
    if data['type'] == 'user_created':
        await sync_service.sync_new_user(data['payload'])
    elif data['type'] == 'product_created':
        await sync_service.sync_new_product(data['payload'])
    elif data['type'] == 'user_interaction':
        await sync_service.sync_user_interaction(data['payload'])
