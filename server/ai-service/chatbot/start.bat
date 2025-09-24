@echo off
echo 🤖 Démarrage du Service Chatbot MyReprise
echo ================================================

REM Vérifier si Python est installé
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python n'est pas installé ou pas dans le PATH
    pause
    exit /b 1
)

REM Vérifier si les dépendances sont installées
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installation des dépendances...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dépendances
        pause
        exit /b 1
    )
)

REM Démarrer le service
echo 🚀 Démarrage du service...
python start_chatbot.py

pause
