"""
Endpoints pour la récupération des préférences utilisateur depuis Neo4j
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from neo4j import GraphDatabase
import os
import logging

logger = logging.getLogger(__name__)

# Configuration Neo4j
NEO4J_URI = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
NEO4J_USER = os.getenv('NEO4J_USER', 'neo4j')
NEO4J_PASSWORD = os.getenv('NEO4J_PASSWORD', 'neo4j123')

def get_neo4j_driver():
    """Récupère le driver Neo4j"""
    return GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

# Modèles Pydantic
class UserPreferences(BaseModel):
    """Préférences utilisateur complètes"""
    user_id: int
    preferred_categories: List[Dict[str, Any]]
    preferred_brands: List[Dict[str, Any]]
    price_range: Dict[str, float]
    interaction_stats: Dict[str, Any]
    last_updated: str

class CategoryPreference(BaseModel):
    """Préférence de catégorie"""
    category_id: int
    category_name: str
    category_name_fr: str
    interaction_count: int
    preference_score: float
    last_interaction: str

class BrandPreference(BaseModel):
    """Préférence de marque"""
    brand_id: int
    brand_name: str
    brand_name_fr: str
    interaction_count: int
    preference_score: float
    last_interaction: str

class UserInteractionStats(BaseModel):
    """Statistiques d'interaction utilisateur"""
    total_views: int
    total_likes: int
    total_searches: int
    avg_session_duration: float
    most_active_hours: List[int]
    preferred_price_range: Dict[str, float]

# Router pour les préférences utilisateur
router = APIRouter(prefix="/user-preferences", tags=["User Preferences"])

