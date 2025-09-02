-- ===================================
-- REQUÊTES CYPHER POUR MYREPRISE
-- Algorithmes de recommandation et analyse
-- ===================================

-- ==========================================
-- 1. ALGORITHMES DE RECOMMANDATION
-- ==========================================

-- 1.1 Recommandations basées sur les catégories similaires
-- Trouve des offres dans les mêmes catégories que celles aimées par l'utilisateur
MATCH (u:User {id: $userId})-[:LIKED]->(liked:Offer)-[:BELONGS_TO]->(cat:Category)
MATCH (cat)<-[:BELONGS_TO]-(similar:Offer)
WHERE similar.status = 'available' 
  AND similar.sellerId <> u.id
  AND NOT (u)-[:VIEWED]->(similar)
WITH similar, count(*) as relevanceScore
ORDER BY relevanceScore DESC, similar.createdAt DESC
LIMIT 20
RETURN similar.id, similar.title, similar.price, relevanceScore;

-- 1.2 Collaborative Filtering - Utilisateurs similaires
-- Trouve des utilisateurs ayant des goûts similaires
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
RETURN DISTINCT recommended.id, recommended.title, recommended.price, commonLikes
ORDER BY commonLikes DESC
LIMIT 15;

-- 1.3 Trending Products - Offres populaires récentes
-- Identifie les offres qui ont beaucoup d'interactions récemment
MATCH (o:Offer)<-[interaction:VIEWED|LIKED]-(u:User)
WHERE datetime() - interaction.timestamp < duration({days: 7})
  AND o.status = 'available'
WITH o, count(interaction) as popularity, 
     collect(DISTINCT type(interaction)) as interactionTypes
ORDER BY popularity DESC
LIMIT 20
RETURN o.id, o.title, o.price, popularity, interactionTypes;

-- 1.4 Recommandations par marque
-- Propose des offres de marques similaires à celles aimées
MATCH (u:User {id: $userId})-[:LIKED]->(liked:Offer)-[:IS_BRAND]->(brand:Brand)
MATCH (brand)<-[:IS_BRAND]-(similar:Offer)
WHERE similar.status = 'available' 
  AND similar.sellerId <> u.id
  AND NOT (u)-[:LIKED]->(similar)
WITH similar, brand.nameFr as brandName
ORDER BY similar.createdAt DESC
RETURN similar.id, similar.title, similar.price, brandName
LIMIT 15;

-- ==========================================
-- 2. ANALYSE DES CHAÎNES D'ÉCHANGE
-- ==========================================

-- 2.1 Chaîne d'échange d'un utilisateur (investissement)
-- Retrace la chaîne complète d'échanges d'un utilisateur
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
       ((end.price - start.price) / start.price * 100) as roiPercentage;

-- 2.2 Analyse des patterns d'échange
-- Identifie les catégories d'offres qui s'échangent le plus souvent
MATCH (e:Exchange)-[:OFFERS]->(offered:Offer)-[:BELONGS_TO]->(catOffered:Category)
MATCH (e)-[:REQUESTS]->(requested:Offer)-[:BELONGS_TO]->(catRequested:Category)
WHERE e.status = 'completed'
WITH catOffered.nameFr as offeredCategory, 
     catRequested.nameFr as requestedCategory, 
     count(*) as exchangeCount
ORDER BY exchangeCount DESC
RETURN offeredCategory, requestedCategory, exchangeCount
LIMIT 20;

-- ==========================================
-- 3. DÉTECTION DE COMMUNAUTÉS
-- ==========================================

-- 3.1 Groupes d'utilisateurs par préférences de catégories
-- Utilise l'algorithme Louvain pour détecter les communautés
CALL gds.louvain.stream('userCategoryGraph')
YIELD nodeId, communityId
MATCH (u:User) WHERE id(u) = nodeId
RETURN communityId, collect(u.email) as users
ORDER BY communityId;

-- 3.2 Catégories fortement liées
-- Trouve les catégories qui sont souvent consultées ensemble
MATCH (u:User)-[:VIEWED]->(o1:Offer)-[:BELONGS_TO]->(cat1:Category)
MATCH (u)-[:VIEWED]->(o2:Offer)-[:BELONGS_TO]->(cat2:Category)
WHERE cat1.id < cat2.id
WITH cat1, cat2, count(DISTINCT u) as coViewers
WHERE coViewers > 2
RETURN cat1.nameFr, cat2.nameFr, coViewers
ORDER BY coViewers DESC;

-- ==========================================
-- 4. GRAPH EMBEDDINGS (Node2Vec)
-- ==========================================

-- 4.1 Calcul des embeddings pour les offres
-- Génère des vecteurs pour chaque offre basés sur la structure du graphe
CALL gds.node2vec.stream('offerGraph', {
    embeddingDimension: 128,
    walkLength: 10,
    walksPerNode: 3
})
YIELD nodeId, embedding
MATCH (o:Offer) WHERE id(o) = nodeId
RETURN o.id, o.title, embedding;

