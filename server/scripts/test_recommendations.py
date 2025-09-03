#!/usr/bin/env python3
"""
Script de test des recommandations basées sur le graphe Neo4j
"""

from neo4j import GraphDatabase

def test_recommendations():
    driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'neo4j123'))
    
    with driver.session() as session:
        print("🎯 Test des recommandations MyReprise")
        print("=" * 50)
        
        # 1. Recommandations basées sur les catégories préférées
        print("\n1️⃣ Recommandations par catégories préférées:")
        result = session.run("""
            MATCH (u:User)-[:PREFERS_CATEGORY]->(c:Category)<-[:BELONGS_TO]-(o:Offer)
            WHERE o.status = 'available'
            RETURN u.firstName, u.lastName, c.nameFr, o.title, o.price
            ORDER BY u.firstName, o.price
            LIMIT 10
        """)
        for record in result:
            print(f"  - {record['u.firstName']} {record['u.lastName']} → {record['c.nameFr']} → {record['o.title']} ({record['o.price']}€)")
        
        # 2. Recommandations basées sur les vues similaires
        print("\n2️⃣ Recommandations par vues similaires:")
        result = session.run("""
            MATCH (u1:User)-[:VIEWED]->(o1:Offer)<-[:VIEWED]-(u2:User)-[:VIEWED]->(o2:Offer)
            WHERE u1 <> u2 AND o1 <> o2 AND o2.status = 'available'
            RETURN u1.firstName, u1.lastName, o2.title, o2.price
            ORDER BY u1.firstName
            LIMIT 10
        """)
        for record in result:
            print(f"  - {record['u1.firstName']} {record['u1.lastName']} → {record['o2.title']} ({record['o2.price']}€)")
        
        # 3. Recommandations basées sur les marques
        print("\n3️⃣ Recommandations par marques:")
        result = session.run("""
            MATCH (u:User)-[:SELLS]->(o1:Offer)-[:IS_BRAND]->(b:Brand)<-[:IS_BRAND]-(o2:Offer)
            WHERE o1 <> o2 AND o2.status = 'available'
            RETURN u.firstName, u.lastName, b.nameFr, o2.title, o2.price
            ORDER BY u.firstName, o2.price
            LIMIT 10
        """)
        for record in result:
            print(f"  - {record['u.firstName']} {record['u.lastName']} → {record['b.nameFr']} → {record['o2.title']} ({record['o2.price']}€)")
        
        # 4. Statistiques des recommandations
        print("\n4️⃣ Statistiques des recommandations:")
        
        # Nombre d'utilisateurs avec préférences
        result = session.run("MATCH (u:User)-[:PREFERS_CATEGORY]->() RETURN count(DISTINCT u) as users_with_prefs")
        users_with_prefs = result.single()['users_with_prefs']
        print(f"  - Utilisateurs avec préférences: {users_with_prefs}")
        
        # Nombre d'offres disponibles
        result = session.run("MATCH (o:Offer) WHERE o.status = 'available' RETURN count(o) as available_offers")
        available_offers = result.single()['available_offers']
        print(f"  - Offres disponibles: {available_offers}")
        
        # Nombre de vues totales
        result = session.run("MATCH ()-[r:VIEWED]->() RETURN count(r) as total_views")
        total_views = result.single()['total_views']
        print(f"  - Vues totales: {total_views}")
        
        # 5. Test d'une recommandation personnalisée pour un utilisateur
        print("\n5️⃣ Recommandation personnalisée pour Ahmed Bennani:")
        result = session.run("""
            MATCH (u:User {firstName: 'Ahmed', lastName: 'Bennani'})
            OPTIONAL MATCH (u)-[:PREFERS_CATEGORY]->(c:Category)<-[:BELONGS_TO]-(o:Offer)
            WHERE o.status = 'available'
            OPTIONAL MATCH (u)-[:VIEWED]->(o1:Offer)<-[:VIEWED]-(u2:User)-[:VIEWED]->(o2:Offer)
            WHERE o2.status = 'available'
            RETURN DISTINCT o.title as title, o.price as price, 'category' as type
            ORDER BY o.price
            LIMIT 5
        """)
        for record in result:
            if record['title']:
                print(f"  - {record['title']} ({record['price']}€) - {record['type']}")
    
    driver.close()
    print("\n✅ Tests de recommandation terminés!")

if __name__ == "__main__":
    test_recommendations()
