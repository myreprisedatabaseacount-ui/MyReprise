#!/usr/bin/env python3
"""
Service de recommandation Graph pour MyReprise
Utilise Neo4j pour fournir des recommandations personnalisées
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from neo4j import GraphDatabase
import os
import logging
from datetime import datetime

# Configuration des logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="MyReprise Graph Recommendation Service",
    description="Service de recommandation basé sur Neo4j pour MyReprise",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration Neo4j
NEO4J_URI = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
NEO4J_USER = os.getenv('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'neo4j123')

# Driver Neo4j global
driver = None

def get_neo4j_driver():
    """Récupère le driver Neo4j"""
    global driver
    if driver is None:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    return driver

# Modèles Pydantic
class OfferRecommendation(BaseModel):
    id: int
    title: str
    price: float
    relevanceScore: Optional[float] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    similarity: Optional[float] = None

class UserInteraction(BaseModel):
    userId: int
    offerId: int
    interactionType: str  # 'VIEW', 'LIKE', 'SEARCH'
    duration: Optional[int] = 0
    keywords: Optional[str] = None

class ExchangeChain(BaseModel):
    userId: int
    initialOffer: str
    initialPrice: float
    currentOffer: str
    currentPrice: float
    chainLength: int
    gain: float
    roiPercentage: float

class UserSyncData(BaseModel):
    action: str  # CREATE, UPDATE, DELETE
    userId: int
    userData: Dict[str, Any]
    timestamp: str

class CategorySyncData(BaseModel):
    action: str  # CREATE, UPDATE, DELETE
    categoryId: int
    categoryData: Dict[str, Any]
    timestamp: str

class OfferSyncData(BaseModel):
    action: str  # CREATE, UPDATE, DELETE
    offerId: int
    offerData: Dict[str, Any]
    timestamp: str

class OfferCategoryRelationSyncData(BaseModel):
    action: str  # CREATE, DELETE
    offerId: int
    categoryId: int
    timestamp: str

# Routes principales

@app.get("/")
async def root():
    """Point d'entrée de l'API"""
    return {
        "service": "MyReprise Graph Recommendation Service",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Vérification de la santé du service"""
    try:
        driver = get_neo4j_driver()
        with driver.session() as session:
            result = session.run("RETURN 'Neo4j connected' as status")
            record = result.single()
            return {"status": "healthy", "neo4j": record["status"]}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.get("/recommendations/category/{user_id}", response_model=List[OfferRecommendation])
async def get_category_recommendations(user_id: int, limit: int = 20):
    """Recommandations basées sur les catégories aimées par l'utilisateur"""
    driver = get_neo4j_driver()
    
    with driver.session() as session:
        result = session.run("""
            MATCH (u:User {id: $userId})-[:LIKED]->(liked:Offer)-[:BELONGS_TO]->(cat:Category)
            MATCH (cat)<-[:BELONGS_TO]-(similar:Offer)
            WHERE similar.status = 'available' 
              AND similar.sellerId <> u.id
              AND NOT (u)-[:VIEWED]->(similar)
            WITH similar, count(*) as relevanceScore, cat.nameFr as category
            ORDER BY relevanceScore DESC, similar.createdAt DESC
            LIMIT $limit
            RETURN similar.id as id, similar.title as title, similar.price as price, 
                   relevanceScore, category
        """, userId=user_id, limit=limit)
        
        recommendations = []
        for record in result:
            recommendations.append(OfferRecommendation(**dict(record)))
        
        return recommendations

@app.get("/recommendations/collaborative/{user_id}", response_model=List[OfferRecommendation])
async def get_collaborative_recommendations(user_id: int, limit: int = 15):
    """Recommandations collaborative filtering - utilisateurs similaires"""
    driver = get_neo4j_driver()
    
    with driver.session() as session:
        result = session.run("""
            MATCH (u:User {id: $userId})-[:LIKED]->(o:Offer)<-[:LIKED]-(similar:User)
            WHERE similar.id <> u.id
            WITH similar, count(o) as commonLikes
            ORDER BY commonLikes DESC
            LIMIT 10
            MATCH (similar)-[:LIKED]->(recommended:Offer)
            WHERE recommended.status = 'available' 
              AND recommended.sellerId <> u.id
              AND NOT (u)-[:LIKED]->(recommended)
              AND NOT (u)-[:VIEWED]->(recommended)
            RETURN DISTINCT recommended.id as id, recommended.title as title, 
                   recommended.price as price, commonLikes as relevanceScore
            ORDER BY commonLikes DESC
            LIMIT $limit
        """, userId=user_id, limit=limit)
        
        recommendations = []
        for record in result:
            recommendations.append(OfferRecommendation(**dict(record)))
        
        return recommendations

