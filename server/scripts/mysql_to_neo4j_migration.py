#!/usr/bin/env python3
"""
Script de migration MySQL vers Neo4j pour MyReprise
Migre les utilisateurs, produits, et relations d'échange
"""

import mysql.connector
from neo4j import GraphDatabase
import os
from datetime import datetime
import logging

# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MyRepriseMigration:
    def __init__(self):
        # Configuration MySQL
        self.mysql_config = {
            'host': os.getenv('DB_HOST', 'mysql'),
            'port': os.getenv('DB_PORT', 3306),
            'user': os.getenv('DB_USERNAME', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'myreprise')
        }
        
        # Configuration Neo4j
        self.neo4j_uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        self.neo4j_user = os.getenv('NEO4J_USER', 'neo4j')
        self.neo4j_password = os.getenv('NEO4J_PASSWORD', 'neo4j123')
        
        # Connexions
        self.mysql_conn = None
        self.neo4j_driver = None

    def connect(self):
        """Établir les connexions MySQL et Neo4j"""
        try:
            # Connexion MySQL
            self.mysql_conn = mysql.connector.connect(**self.mysql_config)
            logger.info("✅ Connexion MySQL établie")
            
            # Connexion Neo4j
            self.neo4j_driver = GraphDatabase.driver(
                self.neo4j_uri, 
                auth=(self.neo4j_user, self.neo4j_password)
            )
            logger.info("✅ Connexion Neo4j établie")
            
        except Exception as e:
            logger.error(f"❌ Erreur de connexion: {e}")
            raise

    def migrate_users(self):
        """Migrer les utilisateurs"""
        logger.info("🔄 Migration des utilisateurs...")
        
        # Requête MySQL
        mysql_cursor = self.mysql_conn.cursor(dictionary=True)
        mysql_cursor.execute("""
            SELECT id, name, email, phone, location, age, 
                   created_at, updated_at, is_active
            FROM users
        """)
        
        users = mysql_cursor.fetchall()
        logger.info(f"📊 {len(users)} utilisateurs trouvés")
        
        # Insertion dans Neo4j
        with self.neo4j_driver.session() as session:
            for user in users:
                session.run("""
                    CREATE (u:User {
                        id: $id,
                        name: $name,
                        email: $email,
                        phone: $phone,
                        location: $location,
                        age: $age,
                        created_at: datetime($created_at),
                        updated_at: datetime($updated_at),
                        is_active: $is_active
                    })
                """, **user)
        
        logger.info(f"✅ {len(users)} utilisateurs migrés")

    def migrate_products(self):
        """Migrer les produits"""
        logger.info("🔄 Migration des produits...")
        
        mysql_cursor = self.mysql_conn.cursor(dictionary=True)
        mysql_cursor.execute("""
            SELECT id, name, description, category, condition_state,
                   estimated_value, owner_id, created_at, is_available
            FROM products
        """)
        
        products = mysql_cursor.fetchall()
        logger.info(f"📊 {len(products)} produits trouvés")
        
        with self.neo4j_driver.session() as session:
            for product in products:
                # Créer le produit
                session.run("""
                    CREATE (p:Product {
                        id: $id,
                        name: $name,
                        description: $description,
                        category: $category,
                        condition: $condition_state,
                        estimated_value: $estimated_value,
                        created_at: datetime($created_at),
                        is_available: $is_available
                    })
                """, **product)
                
                # Créer la relation OWNS avec l'utilisateur
                session.run("""
                    MATCH (u:User {id: $owner_id})
                    MATCH (p:Product {id: $product_id})
                    CREATE (u)-[:OWNS {since: datetime($created_at)}]->(p)
                """, 
                owner_id=product['owner_id'],
                product_id=product['id'],
                created_at=product['created_at']
                )
        
        logger.info(f"✅ {len(products)} produits migrés")

    def migrate_exchanges(self):
        """Migrer les échanges et relations"""
        logger.info("🔄 Migration des échanges...")
        
        mysql_cursor = self.mysql_conn.cursor(dictionary=True)
        mysql_cursor.execute("""
            SELECT id, user1_id, user2_id, product1_id, product2_id,
                   status, created_at, completed_at
            FROM exchanges
        """)
        
        exchanges = mysql_cursor.fetchall()
        logger.info(f"📊 {len(exchanges)} échanges trouvés")
        
        with self.neo4j_driver.session() as session:
            for exchange in exchanges:
                # Créer la relation d'échange entre produits
                session.run("""
                    MATCH (p1:Product {id: $product1_id})
                    MATCH (p2:Product {id: $product2_id})
                    CREATE (p1)-[:EXCHANGED_WITH {
                        exchange_id: $exchange_id,
                        status: $status,
                        created_at: datetime($created_at),
                        completed_at: CASE WHEN $completed_at IS NOT NULL 
                                      THEN datetime($completed_at) 
                                      ELSE null END
                    }]->(p2)
                """, 
                product1_id=exchange['product1_id'],
                product2_id=exchange['product2_id'],
                exchange_id=exchange['id'],
                status=exchange['status'],
                created_at=exchange['created_at'],
                completed_at=exchange['completed_at']
                )
        
        logger.info(f"✅ {len(exchanges)} échanges migrés")

    def migrate_user_interests(self):
        """Migrer les intérêts des utilisateurs (likes, recherches)"""
        logger.info("🔄 Migration des intérêts utilisateurs...")
        
        # Migration des likes
        mysql_cursor = self.mysql_conn.cursor(dictionary=True)
        mysql_cursor.execute("""
            SELECT user_id, product_id, created_at
            FROM user_likes
        """)
        
        likes = mysql_cursor.fetchall()
        logger.info(f"📊 {len(likes)} likes trouvés")
        
        with self.neo4j_driver.session() as session:
            for like in likes:
                session.run("""
                    MATCH (u:User {id: $user_id})
                    MATCH (p:Product {id: $product_id})
                    CREATE (u)-[:LIKES {
                        timestamp: datetime($created_at),
                        score: 1.0
                    }]->(p)
                """, **like)
        
        # Migration des recherches
        mysql_cursor.execute("""
            SELECT user_id, search_term, category, created_at
            FROM user_searches
            GROUP BY user_id, search_term
        """)
        
        searches = mysql_cursor.fetchall()
        logger.info(f"📊 {len(searches)} recherches trouvées")
        
        with self.neo4j_driver.session() as session:
            for search in searches:
                session.run("""
                    MATCH (u:User {id: $user_id})
                    MERGE (s:SearchTerm {term: $search_term, category: $category})
                    CREATE (u)-[:SEARCHES {
                        frequency: 1,
                        last_search: datetime($created_at)
                    }]->(s)
                """, **search)
        
        logger.info(f"✅ Intérêts utilisateurs migrés")

    def create_categories(self):
        """Créer les nœuds de catégories"""
        logger.info("🔄 Création des catégories...")
        
        with self.neo4j_driver.session() as session:
            # Extraire les catégories uniques des produits
            result = session.run("""
                MATCH (p:Product)
                RETURN DISTINCT p.category AS category
                WHERE p.category IS NOT NULL
            """)
            
            categories = [record['category'] for record in result]
            
            # Créer les nœuds Category
            for category in categories:
                session.run("""
                    MERGE (c:Category {name: $category})
                """, category=category)
                
                # Lier les produits aux catégories
                session.run("""
                    MATCH (p:Product {category: $category})
                    MATCH (c:Category {name: $category})
                    CREATE (p)-[:BELONGS_TO]->(c)
                """, category=category)
        
        logger.info(f"✅ {len(categories)} catégories créées")

    def run_migration(self):
        """Exécuter la migration complète"""
        logger.info("🚀 Début de la migration MyReprise MySQL → Neo4j")
        
        try:
            self.connect()
            
            # Nettoyer Neo4j
            with self.neo4j_driver.session() as session:
                session.run("MATCH (n) DETACH DELETE n")
                logger.info("🧹 Neo4j nettoyé")
            
            # Migration par étapes
            self.migrate_users()
            self.migrate_products()
            self.migrate_exchanges()
            self.migrate_user_interests()
            self.create_categories()
            
            # Statistiques finales
            with self.neo4j_driver.session() as session:
                stats = session.run("""
                    MATCH (n) 
                    RETURN labels(n)[0] AS type, count(n) AS count
                    ORDER BY count DESC
                """)
                
                logger.info("📊 Statistiques de migration:")
                for record in stats:
                    logger.info(f"   {record['type']}: {record['count']}")
            
            logger.info("✅ Migration terminée avec succès!")
            
        except Exception as e:
            logger.error(f"❌ Erreur durant la migration: {e}")
            raise
        finally:
            if self.mysql_conn:
                self.mysql_conn.close()
            if self.neo4j_driver:
                self.neo4j_driver.close()

if __name__ == "__main__":
    migration = MyRepriseMigration()
    migration.run_migration()
