#!/usr/bin/env python3
"""
Script de test pour l'intégration Graph Service - AI Service
"""

import asyncio
import axios
import json
from datetime import datetime

# Configuration
GRAPH_SERVICE_URL = "http://localhost:8002"
AI_SERVICE_URL = "http://localhost:8001"

async def test_graph_service_health():
    """Test de santé du Graph Service"""
    print("🔍 Test de santé du Graph Service...")
    
    try:
        response = await axios.get(f"{GRAPH_SERVICE_URL}/health")
        if response.status == 200:
            print("✅ Graph Service est en bonne santé")
            return True
        else:
            print(f"❌ Graph Service en erreur: {response.status}")
            return False
    except Exception as e:
        print(f"❌ Erreur de connexion au Graph Service: {e}")
        return False

async def test_ai_service_health():
    """Test de santé du AI Service"""
    print("🔍 Test de santé du AI Service...")
    
    try:
        response = await axios.get(f"{AI_SERVICE_URL}/chatbot/health")
        if response.status == 200:
            print("✅ AI Service est en bonne santé")
            return True
        else:
            print(f"❌ AI Service en erreur: {response.status}")
            return False
    except Exception as e:
        print(f"❌ Erreur de connexion au AI Service: {e}")
        return False

async def test_user_preferences_endpoints():
    """Test des endpoints de préférences utilisateur"""
    print("\n🔍 Test des endpoints de préférences utilisateur...")
    
    test_user_id = 1
    
    try:
        # Test 1: Récupération des préférences depuis Graph Service
        print(f"📋 Test récupération préférences utilisateur {test_user_id} depuis Graph Service...")
        response = await axios.get(f"{GRAPH_SERVICE_URL}/user-preferences/{test_user_id}")
        
        if response.status == 200:
            preferences = response.data
            print("✅ Préférences récupérées depuis Graph Service")
            print(f"   - Catégories préférées: {len(preferences.get('preferred_categories', []))}")
            print(f"   - Marques préférées: {len(preferences.get('preferred_brands', []))}")
            print(f"   - Gamme de prix: {preferences.get('price_range', {})}")
        else:
            print(f"❌ Erreur récupération préférences: {response.status}")
            return False
            
        # Test 2: Récupération des préférences depuis AI Service (avec cache)
        print(f"📋 Test récupération préférences utilisateur {test_user_id} depuis AI Service...")
        response = await axios.get(f"{AI_SERVICE_URL}/chatbot/users/{test_user_id}/preferences")
        
        if response.status == 200:
            ai_preferences = response.data
            print("✅ Préférences récupérées depuis AI Service")
            print(f"   - Source: {ai_preferences.get('data', {}).get('preferred_categories', [])}")
        else:
            print(f"❌ Erreur récupération préférences AI Service: {response.status}")
            return False
        
        # Test 3: Récupération directe depuis Graph Service via AI Service
        print(f"📋 Test récupération directe depuis Graph Service via AI Service...")
        response = await axios.get(f"{AI_SERVICE_URL}/chatbot/users/{test_user_id}/preferences/from-graph")
        
        if response.status == 200:
            direct_preferences = response.data
            print("✅ Préférences récupérées directement depuis Graph Service")
            print(f"   - Source: {direct_preferences.get('source', 'unknown')}")
        else:
            print(f"❌ Erreur récupération directe: {response.status}")
            return False
        
        # Test 4: Refresh des préférences
        print(f"🔄 Test refresh des préférences utilisateur {test_user_id}...")
        response = await axios.get(f"{AI_SERVICE_URL}/chatbot/users/{test_user_id}/preferences/refresh")
        
        if response.status == 200:
            refresh_result = response.data
            print("✅ Préférences rafraîchies avec succès")
            print(f"   - Message: {refresh_result.get('message', '')}")
        else:
            print(f"❌ Erreur refresh: {response.status}")
            return False
            
        return True
            
    except Exception as e:
        print(f"❌ Erreur lors des tests: {e}")
        return False

