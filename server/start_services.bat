@echo off
echo 🚀 Démarrage des Services MyReprise
echo =====================================

echo.
echo 📋 Services à démarrer:
echo   1. Graph Service (Neo4j) - Port 8002
echo   2. AI Service (Chatbot) - Port 8001
echo.

REM Vérifier si Python est installé
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

echo 🔍 Vérification des dépendances...

REM Vérifier les dépendances du Graph Service
cd server\graph-service
python -c "import neo4j, fastapi" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installation des dépendances Graph Service...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances Graph Service
        pause
        exit /b 1
    )
)

REM Vérifier les dépendances du AI Service
cd ..\ai-service\chatbot
python -c "import fastapi, sentence_transformers" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installation des dépendances AI Service...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances AI Service
        pause
        exit /b 1
    )
)

echo.
echo 🚀 Démarrage des services...

REM Démarrer le Graph Service en arrière-plan
echo 📊 Démarrage du Graph Service...
start "Graph Service" cmd /k "cd server\graph-service && python main.py"

REM Attendre un peu pour que le Graph Service démarre
timeout /t 5 /nobreak >nul

REM Démarrer le AI Service en arrière-plan
echo 🤖 Démarrage du AI Service...
start "AI Service" cmd /k "cd server\ai-service\chatbot && python start_chatbot.py"

echo.
echo ✅ Services démarrés !
echo.
echo 📋 URLs disponibles:
echo   - Graph Service: http://localhost:8002
echo   - AI Service: http://localhost:8001
echo   - Graph Service Docs: http://localhost:8002/docs
echo   - AI Service Docs: http://localhost:8001/docs
echo.

echo 🔍 Test de l'intégration...
timeout /t 10 /nobreak >nul
cd server\ai-service\chatbot
python test_axios_integration.py

echo.
echo 🎉 Services prêts ! Vous pouvez maintenant utiliser le chatbot.
echo.
pause
