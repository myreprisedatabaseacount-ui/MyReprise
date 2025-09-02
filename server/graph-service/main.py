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
