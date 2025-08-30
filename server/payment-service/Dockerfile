# Dockerfile pour le service de paiement Spring Boot
FROM openjdk:17-jdk-alpine

# Métadonnées
LABEL maintainer="MyReprise Team"
LABEL description="Service de paiement Spring Boot pour MyReprise"

# Installer des dépendances système
RUN apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Définir le timezone
ENV TZ=Europe/Paris

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001 -G spring

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier JAR de l'application
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

# Changer la propriété des fichiers
RUN chown -R spring:spring /app
USER spring

# Exposer le port
EXPOSE 8080

# Configuration JVM optimisée
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseContainerSupport"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Commande par défaut
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
