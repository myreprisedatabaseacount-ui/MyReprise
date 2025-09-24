# Dockerfile pour le Service Chatbot MyReprise
FROM python:3.11-slim

# Définir les variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Créer un utilisateur non-root
RUN useradd --create-home --shell /bin/bash chatbot && \
    chown -R chatbot:chatbot /app
USER chatbot

# Exposer le port
EXPOSE 8001

# Commande de démarrage
CMD ["uvicorn", "chatbot.main:app", "--host", "0.0.0.0", "--port", "8001"]