@app.get("/recommendations/trending", response_model=List[OfferRecommendation])
async def get_trending_recommendations(limit: int = 20):
    """Offres tendance - populaires récemment"""
    driver = get_neo4j_driver()
    
    with driver.session() as session:
        result = session.run("""
            MATCH (o:Offer)<-[interaction:VIEWED|LIKED]-(u:User)
            WHERE datetime() - interaction.timestamp < duration({days: 7})
              AND o.status = 'available'
            WITH o, count(interaction) as popularity
            ORDER BY popularity DESC
            LIMIT $limit
            RETURN o.id as id, o.title as title, o.price as price, 
                   popularity as relevanceScore
        """, limit=limit)
        
        recommendations = []
        for record in result:
            recommendations.append(OfferRecommendation(**dict(record)))
        
        return recommendations

@app.get("/recommendations/brand/{user_id}", response_model=List[OfferRecommendation])
async def get_brand_recommendations(user_id: int, limit: int = 15):
    """Recommandations par marque similaire"""
    driver = get_neo4j_driver()
    
    with driver.session() as session:
        result = session.run("""
            MATCH (u:User {id: $userId})-[:LIKED]->(liked:Offer)-[:IS_BRAND]->(brand:Brand)
            MATCH (brand)<-[:IS_BRAND]-(similar:Offer)
            WHERE similar.status = 'available' 
              AND similar.sellerId <> u.id
              AND NOT (u)-[:LIKED]->(similar)
            WITH similar, brand.nameFr as brandName
            ORDER BY similar.createdAt DESC
            RETURN similar.id as id, similar.title as title, similar.price as price, 
                   brandName as brand
            LIMIT $limit
        """, userId=user_id, limit=limit)
        
        recommendations = []
        for record in result:
            recommendations.append(OfferRecommendation(**dict(record)))
        
        return recommendations

@app.get("/recommendations/similar/{offer_id}", response_model=List[OfferRecommendation])
async def get_similar_offers(offer_id: int, limit: int = 8):
    """Offres similaires à une offre donnée"""
    driver = get_neo4j_driver()
    
    with driver.session() as session:
        result = session.run("""
            MATCH (viewed:Offer {id: $offerId})-[:BELONGS_TO]->(cat:Category)
            MATCH (viewed)-[:IS_BRAND]->(brand:Brand)
            MATCH (similar:Offer)-[:BELONGS_TO]->(cat)
            WHERE similar.status = 'available' 
              AND similar.id <> viewed.id
            OPTIONAL MATCH (similar)-[:IS_BRAND]->(brand)
            WITH similar, 
                 CASE WHEN (similar)-[:IS_BRAND]->(brand) THEN 2 ELSE 1 END as relevance,
                 viewed.price as originalPrice
            ORDER BY relevance DESC, abs(similar.price - originalPrice) ASC
            RETURN similar.id as id, similar.title as title, similar.price as price, 
                   relevance as relevanceScore
            LIMIT $limit
        """, offerId=offer_id, limit=limit)
        
        recommendations = []
        for record in result:
            recommendations.append(OfferRecommendation(**dict(record)))
        
        return recommendations

@app.post("/interactions")
async def log_interaction(interaction: UserInteraction):
    """Enregistre une interaction utilisateur"""
    driver = get_neo4j_driver()
    
    with driver.session() as session:
        if interaction.interactionType == 'VIEW':
            session.run("""
                MATCH (u:User {id: $userId}), (o:Offer {id: $offerId})
                MERGE (u)-[v:VIEWED]->(o)
                SET v.timestamp = datetime(),
                    v.duration = $duration
            """, 
            userId=interaction.userId, 
            offerId=interaction.offerId,
            duration=interaction.duration)
        
        elif interaction.interactionType == 'LIKE':
            session.run("""
                MATCH (u:User {id: $userId}), (o:Offer {id: $offerId})
                MERGE (u)-[l:LIKED]->(o)
                SET l.timestamp = datetime()
            """, userId=interaction.userId, offerId=interaction.offerId)
        
        elif interaction.interactionType == 'SEARCH':
            session.run("""
                MATCH (u:User {id: $userId}), (o:Offer {id: $offerId})
                MERGE (u)-[s:SEARCHES]->(o)
                SET s.timestamp = datetime(),
                    s.keywords = $keywords
            """, 
            userId=interaction.userId, 
            offerId=interaction.offerId,
            keywords=interaction.keywords or '')
        
        return {"status": "success", "message": "Interaction enregistrée"}

