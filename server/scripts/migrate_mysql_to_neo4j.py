#!/usr/bin/env python3
"""
Script de migration MySQL vers Neo4j pour MyReprise
Migre toutes les données relationnelles vers un graphe Neo4j
"""

import mysql.connector
from neo4j import GraphDatabase
import logging
import json
from datetime import datetime
import os
from typing import Dict, List, Any

# Configuration des logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MyRepriseMigrator:
    def __init__(self):
        # Configuration MySQL
        self.mysql_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 3306)),
            'user': os.getenv('DB_USERNAME', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_DATABASE', 'myreprise_new')
        }
        
        # Configuration Neo4j
        self.neo4j_uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        self.neo4j_user = os.getenv('NEO4J_USER', 'neo4j')
        self.neo4j_password = os.getenv('NEO4J_PASSWORD', 'neo4j123')
        
        self.mysql_conn = None
        self.neo4j_driver = None
        
        # Compteurs pour le rapport
        self.stats = {
            'users': 0,
            'addresses': 0,
            'stores': 0,
            'categories': 0,
            'brands': 0,
            'subjects': 0,
            'subject_categories': 0,
            'products': 0,
            'offers': 0,
            'offer_images': 0,
            'orders': 0,
            'user_snapshots': 0,
            'product_snapshots': 0,
            'delivery_companies': 0,
            'delivery_infos': 0,
            'relationships': 0
        }

    def connect_databases(self):
        """Connexion aux bases de données"""
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

    def clear_neo4j(self):
        """Vider la base Neo4j (optionnel)"""
        with self.neo4j_driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
            logger.info("🗑️ Base Neo4j vidée")

    def create_constraints(self):
        """Créer les contraintes et index Neo4j"""
        constraints = [
            "CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
            "CREATE CONSTRAINT address_id IF NOT EXISTS FOR (a:Address) REQUIRE a.id IS UNIQUE",
            "CREATE CONSTRAINT store_id IF NOT EXISTS FOR (s:Store) REQUIRE s.id IS UNIQUE",
            "CREATE CONSTRAINT category_id IF NOT EXISTS FOR (c:Category) REQUIRE c.id IS UNIQUE",
            "CREATE CONSTRAINT brand_id IF NOT EXISTS FOR (b:Brand) REQUIRE b.id IS UNIQUE",
            "CREATE CONSTRAINT subject_id IF NOT EXISTS FOR (sub:Subject) REQUIRE sub.id IS UNIQUE",
            "CREATE CONSTRAINT product_id IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT offer_id IF NOT EXISTS FOR (o:Offer) REQUIRE o.id IS UNIQUE",
            "CREATE CONSTRAINT offer_image_id IF NOT EXISTS FOR (oi:OfferImage) REQUIRE oi.id IS UNIQUE",
            "CREATE CONSTRAINT order_id IF NOT EXISTS FOR (ord:Order) REQUIRE ord.id IS UNIQUE",
            "CREATE CONSTRAINT user_snapshot_id IF NOT EXISTS FOR (us:UserSnapshot) REQUIRE us.id IS UNIQUE",
            "CREATE CONSTRAINT product_snapshot_id IF NOT EXISTS FOR (ps:ProductSnapshot) REQUIRE ps.id IS UNIQUE",
            "CREATE CONSTRAINT delivery_company_id IF NOT EXISTS FOR (dc:DeliveryCompany) REQUIRE dc.id IS UNIQUE",
            "CREATE CONSTRAINT delivery_info_id IF NOT EXISTS FOR (di:DeliveryInfo) REQUIRE di.id IS UNIQUE"
        ]
        
        with self.neo4j_driver.session() as session:
            for constraint in constraints:
                try:
                    session.run(constraint)
                    logger.info(f"✅ Contrainte créée: {constraint.split('FOR')[1].split('REQUIRE')[0].strip()}")
                except Exception as e:
                    logger.warning(f"⚠️ Contrainte déjà existante ou erreur: {e}")

    def migrate_users(self):
        """Migrer les utilisateurs"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.*, a.city, a.sector, a.address_name 
            FROM users u 
            LEFT JOIN addresses a ON u.address_id = a.id
        """)
        
        users = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for user in users:
                session.run("""
                    CREATE (u:User {
                        id: $id,
                        firstName: $first_name,
                        lastName: $last_name,
                        email: $email,
                        phone: $phone,
                        isVerified: $is_verified,
                        role: $role,
                        addressId: $address_id,
                        city: $city,
                        sector: $sector,
                        addressName: $address_name,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **user)
                
                self.stats['users'] += 1
        
        logger.info(f"✅ {self.stats['users']} utilisateurs migrés")

    def migrate_addresses(self):
        """Migrer les adresses"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM addresses")
        addresses = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for address in addresses:
                session.run("""
                    CREATE (a:Address {
                        id: $id,
                        city: $city,
                        sector: $sector,
                        addressName: $address_name,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **address)
                
                self.stats['addresses'] += 1
        
        logger.info(f"✅ {self.stats['addresses']} adresses migrées")

    def migrate_categories(self):
        """Migrer les catégories avec support multilingue et nouveaux champs"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM categories")
        categories = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for category in categories:
                session.run("""
                    CREATE (c:Category {
                        id: $id,
                        parentId: $parent_id,
                        nameAr: $name_ar,
                        nameFr: $name_fr,
                        descriptionAr: $description_ar,
                        descriptionFr: $description_fr,
                        image: $image,
                        icon: $icon,
                        gender: $gender,
                        ageMin: $age_min,
                        ageMax: $age_max,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **category)
                
                self.stats['categories'] += 1
        
        logger.info(f"✅ {self.stats['categories']} catégories migrées")

    def migrate_brands(self):
        """Migrer les marques avec support multilingue"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM brands")
        brands = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for brand in brands:
                session.run("""
                    CREATE (b:Brand {
                        id: $id,
                        logo: $logo,
                        nameAr: $name_ar,
                        nameFr: $name_fr,
                        descriptionAr: $description_ar,
                        descriptionFr: $description_fr,
                        categoryId: $category_id,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **brand)
                
                self.stats['brands'] += 1
        
        logger.info(f"✅ {self.stats['brands']} marques migrées")

    def migrate_subjects(self):
        """Migrer les matières avec support multilingue"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM subjects")
        subjects = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for subject in subjects:
                session.run("""
                    CREATE (s:Subject {
                        id: $id,
                        nameAr: $name_ar,
                        nameFr: $name_fr,
                        descriptionAr: $description_ar,
                        descriptionFr: $description_fr,
                        image: $image,
                        icon: $icon,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **subject)
                
                self.stats['subjects'] += 1
        
        logger.info(f"✅ {self.stats['subjects']} matières migrées")

    def migrate_products(self):
        """Migrer les produits"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for product in products:
                session.run("""
                    CREATE (p:Product {
                        id: $id,
                        createdBy: $created_by,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **product)
                
                self.stats['products'] += 1
        
        logger.info(f"✅ {self.stats['products']} produits migrés")

    def migrate_offers(self):
        """Migrer les offres avec tous les champs"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM offers")
        offers = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for offer in offers:
                # Convertir les valeurs décimales en float
                offer_data = dict(offer)
                if offer_data.get('price') is not None:
                    offer_data['price'] = float(offer_data['price'])
                
                session.run("""
                    CREATE (o:Offer {
                        id: $id,
                        productId: $product_id,
                        sellerId: $seller_id,
                        categoryId: $category_id,
                        brandId: $brand_id,
                        subjectId: $subject_id,
                        replacedByOffer: $replaced_by_offer,
                        productCondition: $product_condition,
                        price: $price,
                        title: $title,
                        description: $description,
                        status: $status,
                        isDeleted: $is_deleted,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **offer_data)
                
                self.stats['offers'] += 1
        
        logger.info(f"✅ {self.stats['offers']} offres migrées")

    def migrate_stores(self):
        """Migrer les magasins"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM stores")
        stores = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for store in stores:
                session.run("""
                    CREATE (s:Store {
                        id: $id,
                        userId: $user_id,
                        name: $name,
                        description: $description,
                        isActive: $is_active,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **store)
                
                self.stats['stores'] += 1
        
        logger.info(f"✅ {self.stats['stores']} magasins migrés")

    def migrate_orders(self):
        """Migrer les commandes avec la vraie structure complète"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM orders")
        orders = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for order in orders:
                # Convertir les valeurs décimales en float
                order_data = dict(order)
                if order_data.get('total_amount') is not None:
                    order_data['total_amount'] = float(order_data['total_amount'])
                if order_data.get('balance_amount') is not None:
                    order_data['balance_amount'] = float(order_data['balance_amount'])
                
                session.run("""
                    CREATE (o:Order {
                        id: $id,
                        orderNumber: $order_number,
                        status: $status,
                        totalAmount: $total_amount,
                        notes: $notes,
                        exchangeDate: $exchange_date,
                        balanceAmount: $balance_amount,
                        balancePayerId: $balance_payer_id,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **order_data)
                
                self.stats['orders'] += 1
        
        logger.info(f"✅ {self.stats['orders']} commandes migrées")

    def migrate_user_snapshots(self):
        """Migrer les snapshots utilisateurs"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM user_snapshots")
        snapshots = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for snapshot in snapshots:
                session.run("""
                    CREATE (us:UserSnapshot {
                        id: $id,
                        orderId: $order_id,
                        name: $name,
                        email: $email,
                        phone: $phone,
                        isSender: $is_sender,
                        addressId: $address_id,
                        userId: $user_id,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **snapshot)
                
                self.stats['user_snapshots'] += 1
        
        logger.info(f"✅ {self.stats['user_snapshots']} snapshots utilisateurs migrés")

    def migrate_product_snapshots(self):
        """Migrer les snapshots produits"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM product_snapshots")
        snapshots = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for snapshot in snapshots:
                # Convertir les valeurs décimales en float
                snapshot_data = dict(snapshot)
                if snapshot_data.get('price') is not None:
                    snapshot_data['price'] = float(snapshot_data['price'])
                
                session.run("""
                    CREATE (ps:ProductSnapshot {
                        id: $id,
                        title: $title,
                        price: $price,
                        description: $description,
                        productCondition: $product_condition,
                        replacedByProductId: $replaced_by_product_id,
                        isFromProduct: $is_from_product,
                        offerId: $offer_id,
                        orderId: $order_id,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **snapshot_data)
                
                self.stats['product_snapshots'] += 1
        
        logger.info(f"✅ {self.stats['product_snapshots']} snapshots produits migrés")

    def migrate_subject_categories(self):
        """Migrer les relations matières-catégories"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM subject_categories")
        subject_categories = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for sc in subject_categories:
                session.run("""
                    CREATE (sc:SubjectCategory {
                        id: $id,
                        subjectId: $subject_id,
                        categoryId: $category_id,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **sc)
                
                self.stats['subject_categories'] += 1
        
        logger.info(f"✅ {self.stats['subject_categories']} relations matières-catégories migrées")

    def migrate_offer_images(self):
        """Migrer les images d'offres"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM offer_images")
        offer_images = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for oi in offer_images:
                session.run("""
                    CREATE (oi:OfferImage {
                        id: $id,
                        color: $color,
                        colorHex: $color_hex,
                        isMain: $is_main,
                        imageUrl: $image_url,
                        offerId: $offer_id,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **oi)
                
                self.stats['offer_images'] += 1
        
        logger.info(f"✅ {self.stats['offer_images']} images d'offres migrées")

    def migrate_delivery_companies(self):
        """Migrer les entreprises de livraison"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM delivery_companies")
        delivery_companies = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for dc in delivery_companies:
                session.run("""
                    CREATE (dc:DeliveryCompany {
                        id: $id,
                        name: $name,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **dc)
                
                self.stats['delivery_companies'] += 1
        
        logger.info(f"✅ {self.stats['delivery_companies']} entreprises de livraison migrées")

    def migrate_delivery_infos(self):
        """Migrer les informations de livraison"""
        cursor = self.mysql_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM delivery_infos")
        delivery_infos = cursor.fetchall()
        
        with self.neo4j_driver.session() as session:
            for di in delivery_infos:
                session.run("""
                    CREATE (di:DeliveryInfo {
                        id: $id,
                        orderId: $order_id,
                        companyId: $company_id,
                        deliveryStatus: $delivery_status,
                        deliveryComment: $delivery_comment,
                        deliveryType: $delivery_type,
                        isFragile: $is_fragile,
                        orderNumber: $order_number,
                        packageCount: $package_count,
                        packageHeight: $package_height,
                        packageLength: $package_length,
                        packageWidth: $package_width,
                        rangeWeight: $range_weight,
                        status: $status,
                        subject: $subject,
                        totalPrice: $total_price,
                        totalAmount: $total_amount,
                        totalWeight: $total_weight,
                        createdAt: datetime($created_at),
                        updatedAt: datetime($updated_at)
                    })
                """, **di)
                
                self.stats['delivery_infos'] += 1
        
        logger.info(f"✅ {self.stats['delivery_infos']} informations de livraison migrées")

    def create_relationships(self):
        """Créer toutes les relations entre les nœuds"""
        with self.neo4j_driver.session() as session:
            relationships = [
                # User -> Address
                """
                MATCH (u:User), (a:Address)
                WHERE u.addressId = a.id
                CREATE (u)-[:LIVES_AT]->(a)
                """,
                
                # User -> Product (création)
                """
                MATCH (u:User), (p:Product)
                WHERE p.createdBy = u.id
                CREATE (u)-[:CREATED]->(p)
                """,
                
                # Product -> Offer
                """
                MATCH (p:Product), (o:Offer)
                WHERE o.productId = p.id
                CREATE (p)-[:HAS_OFFER]->(o)
                """,
                
                # User -> Offer (vendeur)
                """
                MATCH (u:User), (o:Offer)
                WHERE o.sellerId = u.id
                CREATE (u)-[:SELLS]->(o)
                """,
                
                # Offer -> Category
                """
                MATCH (o:Offer), (c:Category)
                WHERE o.categoryId = c.id
                CREATE (o)-[:BELONGS_TO]->(c)
                """,
                
                # Offer -> Brand
                """
                MATCH (o:Offer), (b:Brand)
                WHERE o.brandId = b.id
                CREATE (o)-[:IS_BRAND]->(b)
                """,
                
                # Offer -> Subject
                """
                MATCH (o:Offer), (s:Subject)
                WHERE o.subjectId = s.id
                CREATE (o)-[:IS_SUBJECT]->(s)
                """,
                
                # Brand -> Category
                """
                MATCH (b:Brand), (c:Category)
                WHERE b.categoryId = c.id
                CREATE (b)-[:CATEGORY_OF]->(c)
                """,
                
                # Category -> Category (parent/enfant)
                """
                MATCH (child:Category), (parent:Category)
                WHERE child.parentId = parent.id
                CREATE (child)-[:CHILD_OF]->(parent)
                """,
                
                # User -> Store
                """
                MATCH (u:User), (s:Store)
                WHERE s.userId = u.id
                CREATE (u)-[:OWNS_STORE]->(s)
                """,
                
                # Order -> User (balance payer)
                """
                MATCH (o:Order), (u:User)
                WHERE o.balancePayerId = u.id
                CREATE (o)-[:BALANCE_PAID_BY]->(u)
                """,
                
                # Order -> UserSnapshot
                """
                MATCH (o:Order), (us:UserSnapshot)
                WHERE us.orderId = o.id
                CREATE (o)-[:HAS_USER_SNAPSHOT]->(us)
                """,
                
                # Order -> ProductSnapshot
                """
                MATCH (o:Order), (ps:ProductSnapshot)
                WHERE ps.orderId = o.id
                CREATE (o)-[:HAS_PRODUCT_SNAPSHOT]->(ps)
                """,
                
                # UserSnapshot -> User
                """
                MATCH (us:UserSnapshot), (u:User)
                WHERE us.userId = u.id
                CREATE (us)-[:SNAPSHOT_OF]->(u)
                """,
                
                # ProductSnapshot -> Offer
                """
                MATCH (ps:ProductSnapshot), (o:Offer)
                WHERE ps.offerId = o.id
                CREATE (ps)-[:SNAPSHOT_OF]->(o)
                """,
                
                # ProductSnapshot self-reference
                """
                MATCH (old:ProductSnapshot), (new:ProductSnapshot)
                WHERE old.replacedByProductId = new.id
                CREATE (old)-[:REPLACED_BY]->(new)
                """,
                
                # Offer replacement chain
                """
                MATCH (old:Offer), (new:Offer)
                WHERE old.replacedByOffer = new.id
                CREATE (old)-[:REPLACED_BY]->(new)
                """,
                
                # Offer -> OfferImage
                """
                MATCH (o:Offer), (oi:OfferImage)
                WHERE oi.offerId = o.id
                CREATE (o)-[:HAS_IMAGE]->(oi)
                """,
                
                # Subject -> Category (via SubjectCategory)
                """
                MATCH (s:Subject), (sc:SubjectCategory), (c:Category)
                WHERE sc.subjectId = s.id AND sc.categoryId = c.id
                CREATE (s)-[:RELATED_TO]->(c)
                """,
                
                # Order -> DeliveryInfo
                """
                MATCH (o:Order), (di:DeliveryInfo)
                WHERE di.orderId = o.id
                CREATE (o)-[:HAS_DELIVERY]->(di)
                """,
                
                # DeliveryInfo -> DeliveryCompany
                """
                MATCH (di:DeliveryInfo), (dc:DeliveryCompany)
                WHERE di.companyId = dc.id
                CREATE (di)-[:DELIVERED_BY]->(dc)
                """
            ]
            
            for rel_query in relationships:
                result = session.run(rel_query)
                count = result.consume().counters.relationships_created
                self.stats['relationships'] += count
                logger.info(f"✅ {count} relations créées")
        
        logger.info(f"🔗 Total: {self.stats['relationships']} relations créées")

    def create_recommendation_data(self):
        """Créer des données spécifiques pour les recommandations"""
        with self.neo4j_driver.session() as session:
            # Simuler des interactions utilisateur pour les recommandations basées sur les vraies données
            session.run("""
                MATCH (u:User), (o:Offer)
                WHERE u.id <> o.sellerId AND o.status = 'available'
                WITH u, o, rand() as r
                WHERE r < 0.1
                CREATE (u)-[:VIEWED {timestamp: datetime(), duration: toInteger(rand() * 300)}]->(o)
            """)
            
            session.run("""
                MATCH (u:User), (o:Offer)
                WHERE u.id <> o.sellerId AND o.status = 'available'
                WITH u, o, rand() as r
                WHERE r < 0.05
                CREATE (u)-[:INTERESTED_IN {timestamp: datetime()}]->(o)
            """)
            
            session.run("""
                MATCH (u:User), (c:Category)
                WITH u, c, rand() as r
                WHERE r < 0.2
                CREATE (u)-[:PREFERS_CATEGORY {strength: rand()}]->(c)
            """)
            
            # Créer des relations basées sur les échanges réels via les snapshots
            session.run("""
                MATCH (o:Order)-[:HAS_USER_SNAPSHOT]->(us1:UserSnapshot {isSender: true}),
                      (o)-[:HAS_USER_SNAPSHOT]->(us2:UserSnapshot {isSender: false}),
                      (us1)-[:SNAPSHOT_OF]->(u1:User),
                      (us2)-[:SNAPSHOT_OF]->(u2:User)
                CREATE (u1)-[:EXCHANGED_WITH {orderId: o.id, timestamp: o.createdAt}]->(u2)
            """)
            
            logger.info("🎯 Données de recommandation créées")

    def run_migration(self, clear_neo4j_first=False):
        """Exécuter la migration complète"""
        start_time = datetime.now()
        logger.info("🚀 Début de la migration MySQL → Neo4j")
        
        try:
            self.connect_databases()
            
            if clear_neo4j_first:
                self.clear_neo4j()
            
            self.create_constraints()
            
            # Migration des données
            self.migrate_addresses()
            self.migrate_users()
            self.migrate_stores()
            self.migrate_categories()
            self.migrate_brands()
            self.migrate_subjects()
            self.migrate_subject_categories()
            self.migrate_products()
            self.migrate_offers()
            self.migrate_offer_images()
            self.migrate_orders()
            self.migrate_user_snapshots()
            self.migrate_product_snapshots()
            self.migrate_delivery_companies()
            self.migrate_delivery_infos()
            
            # Création des relations
            self.create_relationships()
            
            # Données de recommandation
            self.create_recommendation_data()
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            logger.info("✅ Migration terminée avec succès!")
            logger.info(f"⏱️ Durée: {duration}")
            logger.info("📊 Statistiques:")
            for key, value in self.stats.items():
                logger.info(f"   {key}: {value}")
            
        except Exception as e:
            logger.error(f"❌ Erreur durant la migration: {e}")
            raise
        finally:
            if self.mysql_conn:
                self.mysql_conn.close()
            if self.neo4j_driver:
                self.neo4j_driver.close()

if __name__ == "__main__":
    migrator = MyRepriseMigrator()
    migrator.run_migration(clear_neo4j_first=True)

