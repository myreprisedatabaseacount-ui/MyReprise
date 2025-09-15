@echo off
echo Démarrage de Neo4j avec configuration simple...
echo.

echo Arrêt des conteneurs existants...
docker-compose -f docker-compose-neo4j-simple.yml down

echo.
echo Suppression des volumes existants (optionnel - décommentez si nécessaire)...
REM docker volume rm server_neo4j_data_simple server_neo4j_logs_simple

echo.
echo Démarrage de Neo4j...
docker-compose -f docker-compose-neo4j-simple.yml up -d

echo.
echo Vérification du statut...
docker-compose -f docker-compose-neo4j-simple.yml ps

echo.
echo Logs de Neo4j (pour débogage):
docker-compose -f docker-compose-neo4j-simple.yml logs neo4j

echo.
echo Neo4j devrait être accessible à:
echo - Interface web: http://localhost:7474
echo - Connexion Bolt: bolt://localhost:7687
echo - Utilisateur: neo4j
echo - Mot de passe: neo4j123
echo.
pause