@app.get("/analytics/exchange-chain/{user_id}", response_model=List[ExchangeChain])
async def get_user_exchange_chain(user_id: int):
    """Analyse de la chaîne d'échange d'un utilisateur"""
    driver = get_neo4j_driver()
    
    with driver.session() as session:
        result = session.run("""
            MATCH path = (start:Offer {sellerId: $userId})-[:REPLACED_BY*]->(end:Offer)
            WHERE NOT (end)-[:REPLACED_BY]->()
            WITH path, start, end, length(path) as chainLength
            ORDER BY chainLength DESC
            RETURN start.title as initialOffer, 
                   start.price as initialPrice,
                   end.title as currentOffer, 
                   end.price as currentPrice,
                   chainLength,
                   (end.price - start.price) as gain,
                   ((end.price - start.price) / start.price * 100) as roiPercentage
        """, userId=user_id)
        
        chains = []
        for record in result:
            chain = ExchangeChain(
                userId=user_id,
                **dict(record)
            )
            chains.append(chain)
        
        return chains

@app.get("/analytics/exchange-patterns")
async def get_exchange_patterns(limit: int = 20):
    """Analyse des patterns d'échange entre catégories"""
    driver = get_neo4j_driver()
    
    with driver.session() as session:
        result = session.run("""
            MATCH (e:Exchange)-[:OFFERS]->(offered:Offer)-[:BELONGS_TO]->(catOffered:Category)
            MATCH (e)-[:REQUESTS]->(requested:Offer)-[:BELONGS_TO]->(catRequested:Category)
            WHERE e.status = 'completed'
            WITH catOffered.nameFr as offeredCategory, 
                 catRequested.nameFr as requestedCategory, 
                 count(*) as exchangeCount
            ORDER BY exchangeCount DESC
            RETURN offeredCategory, requestedCategory, exchangeCount
            LIMIT $limit
        """, limit=limit)
        
        patterns = []
        for record in result:
            patterns.append(dict(record))
        
        return {"patterns": patterns}

@app.get("/analytics/popular-categories")
async def get_popular_categories(limit: int = 10):
    """Catégories les plus consultées"""
    driver = get_neo4j_driver()
    
    with driver.session() as session:
        result = session.run("""
            MATCH (o:Offer)-[:BELONGS_TO]->(cat:Category)
            MATCH (o)<-[v:VIEWED]-(u:User)
            WITH cat, count(v) as views, count(DISTINCT o) as offerCount
            ORDER BY views DESC
            RETURN cat.nameFr as category, views, offerCount
            LIMIT $limit
        """, limit=limit)
        
        categories = []
        for record in result:
            categories.append(dict(record))
        
        return {"categories": categories}

