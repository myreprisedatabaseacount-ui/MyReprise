# Dockerfile pour le service Node.js principal
FROM node:18-alpine

# Métadonnées
LABEL maintainer="MyReprise Team"
LABEL description="Service principal Node.js pour MyReprise"

# Installer des dépendances système nécessaires
RUN apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY . .

# Changer la propriété des fichiers
RUN chown -R nextjs:nodejs /app
USER nextjs

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Commande par défaut
CMD ["npm", "start"]