-- 4.2 Similarité entre offres via embeddings
-- Compare les offres basées sur leurs embeddings
MATCH (o1:Offer {id: $offerId})
CALL gds.similarity.cosine.stream('offerGraph', {
    sourceNodeFilter: o1,
    topK: 10
})
YIELD node1, node2, similarity
MATCH (similar:Offer) WHERE id(similar) = node2
RETURN similar.id, similar.title, similar.price, similarity
ORDER BY similarity DESC;

-- ==========================================
-- 5. REQUÊTES D'ANALYSE BUSINESS
-- ==========================================

-- 5.1 Offres les plus consultées par catégorie
MATCH (o:Offer)-[:BELONGS_TO]->(cat:Category)
MATCH (o)<-[v:VIEWED]-(u:User)
WITH cat, o, count(v) as views
ORDER BY cat.nameFr, views DESC
RETURN cat.nameFr as category, 
       collect({
           title: o.title, 
           price: o.price, 
           views: views
       })[0..5] as topOffers;

-- 5.2 Utilisateurs les plus actifs en échanges
MATCH (u:User)-[:INITIATED]->(e:Exchange)
WHERE e.status = 'completed'
WITH u, count(e) as exchangeCount
ORDER BY exchangeCount DESC
RETURN u.firstName + ' ' + u.lastName as userName, 
       u.email, 
       exchangeCount
LIMIT 10;

-- 5.3 Analyse des prix par catégorie et condition
MATCH (o:Offer)-[:BELONGS_TO]->(cat:Category)
WHERE o.status = 'available'
WITH cat.nameFr as category, o.productCondition as condition, 
     avg(o.price) as avgPrice, 
     min(o.price) as minPrice, 
     max(o.price) as maxPrice,
     count(o) as offerCount
RETURN category, condition, avgPrice, minPrice, maxPrice, offerCount
ORDER BY category, condition;

-- ==========================================
-- 6. REQUÊTES TEMPS RÉEL
-- ==========================================

-- 6.1 Alertes pour nouvelles offres intéressantes
-- Trouve les nouvelles offres qui pourraient intéresser un utilisateur
MATCH (u:User {id: $userId})-[:LIKED]->(liked:Offer)-[:BELONGS_TO]->(cat:Category)
MATCH (cat)<-[:BELONGS_TO]-(newOffer:Offer)
WHERE newOffer.createdAt > datetime() - duration({hours: 24})
  AND newOffer.status = 'available'
  AND newOffer.sellerId <> u.id
  AND NOT (u)-[:VIEWED]->(newOffer)
RETURN newOffer.id, newOffer.title, newOffer.price, 
       newOffer.createdAt, cat.nameFr as category;

-- 6.2 Offres similaires à une offre consultée
-- Recommandations instantanées basées sur l'offre actuellement consultée
MATCH (viewed:Offer {id: $viewedOfferId})-[:BELONGS_TO]->(cat:Category)
MATCH (viewed)-[:IS_BRAND]->(brand:Brand)
MATCH (similar:Offer)-[:BELONGS_TO]->(cat)
WHERE similar.status = 'available' 
  AND similar.id <> viewed.id
OPTIONAL MATCH (similar)-[:IS_BRAND]->(brand)
WITH similar, 
     CASE WHEN (similar)-[:IS_BRAND]->(brand) THEN 2 ELSE 1 END as relevance
ORDER BY relevance DESC, abs(similar.price - viewed.price) ASC
RETURN similar.id, similar.title, similar.price, relevance
LIMIT 8;

-- ==========================================
-- 7. PERFORMANCE ET MAINTENANCE
-- ==========================================

-- 7.1 Nettoyage des anciennes interactions
-- Supprime les vues anciennes pour optimiser la base
MATCH (u:User)-[v:VIEWED]->(o:Offer)
WHERE datetime() - v.timestamp > duration({days: 90})
DELETE v;

-- 7.2 Statistiques du graphe
-- Informations générales sur la structure du graphe
MATCH (n)
WITH labels(n) as nodeType, count(*) as nodeCount
RETURN nodeType, nodeCount
UNION ALL
MATCH ()-[r]->()
WITH type(r) as relType, count(*) as relCount
RETURN relType as nodeType, relCount as nodeCount;

-- ==========================================
-- 8. GRAPH DATA SCIENCE PIPELINE
-- ==========================================

-- 8.1 Création du graphe projeté pour l'analyse
CALL gds.graph.project(
    'myrepriseGraph',
    ['User', 'Offer', 'Category', 'Brand'],
    {
        LIKED: {orientation: 'UNDIRECTED'},
        VIEWED: {orientation: 'UNDIRECTED'},
        BELONGS_TO: {orientation: 'UNDIRECTED'},
        IS_BRAND: {orientation: 'UNDIRECTED'}
    }
);

-- 8.2 Détection de communautés Louvain
CALL gds.louvain.write('myrepriseGraph', {
    writeProperty: 'community'
});

-- 8.3 Calcul de la centralité PageRank
CALL gds.pageRank.write('myrepriseGraph', {
    writeProperty: 'pagerank'
});

-- 8.4 Algorithme de similarité de nœuds
CALL gds.nodeSimilarity.write('myrepriseGraph', {
    writeRelationshipType: 'SIMILAR_TO',
    writeProperty: 'similarity'
});
