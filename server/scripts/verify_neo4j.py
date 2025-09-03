#!/usr/bin/env python3
"""
Script de vérification des données migrées dans Neo4j
"""

from neo4j import GraphDatabase

def verify_migration():
    driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'neo4j123'))
    
    with driver.session() as session:
        print("📊 Nœuds par type:")
        result = session.run('MATCH (n) RETURN labels(n)[0] as label, count(n) as count ORDER BY count DESC')
        for record in result:
            print(f"  - {record['label']}: {record['count']}")
        
        print("\n🔗 Relations par type:")
        result = session.run('MATCH ()-[r]->() RETURN type(r) as rel_type, count(r) as count ORDER BY count DESC')
        for record in result:
            print(f"  - {record['rel_type']}: {record['count']}")
        
        print("\n👥 Exemple d'utilisateurs:")
        result = session.run('MATCH (u:User) RETURN u.firstName, u.lastName, u.email LIMIT 5')
        for record in result:
            print(f"  - {record['u.firstName']} {record['u.lastName']} ({record['u.email']})")
        
        print("\n🏪 Exemple de catégories:")
        result = session.run('MATCH (c:Category) RETURN c.nameFr, c.gender, c.ageMin, c.ageMax LIMIT 5')
        for record in result:
            print(f"  - {record['c.nameFr']} ({record['c.gender']}, {record['c.ageMin']}-{record['c.ageMax']} ans)")
        
        print("\n💰 Exemple d'offres:")
        result = session.run('MATCH (o:Offer) RETURN o.title, o.price, o.productCondition LIMIT 5')
        for record in result:
            print(f"  - {record['o.title']} - {record['o.price']}€ ({record['o.productCondition']})")
        
        print("\n🎯 Relations de recommandation:")
        result = session.run('MATCH (u:User)-[r:VIEWED]->(o:Offer) RETURN count(r) as views')
        views = result.single()['views']
        print(f"  - {views} vues simulées")
        
        result = session.run('MATCH (u:User)-[r:INTERESTED_IN]->(o:Offer) RETURN count(r) as interests')
        interests = result.single()['interests']
        print(f"  - {interests} intérêts simulés")
    
    driver.close()
    print("\n✅ Vérification terminée!")

if __name__ == "__main__":
    verify_migration()