@app.post("/sync/user")
async def sync_user(sync_data: UserSyncData):
    """Synchronise un utilisateur avec Neo4j"""
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            if sync_data.action == 'CREATE':
                # Créer un nouvel utilisateur dans Neo4j
                result = session.run("""
                    MERGE (u:User {id: $userId})
                    SET u.firstName = $firstName,
                        u.lastName = $lastName,
                        u.email = $email,
                        u.phone = $phone,
                        u.authProvider = $authProvider,
                        u.primaryIdentifier = $primaryIdentifier,
                        u.isVerified = $isVerified,
                        u.role = $role,
                        u.createdAt = datetime($createdAt),
                        u.updatedAt = datetime($updatedAt),
                        u.googleId = $googleId,
                        u.facebookId = $facebookId,
                        u.facebookEmail = $facebookEmail,
                        u.facebookPhone = $facebookPhone,
                        u.lastSync = datetime()
                    RETURN u.id as userId, u.lastSync as lastSync
                """, 
                userId=sync_data.userId,
                firstName=sync_data.userData.get('firstName'),
                lastName=sync_data.userData.get('lastName'),
                email=sync_data.userData.get('email'),
                phone=sync_data.userData.get('phone'),
                authProvider=sync_data.userData.get('authProvider'),
                primaryIdentifier=sync_data.userData.get('primaryIdentifier'),
                isVerified=sync_data.userData.get('isVerified', False),
                role=sync_data.userData.get('role', 'user'),
                createdAt=sync_data.userData.get('createdAt'),
                updatedAt=sync_data.userData.get('updatedAt'),
                googleId=sync_data.userData.get('googleId'),
                facebookId=sync_data.userData.get('facebookId'),
                facebookEmail=sync_data.userData.get('facebookEmail'),
                facebookPhone=sync_data.userData.get('facebookPhone'))
                
                record = result.single()
                logger.info(f"✅ Utilisateur {sync_data.userId} créé dans Neo4j")
                
                return {
                    "success": True,
                    "message": "Utilisateur synchronisé avec succès",
                    "userId": record["userId"],
                    "lastSync": record["lastSync"]
                }
                
            elif sync_data.action == 'UPDATE':
                # Mettre à jour un utilisateur existant
                result = session.run("""
                    MATCH (u:User {id: $userId})
                    SET u.firstName = $firstName,
                        u.lastName = $lastName,
                        u.email = $email,
                        u.phone = $phone,
                        u.isVerified = $isVerified,
                        u.role = $role,
                        u.updatedAt = datetime($updatedAt),
                        u.lastSync = datetime()
                    RETURN u.id as userId, u.lastSync as lastSync
                """, 
                userId=sync_data.userId,
                firstName=sync_data.userData.get('firstName'),
                lastName=sync_data.userData.get('lastName'),
                email=sync_data.userData.get('email'),
                phone=sync_data.userData.get('phone'),
                isVerified=sync_data.userData.get('isVerified', False),
                role=sync_data.userData.get('role', 'user'),
                updatedAt=sync_data.userData.get('updatedAt'))
                
                record = result.single()
                if record:
                    logger.info(f"✅ Utilisateur {sync_data.userId} mis à jour dans Neo4j")
                    return {
                        "success": True,
                        "message": "Utilisateur mis à jour avec succès",
                        "userId": record["userId"],
                        "lastSync": record["lastSync"]
                    }
                else:
                    raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
                    
            elif sync_data.action == 'DELETE':
                # Supprimer un utilisateur
                result = session.run("""
                    MATCH (u:User {id: $userId})
                    DETACH DELETE u
                    RETURN count(u) as deleted
                """, userId=sync_data.userId)
                
                record = result.single()
                if record["deleted"] > 0:
                    logger.info(f"✅ Utilisateur {sync_data.userId} supprimé de Neo4j")
                    return {
                        "success": True,
                        "message": "Utilisateur supprimé avec succès",
                        "userId": sync_data.userId
                    }
                else:
                    raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            
            else:
                raise HTTPException(status_code=400, detail="Action non supportée")
                
    except Exception as e:
        logger.error(f"❌ Erreur synchronisation utilisateur {sync_data.userId}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur synchronisation: {str(e)}")

@app.get("/users/{user_id}/status")
async def get_user_sync_status(user_id: int):
    """Vérifie le statut de synchronisation d'un utilisateur"""
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            result = session.run("""
                MATCH (u:User {id: $userId})
                RETURN u.id as userId, u.lastSync as lastSync, u.authProvider as authProvider
            """, userId=user_id)
            
            record = result.single()
            if record:
                return {
                    "exists": True,
                    "userId": record["userId"],
                    "lastSync": record["lastSync"],
                    "authProvider": record["authProvider"]
                }
            else:
                return {
                    "exists": False,
                    "userId": user_id
                }
                
    except Exception as e:
        logger.error(f"❌ Erreur vérification statut utilisateur {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur vérification: {str(e)}")

