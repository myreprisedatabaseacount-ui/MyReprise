#!/usr/bin/env python3
"""
Script de test simple pour vérifier l'intégration avec axios
"""

import asyncio
import axios
import json
from datetime import datetime

# Configuration
GRAPH_SERVICE_URL = "http://localhost:8002"
AI_SERVICE_URL = "http://localhost:8001"

async def test_axios_basic():
    """Test basique avec axios"""
    print("🔍 Test basique avec axios...")
    
    try:
        # Test 1: Graph Service health
        print("📊 Test Graph Service...")
        response = await axios.get(f"{GRAPH_SERVICE_URL}/health")
        print(f"   Status: {response.status}")
        print(f"   Data: {response.data}")
        
        # Test 2: AI Service health
        print("🤖 Test AI Service...")
        response = await axios.get(f"{AI_SERVICE_URL}/chatbot/health")
        print(f"   Status: {response.status}")
        print(f"   Data: {response.data}")
        
        # Test 3: Préférences utilisateur
        print("👤 Test préférences utilisateur...")
        response = await axios.get(f"{GRAPH_SERVICE_URL}/user-preferences/1")
        print(f"   Status: {response.status}")
        if response.status == 200:
            data = response.data
            print(f"   Catégories: {len(data.get('preferred_categories', []))}")
            print(f"   Marques: {len(data.get('preferred_brands', []))}")
            print(f"   Prix: {data.get('price_range', {})}")
        
        print("✅ Tous les tests axios sont passés !")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors des tests axios: {e}")
        return False

async def test_axios_chat():
    """Test de chat avec axios"""
    print("\n💬 Test de chat avec axios...")
    
    try:
        chat_data = {
            "message": "Bonjour, je cherche un téléphone",
            "user_id": 1
        }
        
        response = await axios.post(f"{AI_SERVICE_URL}/chatbot/chat", chat_data)
        print(f"   Status: {response.status}")
        
        if response.status == 200:
            data = response.data
            print(f"   Réponse: {data.get('data', {}).get('message', '')[:100]}...")
            print(f"   Intent: {data.get('data', {}).get('intent', 'unknown')}")
            print("✅ Chat avec axios réussi !")
            return True
        else:
            print(f"❌ Erreur chat: {response.status}")
            print(f"   Détails: {response.data}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test chat: {e}")
        return False

async def main():
    """Fonction principale"""
    print("🚀 Test d'intégration axios")
    print("=" * 50)
    
    # Test basique
    basic_ok = await test_axios_basic()
    
    # Test chat
    chat_ok = await test_axios_chat()
    
    # Résumé
    print("\n" + "=" * 50)
    print("📊 RÉSUMÉ")
    print("=" * 50)
    print(f"✅ Test basique: {'OK' if basic_ok else '❌'}")
    print(f"✅ Test chat: {'OK' if chat_ok else '❌'}")
    
    if basic_ok and chat_ok:
        print("\n🎉 Tous les tests axios sont passés !")
        print("✅ L'intégration fonctionne correctement avec axios.")
    else:
        print("\n⚠️ Certains tests ont échoué.")
        print("🔍 Vérifiez que les services sont démarrés.")

if __name__ == "__main__":
    asyncio.run(main())
