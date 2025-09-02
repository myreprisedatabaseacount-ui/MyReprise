#!/usr/bin/env python3
"""
Service de synchronisation temps réel MySQL → Neo4j
Écoute les changements dans MySQL et met à jour Neo4j instantanément
"""

import asyncio
import mysql.connector
from neo4j import GraphDatabase
import logging
import json
from datetime import datetime
import os
import time
from typing import Dict, Any

# Configuration des logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sync_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class RealtimeSyncService:
    def __init__(self):
        # Configuration MySQL
        self.mysql_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 3306)),
            'user': os.getenv('DB_USERNAME', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_DATABASE', 'myreprise')
        }
        
        # Configuration Neo4j
        self.neo4j_uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        self.neo4j_user = os.getenv('NEO4J_USER', 'neo4j')
        self.neo4j_password = os.getenv('NEO4J_PASSWORD', 'neo4j123')
        
        self.neo4j_driver = None
        self.last_sync_time = {}
        
        # Tables à surveiller
        self.watched_tables = [
            'users', 'addresses', 'categories', 'brands', 'subjects',
            'products', 'offers', 'exchanges', 'orders'
        ]

    def connect_neo4j(self):
        """Connexion à Neo4j"""
        try:
            self.neo4j_driver = GraphDatabase.driver(
                self.neo4j_uri,
                auth=(self.neo4j_user, self.neo4j_password)
            )
            logger.info("✅ Connexion Neo4j établie")
        except Exception as e:
            logger.error(f"❌ Erreur connexion Neo4j: {e}")
            raise

    def get_table_changes(self, table_name: str) -> list:
        """Récupère les changements dans une table depuis la dernière sync"""
        last_sync = self.last_sync_time.get(table_name, '1970-01-01 00:00:00')
        
        conn = mysql.connector.connect(**self.mysql_config)
        cursor = conn.cursor(dictionary=True)
        
        try:
            cursor.execute(f"""
                SELECT * FROM {table_name} 
                WHERE updated_at > %s 
                ORDER BY updated_at ASC
            """, (last_sync,))
            
            changes = cursor.fetchall()
            
            if changes:
                # Mettre à jour le timestamp de dernière sync
                self.last_sync_time[table_name] = max(
                    change['updated_at'].strftime('%Y-%m-%d %H:%M:%S') 
                    for change in changes
                )
            
            return changes
            
        finally:
            cursor.close()
            conn.close()

    def sync_user_changes(self, changes: list):
        """Synchronise les changements d'utilisateurs"""
        with self.neo4j_driver.session() as session:
            for change in changes:
                session.run("""
                    MERGE (u:User {id: $id})
                    SET u.firstName = $first_name,
                        u.lastName = $last_name,
                        u.email = $email,
                        u.phone = $phone,
                        u.isVerified = $is_verified,
                        u.role = $role,
                        u.addressId = $address_id,
                        u.updatedAt = datetime($updated_at)
                """, **change)
                
                logger.info(f"👤 Utilisateur {change['id']} synchronisé")

    def sync_offer_changes(self, changes: list):
        """Synchronise les changements d'offres"""
        with self.neo4j_driver.session() as session:
            for change in changes:
                # Mettre à jour l'offre
                session.run("""
                    MERGE (o:Offer {id: $id})
                    SET o.productId = $product_id,
                        o.sellerId = $seller_id,
                        o.categoryId = $category_id,
                        o.brandId = $brand_id,
                        o.subjectId = $subject_id,
                        o.replacedByOffer = $replaced_by_offer,
                        o.productCondition = $product_condition,
                        o.price = $price,
                        o.title = $title,
                        o.description = $description,
                        o.status = $status,
                        o.isDeleted = $is_deleted,
                        o.updatedAt = datetime($updated_at)
                """, **change)
                
                # Recréer les relations si nécessaire
                if change.get('category_id'):
                    session.run("""
                        MATCH (o:Offer {id: $offer_id}), (c:Category {id: $category_id})
                        MERGE (o)-[:BELONGS_TO]->(c)
                    """, offer_id=change['id'], category_id=change['category_id'])
                
                if change.get('brand_id'):
                    session.run("""
                        MATCH (o:Offer {id: $offer_id}), (b:Brand {id: $brand_id})
                        MERGE (o)-[:IS_BRAND]->(b)
                    """, offer_id=change['id'], brand_id=change['brand_id'])
                
                logger.info(f"🛍️ Offre {change['id']} synchronisée")

    def sync_category_changes(self, changes: list):
        """Synchronise les changements de catégories"""
        with self.neo4j_driver.session() as session:
            for change in changes:
                session.run("""
                    MERGE (c:Category {id: $id})
                    SET c.parentId = $parent_id,
                        c.nameAr = $name_ar,
                        c.nameFr = $name_fr,
                        c.descriptionAr = $description_ar,
                        c.descriptionFr = $description_fr,
                        c.image = $image,
                        c.icon = $icon,
                        c.updatedAt = datetime($updated_at)
                """, **change)
                
                # Relation parent/enfant
                if change.get('parent_id'):
                    session.run("""
                        MATCH (child:Category {id: $child_id}), (parent:Category {id: $parent_id})
                        MERGE (child)-[:CHILD_OF]->(parent)
                    """, child_id=change['id'], parent_id=change['parent_id'])
                
                logger.info(f"📂 Catégorie {change['id']} synchronisée")

    def sync_brand_changes(self, changes: list):
        """Synchronise les changements de marques"""
        with self.neo4j_driver.session() as session:
            for change in changes:
                session.run("""
                    MERGE (b:Brand {id: $id})
                    SET b.logo = $logo,
                        b.nameAr = $name_ar,
                        b.nameFr = $name_fr,
                        b.descriptionAr = $description_ar,
                        b.descriptionFr = $description_fr,
                        b.categoryId = $category_id,
                        b.updatedAt = datetime($updated_at)
                """, **change)
                
                # Relation avec catégorie
                if change.get('category_id'):
                    session.run("""
                        MATCH (b:Brand {id: $brand_id}), (c:Category {id: $category_id})
                        MERGE (b)-[:CATEGORY_OF]->(c)
                    """, brand_id=change['id'], category_id=change['category_id'])
                
                logger.info(f"🏷️ Marque {change['id']} synchronisée")

    def sync_exchange_changes(self, changes: list):
        """Synchronise les changements d'échanges"""
        with self.neo4j_driver.session() as session:
            for change in changes:
                session.run("""
                    MERGE (e:Exchange {id: $id})
                    SET e.initiatorUserId = $initiator_user_id,
                        e.offeredOfferId = $offered_offer_id,
                        e.requestedOfferId = $requested_offer_id,
                        e.status = $status,
                        e.exchangeDate = datetime($exchange_date),
                        e.updatedAt = datetime($updated_at)
                """, **change)
                
                # Créer les relations d'échange
                session.run("""
                    MATCH (e:Exchange {id: $exchange_id}), 
                          (u:User {id: $user_id}), 
                          (offered:Offer {id: $offered_id}), 
                          (requested:Offer {id: $requested_id})
                    MERGE (u)-[:INITIATED]->(e)
                    MERGE (e)-[:OFFERS]->(offered)
                    MERGE (e)-[:REQUESTS]->(requested)
                """, 
                exchange_id=change['id'],
                user_id=change['initiator_user_id'],
                offered_id=change['offered_offer_id'],
                requested_id=change['requested_offer_id'])
                
                logger.info(f"🔄 Échange {change['id']} synchronisé")

    def track_user_interaction(self, user_id: int, offer_id: int, interaction_type: str, metadata: Dict[str, Any] = None):
        """Enregistre une interaction utilisateur en temps réel"""
        with self.neo4j_driver.session() as session:
            if interaction_type == 'VIEW':
                session.run("""
                    MATCH (u:User {id: $user_id}), (o:Offer {id: $offer_id})
                    MERGE (u)-[v:VIEWED]->(o)
                    SET v.timestamp = datetime(),
                        v.duration = $duration
                """, 
                user_id=user_id, 
                offer_id=offer_id,
                duration=metadata.get('duration', 0) if metadata else 0)
            
            elif interaction_type == 'LIKE':
                session.run("""
                    MATCH (u:User {id: $user_id}), (o:Offer {id: $offer_id})
                    MERGE (u)-[l:LIKED]->(o)
                    SET l.timestamp = datetime()
                """, user_id=user_id, offer_id=offer_id)
            
            elif interaction_type == 'SEARCH':
                session.run("""
                    MATCH (u:User {id: $user_id}), (o:Offer {id: $offer_id})
                    MERGE (u)-[s:SEARCHES]->(o)
                    SET s.timestamp = datetime(),
                        s.keywords = $keywords
                """, 
                user_id=user_id, 
                offer_id=offer_id,
                keywords=metadata.get('keywords', '') if metadata else '')
            
            logger.info(f"📊 Interaction {interaction_type} user:{user_id} → offer:{offer_id}")

    async def sync_loop(self):
        """Boucle principale de synchronisation"""
        logger.info("🚀 Démarrage du service de synchronisation temps réel")
        
        sync_handlers = {
            'users': self.sync_user_changes,
            'offers': self.sync_offer_changes,
            'categories': self.sync_category_changes,
            'brands': self.sync_brand_changes,
            'exchanges': self.sync_exchange_changes
        }
        
        while True:
            try:
                for table in self.watched_tables:
                    changes = self.get_table_changes(table)
                    
                    if changes:
                        logger.info(f"📝 {len(changes)} changements détectés dans {table}")
                        
                        if table in sync_handlers:
                            sync_handlers[table](changes)
                        else:
                            logger.info(f"⚠️ Pas de handler pour la table {table}")
                
                # Attendre avant la prochaine vérification
                await asyncio.sleep(5)  # Vérification toutes les 5 secondes
                
            except Exception as e:
                logger.error(f"❌ Erreur dans la boucle de sync: {e}")
                await asyncio.sleep(30)  # Attendre plus longtemps en cas d'erreur

    async def start_service(self):
        """Démarre le service de synchronisation"""
        try:
            self.connect_neo4j()
            await self.sync_loop()
        except KeyboardInterrupt:
            logger.info("🛑 Arrêt du service demandé")
        except Exception as e:
            logger.error(f"❌ Erreur fatale: {e}")
        finally:
            if self.neo4j_driver:
                self.neo4j_driver.close()
            logger.info("👋 Service arrêté")

class InteractionAPI:
    """API pour enregistrer les interactions utilisateur depuis l'application"""
    
    def __init__(self, sync_service: RealtimeSyncService):
        self.sync_service = sync_service
    
    def log_view(self, user_id: int, offer_id: int, duration: int = 0):
        """Enregistre qu'un utilisateur a consulté une offre"""
        self.sync_service.track_user_interaction(
            user_id, offer_id, 'VIEW', {'duration': duration}
        )
    
    def log_like(self, user_id: int, offer_id: int):
        """Enregistre qu'un utilisateur a aimé une offre"""
        self.sync_service.track_user_interaction(user_id, offer_id, 'LIKE')
    
    def log_search(self, user_id: int, offer_id: int, keywords: str):
        """Enregistre qu'un utilisateur a trouvé une offre via recherche"""
        self.sync_service.track_user_interaction(
            user_id, offer_id, 'SEARCH', {'keywords': keywords}
        )

if __name__ == "__main__":
    service = RealtimeSyncService()
    asyncio.run(service.start_service())