async def test_chatbot_with_preferences():
    """Test du chatbot avec les préférences utilisateur"""
    print("\n🔍 Test du chatbot avec préférences utilisateur...")
    
    test_user_id = 1
    test_message = "Je cherche un iPhone pas cher"
    
    try:
        # Test de chat avec utilisateur
        print(f"💬 Test chat avec utilisateur {test_user_id}: '{test_message}'")
        
        chat_data = {
            "message": test_message,
            "user_id": test_user_id
        }
        
        response = await axios.post(f"{AI_SERVICE_URL}/chatbot/chat", chat_data)
        
        if response.status == 200:
            chat_response = response.data
            print("✅ Chat réussi")
            print(f"   - Réponse: {chat_response.get('data', {}).get('message', '')[:100]}...")
            print(f"   - Intent: {chat_response.get('data', {}).get('intent', 'unknown')}")
            print(f"   - Session ID: {chat_response.get('session_id', 'unknown')}")
        else:
            print(f"❌ Erreur chat: {response.status}")
            print(f"   - Détails: {response.data}")
            return False
            
        return True
            
    except Exception as e:
        print(f"❌ Erreur lors du test chat: {e}")
        return False

async def test_recommendations():
    """Test des recommandations depuis Graph Service"""
    print("\n🔍 Test des recommandations depuis Graph Service...")
    
    test_user_id = 1
    
    try:
        # Test recommandations par catégorie
        print(f"📊 Test recommandations par catégorie pour utilisateur {test_user_id}...")
        response = await axios.get(f"{GRAPH_SERVICE_URL}/recommendations/category/{test_user_id}")
        
        if response.status == 200:
            recommendations = response.data
            print(f"✅ {len(recommendations)} recommandations par catégorie trouvées")
            for i, rec in enumerate(recommendations[:3], 1):
                print(f"   {i}. {rec.get('title', 'N/A')} - {rec.get('price', 0)}€")
        else:
            print(f"❌ Erreur recommandations catégorie: {response.status}")
            return False
        
        # Test recommandations par marque
        print(f"📊 Test recommandations par marque pour utilisateur {test_user_id}...")
        response = await axios.get(f"{GRAPH_SERVICE_URL}/recommendations/brand/{test_user_id}")
        
        if response.status == 200:
            recommendations = response.data
            print(f"✅ {len(recommendations)} recommandations par marque trouvées")
            for i, rec in enumerate(recommendations[:3], 1):
                print(f"   {i}. {rec.get('title', 'N/A')} - {rec.get('price', 0)}€")
        else:
            print(f"❌ Erreur recommandations marque: {response.status}")
            return False
            
        return True
            
    except Exception as e:
        print(f"❌ Erreur lors des tests de recommandations: {e}")
        return False

async def main():
    """Fonction principale de test"""
    print("🚀 Démarrage des tests d'intégration Graph Service - AI Service")
    print("=" * 70)
    
    # Test 1: Santé des services
    graph_healthy = await test_graph_service_health()
    ai_healthy = await test_ai_service_health()
    
    if not graph_healthy or not ai_healthy:
        print("\n❌ Les services ne sont pas en bonne santé. Arrêt des tests.")
        return
    
    # Test 2: Endpoints de préférences
    preferences_ok = await test_user_preferences_endpoints()
    
    # Test 3: Chatbot avec préférences
    chat_ok = await test_chatbot_with_preferences()
    
    # Test 4: Recommandations
    recommendations_ok = await test_recommendations()
    
    # Résumé
    print("\n" + "=" * 70)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 70)
    print(f"✅ Graph Service: {'OK' if graph_healthy else '❌'}")
    print(f"✅ AI Service: {'OK' if ai_healthy else '❌'}")
    print(f"✅ Préférences utilisateur: {'OK' if preferences_ok else '❌'}")
    print(f"✅ Chatbot avec préférences: {'OK' if chat_ok else '❌'}")
    print(f"✅ Recommandations: {'OK' if recommendations_ok else '❌'}")
    
    if all([graph_healthy, ai_healthy, preferences_ok, chat_ok, recommendations_ok]):
        print("\n🎉 Tous les tests sont passés avec succès !")
        print("✅ L'intégration Graph Service - AI Service fonctionne correctement.")
    else:
        print("\n⚠️ Certains tests ont échoué. Vérifiez la configuration.")

if __name__ == "__main__":
    asyncio.run(main())