@router.get("/{user_id}", response_model=UserPreferences)
async def get_user_preferences(user_id: int):
    """
    Récupère les préférences complètes d'un utilisateur depuis Neo4j
    
    Args:
        user_id: ID de l'utilisateur
        
    Returns:
        Préférences utilisateur complètes
    """
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            # Récupérer les catégories préférées
            categories_result = session.run("""
                MATCH (u:User {id: $userId})-[:LIKED|VIEWED]->(o:Offer)-[:BELONGS_TO]->(cat:Category)
                WITH cat, count(*) as interaction_count, 
                     max(CASE WHEN type(last(relationships(u))) = 'LIKED' THEN 1 ELSE 0 END) as likes_count,
                     max(CASE WHEN type(last(relationships(u))) = 'VIEWED' THEN 1 ELSE 0 END) as views_count
                WITH cat, interaction_count, likes_count, views_count,
                     (likes_count * 2 + views_count) as preference_score
                ORDER BY preference_score DESC
                RETURN cat.id as category_id, cat.name as category_name, cat.nameFr as category_name_fr,
                       interaction_count, preference_score,
                       datetime() as last_interaction
            """, userId=user_id)
            
            preferred_categories = []
            for record in categories_result:
                preferred_categories.append(CategoryPreference(
                    category_id=record["category_id"],
                    category_name=record["category_name"],
                    category_name_fr=record["category_name_fr"],
                    interaction_count=record["interaction_count"],
                    preference_score=float(record["preference_score"]),
                    last_interaction=record["last_interaction"]
                ).dict())
            
            # Récupérer les marques préférées
            brands_result = session.run("""
                MATCH (u:User {id: $userId})-[:LIKED|VIEWED]->(o:Offer)-[:IS_BRAND]->(brand:Brand)
                WITH brand, count(*) as interaction_count,
                     max(CASE WHEN type(last(relationships(u))) = 'LIKED' THEN 1 ELSE 0 END) as likes_count,
                     max(CASE WHEN type(last(relationships(u))) = 'VIEWED' THEN 1 ELSE 0 END) as views_count
                WITH brand, interaction_count, likes_count, views_count,
                     (likes_count * 2 + views_count) as preference_score
                ORDER BY preference_score DESC
                RETURN brand.id as brand_id, brand.name as brand_name, brand.nameFr as brand_name_fr,
                       interaction_count, preference_score,
                       datetime() as last_interaction
            """, userId=user_id)
            
            preferred_brands = []
            for record in brands_result:
                preferred_brands.append(BrandPreference(
                    brand_id=record["brand_id"],
                    brand_name=record["brand_name"],
                    brand_name_fr=record["brand_name_fr"],
                    interaction_count=record["interaction_count"],
                    preference_score=float(record["preference_score"]),
                    last_interaction=record["last_interaction"]
                ).dict())
            
            # Récupérer les statistiques d'interaction
            stats_result = session.run("""
                MATCH (u:User {id: $userId})-[r:VIEWED|LIKED|SEARCHED]->(o:Offer)
                WITH u, 
                     count(CASE WHEN type(r) = 'VIEWED' THEN 1 END) as total_views,
                     count(CASE WHEN type(r) = 'LIKED' THEN 1 END) as total_likes,
                     count(CASE WHEN type(r) = 'SEARCHED' THEN 1 END) as total_searches,
                     avg(r.duration) as avg_duration,
                     collect(DISTINCT o.price) as prices
                RETURN total_views, total_likes, total_searches, 
                       coalesce(avg_duration, 0) as avg_session_duration,
                       [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23] as most_active_hours,
                       {min: coalesce(min(prices), 0), max: coalesce(max(prices), 10000)} as price_range
            """, userId=user_id)
            
            stats_record = stats_result.single()
            if not stats_record:
                # Utilisateur non trouvé ou pas d'interactions
                return UserPreferences(
                    user_id=user_id,
                    preferred_categories=[],
                    preferred_brands=[],
                    price_range={"min": 0, "max": 10000},
                    interaction_stats={
                        "total_views": 0,
                        "total_likes": 0,
                        "total_searches": 0,
                        "avg_session_duration": 0.0,
                        "most_active_hours": [],
                        "preferred_price_range": {"min": 0, "max": 10000}
                    },
                    last_updated=datetime.now().isoformat()
                )
            
            interaction_stats = {
                "total_views": stats_record["total_views"],
                "total_likes": stats_record["total_likes"],
                "total_searches": stats_record["total_searches"],
                "avg_session_duration": float(stats_record["avg_session_duration"]),
                "most_active_hours": stats_record["most_active_hours"],
                "preferred_price_range": stats_record["price_range"]
            }
            
            return UserPreferences(
                user_id=user_id,
                preferred_categories=preferred_categories,
                preferred_brands=preferred_brands,
                price_range=stats_record["price_range"],
                interaction_stats=interaction_stats,
                last_updated=datetime.now().isoformat()
            )
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des préférences utilisateur {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des préférences: {str(e)}")
    finally:
        driver.close()

@router.get("/{user_id}/categories", response_model=List[CategoryPreference])
async def get_user_category_preferences(user_id: int, limit: int = 10):
    """
    Récupère les préférences de catégories d'un utilisateur
    
    Args:
        user_id: ID de l'utilisateur
        limit: Nombre maximum de catégories à retourner
        
    Returns:
        Liste des préférences de catégories
    """
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            result = session.run("""
                MATCH (u:User {id: $userId})-[:LIKED|VIEWED]->(o:Offer)-[:BELONGS_TO]->(cat:Category)
                WITH cat, count(*) as interaction_count,
                     max(CASE WHEN type(last(relationships(u))) = 'LIKED' THEN 1 ELSE 0 END) as likes_count,
                     max(CASE WHEN type(last(relationships(u))) = 'VIEWED' THEN 1 ELSE 0 END) as views_count
                WITH cat, interaction_count, likes_count, views_count,
                     (likes_count * 2 + views_count) as preference_score
                ORDER BY preference_score DESC
                LIMIT $limit
                RETURN cat.id as category_id, cat.name as category_name, cat.nameFr as category_name_fr,
                       interaction_count, preference_score,
                       datetime() as last_interaction
            """, userId=user_id, limit=limit)
            
            categories = []
            for record in result:
                categories.append(CategoryPreference(
                    category_id=record["category_id"],
                    category_name=record["category_name"],
                    category_name_fr=record["category_name_fr"],
                    interaction_count=record["interaction_count"],
                    preference_score=float(record["preference_score"]),
                    last_interaction=record["last_interaction"]
                ))
            
            return categories
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des catégories préférées: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des catégories: {str(e)}")
    finally:
        driver.close()

@router.get("/{user_id}/brands", response_model=List[BrandPreference])
async def get_user_brand_preferences(user_id: int, limit: int = 10):
    """
    Récupère les préférences de marques d'un utilisateur
    
    Args:
        user_id: ID de l'utilisateur
        limit: Nombre maximum de marques à retourner
        
    Returns:
        Liste des préférences de marques
    """
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            result = session.run("""
                MATCH (u:User {id: $userId})-[:LIKED|VIEWED]->(o:Offer)-[:IS_BRAND]->(brand:Brand)
                WITH brand, count(*) as interaction_count,
                     max(CASE WHEN type(last(relationships(u))) = 'LIKED' THEN 1 ELSE 0 END) as likes_count,
                     max(CASE WHEN type(last(relationships(u))) = 'VIEWED' THEN 1 ELSE 0 END) as views_count
                WITH brand, interaction_count, likes_count, views_count,
                     (likes_count * 2 + views_count) as preference_score
                ORDER BY preference_score DESC
                LIMIT $limit
                RETURN brand.id as brand_id, brand.name as brand_name, brand.nameFr as brand_name_fr,
                       interaction_count, preference_score,
                       datetime() as last_interaction
            """, userId=user_id, limit=limit)
            
            brands = []
            for record in result:
                brands.append(BrandPreference(
                    brand_id=record["brand_id"],
                    brand_name=record["brand_name"],
                    brand_name_fr=record["brand_name_fr"],
                    interaction_count=record["interaction_count"],
                    preference_score=float(record["preference_score"]),
                    last_interaction=record["last_interaction"]
                ))
            
            return brands
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des marques préférées: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des marques: {str(e)}")
    finally:
        driver.close()

@router.get("/{user_id}/price-range")
async def get_user_price_range(user_id: int):
    """
    Récupère la gamme de prix préférée d'un utilisateur
    
    Args:
        user_id: ID de l'utilisateur
        
    Returns:
        Gamme de prix préférée
    """
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            result = session.run("""
                MATCH (u:User {id: $userId})-[r:VIEWED|LIKED]->(o:Offer)
                WHERE o.price IS NOT NULL
                WITH collect(o.price) as prices
                RETURN {min: coalesce(min(prices), 0), max: coalesce(max(prices), 10000)} as price_range
            """, userId=user_id)
            
            record = result.single()
            if not record:
                return {"min": 0, "max": 10000}
            
            return record["price_range"]
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de la gamme de prix: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de la gamme de prix: {str(e)}")
    finally:
        driver.close()

@router.get("/{user_id}/interaction-stats", response_model=UserInteractionStats)
async def get_user_interaction_stats(user_id: int):
    """
    Récupère les statistiques d'interaction d'un utilisateur
    
    Args:
        user_id: ID de l'utilisateur
        
    Returns:
        Statistiques d'interaction
    """
    driver = get_neo4j_driver()
    
    try:
        with driver.session() as session:
            result = session.run("""
                MATCH (u:User {id: $userId})-[r:VIEWED|LIKED|SEARCHED]->(o:Offer)
                WITH u, 
                     count(CASE WHEN type(r) = 'VIEWED' THEN 1 END) as total_views,
                     count(CASE WHEN type(r) = 'LIKED' THEN 1 END) as total_likes,
                     count(CASE WHEN type(r) = 'SEARCHED' THEN 1 END) as total_searches,
                     avg(r.duration) as avg_duration,
                     collect(DISTINCT o.price) as prices
                RETURN total_views, total_likes, total_searches, 
                       coalesce(avg_duration, 0) as avg_session_duration,
                       [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23] as most_active_hours,
                       {min: coalesce(min(prices), 0), max: coalesce(max(prices), 10000)} as preferred_price_range
            """, userId=user_id)
            
            record = result.single()
            if not record:
                return UserInteractionStats(
                    total_views=0,
                    total_likes=0,
                    total_searches=0,
                    avg_session_duration=0.0,
                    most_active_hours=[],
                    preferred_price_range={"min": 0, "max": 10000}
                )
            
            return UserInteractionStats(
                total_views=record["total_views"],
                total_likes=record["total_likes"],
                total_searches=record["total_searches"],
                avg_session_duration=float(record["avg_session_duration"]),
                most_active_hours=record["most_active_hours"],
                preferred_price_range=record["preferred_price_range"]
            )
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des statistiques: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des statistiques: {str(e)}")
    finally:
        driver.close()