@app.post("/sync/category")
async def sync_category(sync_data: CategorySyncData):
    """Synchronise une catégorie avec Neo4j"""
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            if sync_data.action == 'CREATE':
                # Créer une nouvelle catégorie dans Neo4j
                result = session.run("""
                    MERGE (c:Category {id: $categoryId})
                    SET c.parentId = $parentId,
                        c.nameAr = $nameAr,
                        c.nameFr = $nameFr,
                        c.descriptionAr = $descriptionAr,
                        c.descriptionFr = $descriptionFr,
                        c.image = $image,
                        c.icon = $icon,
                        c.gender = $gender,
                        c.ageMin = $ageMin,
                        c.ageMax = $ageMax,
                        c.createdAt = datetime($createdAt),
                        c.updatedAt = datetime($updatedAt),
                        c.lastSync = datetime()
                    RETURN c.id as categoryId, c.lastSync as lastSync
                """, 
                categoryId=sync_data.categoryId,
                parentId=sync_data.categoryData.get('parentId'),
                nameAr=sync_data.categoryData.get('nameAr'),
                nameFr=sync_data.categoryData.get('nameFr'),
                descriptionAr=sync_data.categoryData.get('descriptionAr'),
                descriptionFr=sync_data.categoryData.get('descriptionFr'),
                image=sync_data.categoryData.get('image'),
                icon=sync_data.categoryData.get('icon'),
                gender=sync_data.categoryData.get('gender'),
                ageMin=sync_data.categoryData.get('ageMin'),
                ageMax=sync_data.categoryData.get('ageMax'),
                createdAt=sync_data.categoryData.get('createdAt'),
                updatedAt=sync_data.categoryData.get('updatedAt'))
                
                record = result.single()
                logger.info(f"✅ Catégorie {sync_data.categoryId} créée dans Neo4j")
                
                return {
                    "success": True,
                    "message": "Catégorie synchronisée avec succès",
                    "categoryId": record["categoryId"],
                    "lastSync": record["lastSync"]
                }
                
            elif sync_data.action == 'UPDATE':
                # Mettre à jour une catégorie existante
                result = session.run("""
                    MATCH (c:Category {id: $categoryId})
                    SET c.parentId = $parentId,
                        c.nameAr = $nameAr,
                        c.nameFr = $nameFr,
                        c.descriptionAr = $descriptionAr,
                        c.descriptionFr = $descriptionFr,
                        c.image = $image,
                        c.icon = $icon,
                        c.gender = $gender,
                        c.ageMin = $ageMin,
                        c.ageMax = $ageMax,
                        c.updatedAt = datetime($updatedAt),
                        c.lastSync = datetime()
                    RETURN c.id as categoryId, c.lastSync as lastSync
                """, 
                categoryId=sync_data.categoryId,
                parentId=sync_data.categoryData.get('parentId'),
                nameAr=sync_data.categoryData.get('nameAr'),
                nameFr=sync_data.categoryData.get('nameFr'),
                descriptionAr=sync_data.categoryData.get('descriptionAr'),
                descriptionFr=sync_data.categoryData.get('descriptionFr'),
                image=sync_data.categoryData.get('image'),
                icon=sync_data.categoryData.get('icon'),
                gender=sync_data.categoryData.get('gender'),
                ageMin=sync_data.categoryData.get('ageMin'),
                ageMax=sync_data.categoryData.get('ageMax'),
                updatedAt=sync_data.categoryData.get('updatedAt'))
                
                record = result.single()
                if record:
                    logger.info(f"✅ Catégorie {sync_data.categoryId} mise à jour dans Neo4j")
                    return {
                        "success": True,
                        "message": "Catégorie mise à jour avec succès",
                        "categoryId": record["categoryId"],
                        "lastSync": record["lastSync"]
                    }
                else:
                    raise HTTPException(status_code=404, detail="Catégorie non trouvée")
                    
            elif sync_data.action == 'DELETE':
                # Supprimer une catégorie
                result = session.run("""
                    MATCH (c:Category {id: $categoryId})
                    DETACH DELETE c
                    RETURN count(c) as deleted
                """, categoryId=sync_data.categoryId)
                
                record = result.single()
                if record["deleted"] > 0:
                    logger.info(f"✅ Catégorie {sync_data.categoryId} supprimée de Neo4j")
                    return {
                        "success": True,
                        "message": "Catégorie supprimée avec succès",
                        "categoryId": sync_data.categoryId
                    }
                else:
                    raise HTTPException(status_code=404, detail="Catégorie non trouvée")
            
            else:
                raise HTTPException(status_code=400, detail="Action non supportée")
                
    except Exception as e:
        logger.error(f"❌ Erreur synchronisation catégorie {sync_data.categoryId}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur synchronisation: {str(e)}")

@app.get("/categories/{category_id}/status")
async def get_category_sync_status(category_id: int):
    """Vérifie le statut de synchronisation d'une catégorie"""
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            result = session.run("""
                MATCH (c:Category {id: $categoryId})
                RETURN c.id as categoryId, c.lastSync as lastSync, c.nameFr as nameFr
            """, categoryId=category_id)
            
            record = result.single()
            if record:
                return {
                    "exists": True,
                    "categoryId": record["categoryId"],
                    "lastSync": record["lastSync"],
                    "nameFr": record["nameFr"]
                }
            else:
                return {
                    "exists": False,
                    "categoryId": category_id
                }
                
    except Exception as e:
        logger.error(f"❌ Erreur vérification statut catégorie {category_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur vérification: {str(e)}")

@app.post("/sync/offer")
async def sync_offer(sync_data: OfferSyncData):
    """Synchronise une offre avec Neo4j"""
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            if sync_data.action == 'CREATE':
                # Créer une nouvelle offre dans Neo4j
                result = session.run("""
                    MERGE (o:Offer {id: $offerId})
                    SET o.title = $title,
                        o.description = $description,
                        o.price = $price,
                        o.status = $status,
                        o.productCondition = $productCondition,
                        o.listingType = $listingType,
                        o.sellerId = $sellerId,
                        o.categoryId = $categoryId,
                        o.brandId = $brandId,
                        o.subjectId = $subjectId,
                        o.addressId = $addressId,
                        o.images = $images,
                        o.specificData = $specificData,
                        o.isDeleted = $isDeleted,
                        o.createdAt = datetime($createdAt),
                        o.updatedAt = datetime($updatedAt),
                        o.lastSync = datetime()
                    RETURN o.id as offerId, o.lastSync as lastSync
                """, 
                offerId=sync_data.offerId,
                title=sync_data.offerData.get('title'),
                description=sync_data.offerData.get('description'),
                price=sync_data.offerData.get('price'),
                status=sync_data.offerData.get('status'),
                productCondition=sync_data.offerData.get('productCondition'),
                listingType=sync_data.offerData.get('listingType'),
                sellerId=sync_data.offerData.get('sellerId'),
                categoryId=sync_data.offerData.get('categoryId'),
                brandId=sync_data.offerData.get('brandId'),
                subjectId=sync_data.offerData.get('subjectId'),
                addressId=sync_data.offerData.get('addressId'),
                images=sync_data.offerData.get('images'),
                specificData=sync_data.offerData.get('specificData'),
                isDeleted=sync_data.offerData.get('isDeleted', False),
                createdAt=sync_data.offerData.get('createdAt'),
                updatedAt=sync_data.offerData.get('updatedAt'))
                
                record = result.single()
                logger.info(f"✅ Offre {sync_data.offerId} créée dans Neo4j")
                
                return {
                    "success": True,
                    "message": "Offre synchronisée avec succès",
                    "offerId": record["offerId"],
                    "lastSync": record["lastSync"]
                }
                
            elif sync_data.action == 'UPDATE':
                # Mettre à jour une offre existante
                result = session.run("""
                    MATCH (o:Offer {id: $offerId})
                    SET o.title = $title,
                        o.description = $description,
                        o.price = $price,
                        o.status = $status,
                        o.productCondition = $productCondition,
                        o.listingType = $listingType,
                        o.sellerId = $sellerId,
                        o.categoryId = $categoryId,
                        o.brandId = $brandId,
                        o.subjectId = $subjectId,
                        o.addressId = $addressId,
                        o.images = $images,
                        o.specificData = $specificData,
                        o.isDeleted = $isDeleted,
                        o.updatedAt = datetime($updatedAt),
                        o.lastSync = datetime()
                    RETURN o.id as offerId, o.lastSync as lastSync
                """, 
                offerId=sync_data.offerId,
                title=sync_data.offerData.get('title'),
                description=sync_data.offerData.get('description'),
                price=sync_data.offerData.get('price'),
                status=sync_data.offerData.get('status'),
                productCondition=sync_data.offerData.get('productCondition'),
                listingType=sync_data.offerData.get('listingType'),
                sellerId=sync_data.offerData.get('sellerId'),
                categoryId=sync_data.offerData.get('categoryId'),
                brandId=sync_data.offerData.get('brandId'),
                subjectId=sync_data.offerData.get('subjectId'),
                addressId=sync_data.offerData.get('addressId'),
                images=sync_data.offerData.get('images'),
                specificData=sync_data.offerData.get('specificData'),
                isDeleted=sync_data.offerData.get('isDeleted', False),
                updatedAt=sync_data.offerData.get('updatedAt'))
                
                record = result.single()
                if record:
                    logger.info(f"✅ Offre {sync_data.offerId} mise à jour dans Neo4j")
                    return {
                        "success": True,
                        "message": "Offre mise à jour avec succès",
                        "offerId": record["offerId"],
                        "lastSync": record["lastSync"]
                    }
                else:
                    raise HTTPException(status_code=404, detail="Offre non trouvée")
                    
            elif sync_data.action == 'DELETE':
                # Supprimer une offre (soft delete)
                result = session.run("""
                    MATCH (o:Offer {id: $offerId})
                    SET o.isDeleted = true,
                        o.updatedAt = datetime($updatedAt),
                        o.lastSync = datetime()
                    RETURN o.id as offerId
                """, 
                offerId=sync_data.offerId,
                updatedAt=sync_data.offerData.get('updatedAt'))
                
                record = result.single()
                if record:
                    logger.info(f"✅ Offre {sync_data.offerId} supprimée de Neo4j")
                    return {
                        "success": True,
                        "message": "Offre supprimée avec succès",
                        "offerId": record["offerId"]
                    }
                else:
                    raise HTTPException(status_code=404, detail="Offre non trouvée")
            
            else:
                raise HTTPException(status_code=400, detail="Action non supportée")
                
    except Exception as e:
        logger.error(f"❌ Erreur synchronisation offre {sync_data.offerId}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur synchronisation: {str(e)}")

@app.post("/sync/offer-category-relation")
async def sync_offer_category_relation(sync_data: OfferCategoryRelationSyncData):
    """Synchronise une relation offre-catégorie avec Neo4j"""
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            if sync_data.action == 'CREATE':
                # Créer la relation MATCHED_WITH entre l'offre et la catégorie
                result = session.run("""
                    MATCH (o:Offer {id: $offerId})
                    MATCH (c:Category {id: $categoryId})
                    MERGE (o)-[r:MATCHED_WITH]->(c)
                    SET r.createdAt = datetime($timestamp),
                        r.lastSync = datetime()
                    RETURN o.id as offerId, c.id as categoryId, r.createdAt as createdAt
                """, 
                offerId=sync_data.offerId,
                categoryId=sync_data.categoryId,
                timestamp=sync_data.timestamp)
                
                record = result.single()
                if record:
                    logger.info(f"✅ Relation offre-catégorie {sync_data.offerId}-{sync_data.categoryId} créée dans Neo4j")
                    
                    return {
                        "success": True,
                        "message": "Relation offre-catégorie synchronisée avec succès",
                        "offerId": record["offerId"],
                        "categoryId": record["categoryId"],
                        "createdAt": record["createdAt"]
                    }
                else:
                    raise HTTPException(status_code=404, detail="Offre ou catégorie non trouvée")
                    
            elif sync_data.action == 'DELETE':
                # Supprimer la relation MATCHED_WITH
                result = session.run("""
                    MATCH (o:Offer {id: $offerId})-[r:MATCHED_WITH]->(c:Category {id: $categoryId})
                    DELETE r
                    RETURN o.id as offerId, c.id as categoryId
                """, 
                offerId=sync_data.offerId,
                categoryId=sync_data.categoryId)
                
                record = result.single()
                if record:
                    logger.info(f"✅ Relation offre-catégorie {sync_data.offerId}-{sync_data.categoryId} supprimée de Neo4j")
                    
                    return {
                        "success": True,
                        "message": "Relation offre-catégorie supprimée avec succès",
                        "offerId": record["offerId"],
                        "categoryId": record["categoryId"]
                    }
                else:
                    logger.warning(f"⚠️ Relation offre-catégorie {sync_data.offerId}-{sync_data.categoryId} non trouvée")
                    return {
                        "success": True,
                        "message": "Relation non trouvée (déjà supprimée)",
                        "offerId": sync_data.offerId,
                        "categoryId": sync_data.categoryId
                    }
            else:
                raise HTTPException(status_code=400, detail="Action non supportée")
                
    except Exception as e:
        logger.error(f"❌ Erreur synchronisation relation offre-catégorie: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur synchronisation: {str(e)}")

@app.get("/recommendations/exchange/{offer_id}")
async def get_exchange_recommendations(offer_id: int, limit: int = 10):
    """Récupère les recommandations d'échange pour une offre donnée"""
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            # Requête pour trouver les offres qui peuvent être échangées
            # Basée sur les relations MATCHED_WITH
            result = session.run("""
                MATCH (sourceOffer:Offer {id: $offerId})-[:MATCHED_WITH]->(category:Category)
                MATCH (targetOffer:Offer)-[:MATCHED_WITH]->(category)
                WHERE targetOffer.id <> $offerId
                AND targetOffer.status = 'available'
                WITH targetOffer, category, count(category) as commonCategories
                ORDER BY commonCategories DESC, targetOffer.createdAt DESC
                LIMIT $limit
                RETURN targetOffer.id as offerId,
                       targetOffer.title as title,
                       targetOffer.description as description,
                       targetOffer.price as price,
                       targetOffer.images as images,
                       targetOffer.listingType as listingType,
                       targetOffer.productCondition as productCondition,
                       targetOffer.sellerId as sellerId,
                       collect(DISTINCT category.nameFr) as matchingCategories,
                       commonCategories
            """, offerId=offer_id, limit=limit)
            
            recommendations = []
            for record in result:
                recommendations.append({
                    "offerId": record["offerId"],
                    "title": record["title"],
                    "description": record["description"],
                    "price": record["price"],
                    "images": record["images"],
                    "listingType": record["listingType"],
                    "productCondition": record["productCondition"],
                    "sellerId": record["sellerId"],
                    "matchingCategories": record["matchingCategories"],
                    "commonCategoriesCount": record["commonCategories"],
                    "matchScore": min(record["commonCategories"] / 3.0, 1.0)  # Score de 0 à 1
                })
            
            logger.info(f"✅ {len(recommendations)} recommandations trouvées pour l'offre {offer_id}")
            
            return {
                "success": True,
                "data": recommendations,
                "total": len(recommendations),
                "message": f"Recommandations d'échange pour l'offre {offer_id}"
            }
            
    except Exception as e:
        logger.error(f"❌ Erreur récupération recommandations pour offre {offer_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur recommandations: {str(e)}")

@app.get("/recommendations/user/{user_id}")
async def get_user_exchange_recommendations(user_id: int, limit: int = 20):
    """Récupère toutes les recommandations d'échange pour un utilisateur"""
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            # Trouver toutes les offres de l'utilisateur et leurs recommandations
            result = session.run("""
                MATCH (userOffer:Offer {sellerId: $userId})-[:MATCHED_WITH]->(category:Category)
                MATCH (targetOffer:Offer)-[:MATCHED_WITH]->(category)
                WHERE targetOffer.sellerId <> $userId
                AND targetOffer.status = 'available'
                WITH userOffer, targetOffer, category, count(category) as commonCategories
                ORDER BY userOffer.id, commonCategories DESC
                WITH userOffer, collect({
                    offerId: targetOffer.id,
                    title: targetOffer.title,
                    description: targetOffer.description,
                    price: targetOffer.price,
                    images: targetOffer.images,
                    listingType: targetOffer.listingType,
                    productCondition: targetOffer.productCondition,
                    sellerId: targetOffer.sellerId,
                    matchingCategories: collect(DISTINCT category.nameFr),
                    commonCategoriesCount: commonCategories
                })[0..5] as recommendations
                RETURN userOffer.id as userOfferId,
                       userOffer.title as userOfferTitle,
                       userOffer.price as userOfferPrice,
                       recommendations
            """, userId=user_id, limit=limit)
            
            user_recommendations = {}
            for record in result:
                user_recommendations[record["userOfferId"]] = {
                    "userOffer": {
                        "id": record["userOfferId"],
                        "title": record["userOfferTitle"],
                        "price": record["userOfferPrice"]
                    },
                    "recommendations": [
                        {
                            **rec,
                            "matchScore": min(rec["commonCategoriesCount"] / 3.0, 1.0)
                        } for rec in record["recommendations"]
                    ]
                }
            
            logger.info(f"✅ Recommandations récupérées pour l'utilisateur {user_id}")
            
            return {
                "success": True,
                "data": user_recommendations,
                "totalOffers": len(user_recommendations),
                "message": f"Recommandations d'échange pour l'utilisateur {user_id}"
            }
            
    except Exception as e:
        logger.error(f"❌ Erreur récupération recommandations utilisateur {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur recommandations: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialisation du service"""
    logger.info("🚀 Démarrage du service de recommandation MyReprise")
    
    # Test de connexion Neo4j
    try:
        driver = get_neo4j_driver()
        with driver.session() as session:
            result = session.run("RETURN 'connected' as status")
            record = result.single()
            logger.info(f"✅ Neo4j connecté: {record['status']}")
    except Exception as e:
        logger.error(f"❌ Erreur connexion Neo4j: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Nettoyage à l'arrêt du service"""
    global driver
    if driver:
        driver.close()
    logger.info("👋 Service de recommandation arrêté")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
