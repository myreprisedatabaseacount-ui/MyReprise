#!/bin/bash

# Script de déploiement pour MyReprise Backend
# Usage: ./deploy.sh [environment] [action]
# Exemples:
#   ./deploy.sh dev start
#   ./deploy.sh prod deploy
#   ./deploy.sh staging backup

set -e  # Arrêter en cas d'erreur

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-dev}"
ACTION="${2:-start}"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions d'aide
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        log_warning "Fichier .env non trouvé, copie depuis env.example"
        cp "$PROJECT_DIR/env.example" "$PROJECT_DIR/.env"
        log_warning "Veuillez configurer le fichier .env avant de continuer"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Générer les certificats SSL
generate_ssl() {
    log_info "Génération des certificats SSL..."
    
    if [ ! -f "$PROJECT_DIR/nginx/ssl/cert.pem" ]; then
        mkdir -p "$PROJECT_DIR/nginx/ssl"
        
        # Génération des certificats auto-signés pour le développement
        openssl genrsa -out "$PROJECT_DIR/nginx/ssl/private.key" 2048
        openssl req -new -x509 -key "$PROJECT_DIR/nginx/ssl/private.key" \
            -out "$PROJECT_DIR/nginx/ssl/cert.pem" -days 365 \
            -subj "/C=FR/ST=IDF/L=Paris/O=MyReprise/OU=Development/CN=localhost"
        
        chmod 600 "$PROJECT_DIR/nginx/ssl/private.key"
        chmod 644 "$PROJECT_DIR/nginx/ssl/cert.pem"
        
        log_success "Certificats SSL générés"
    else
        log_info "Certificats SSL déjà présents"
    fi
}

# Construire les images Docker
build_images() {
    log_info "Construction des images Docker..."
    
    cd "$PROJECT_DIR"
    
    # Construire l'image Node.js
    log_info "Construction de l'image Node.js..."
    docker build -t myreprise/nodejs-service ./nodejs-service
    
    # Construire l'image Spring Boot
    log_info "Construction de l'image Spring Boot..."
    cd payment-service
    if [ -f "mvnw" ]; then
        ./mvnw clean package -DskipTests
    else
        mvn clean package -DskipTests
    fi
    cd ..
    docker build -t myreprise/payment-service ./payment-service
    
    # Construire l'image FastAPI
    log_info "Construction de l'image FastAPI..."
    docker build -t myreprise/ai-service ./ai-service
    
    log_success "Images Docker construites"
}

# Démarrer les services
start_services() {
    log_info "Démarrage des services..."
    
    cd "$PROJECT_DIR"
    
    # Choisir le fichier docker-compose selon l'environnement
    COMPOSE_FILE="docker-compose.yml"
    if [ "$ENVIRONMENT" = "prod" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    elif [ "$ENVIRONMENT" = "staging" ]; then
        COMPOSE_FILE="docker-compose.staging.yml"
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_warning "Fichier $COMPOSE_FILE non trouvé, utilisation de docker-compose.yml"
        COMPOSE_FILE="docker-compose.yml"
    fi
    
    # Démarrer les services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Services démarrés"
    
    # Attendre que les services soient prêts
    wait_for_services
}

# Attendre que les services soient prêts
wait_for_services() {
    log_info "Attente de la disponibilité des services..."
    
    # Attendre MySQL
    log_info "Attente de MySQL..."
    timeout 60 bash -c 'until docker exec myreprise_mysql mysqladmin ping -h mysql -u myreprise_user -p${DB_PASSWORD} --silent; do sleep 2; done'
    
    # Attendre Redis
    log_info "Attente de Redis..."
    timeout 60 bash -c 'until docker exec myreprise_redis redis-cli ping | grep -q PONG; do sleep 2; done'
    
    # Attendre les services applicatifs
    log_info "Attente des services applicatifs..."
    sleep 10
    
    # Vérifier les health checks
    check_health
}

# Vérifier la santé des services
check_health() {
    log_info "Vérification de la santé des services..."
    
    # Health check NGINX
    if curl -f http://localhost/health &> /dev/null; then
        log_success "✅ NGINX: OK"
    else
        log_error "❌ NGINX: KO"
    fi
    
    # Health check Node.js
    if curl -f http://localhost/api/health &> /dev/null; then
        log_success "✅ Node.js: OK"
    else
        log_error "❌ Node.js: KO"
    fi
    
    # Health check Spring Boot
    if curl -f http://localhost/payment/actuator/health &> /dev/null; then
        log_success "✅ Spring Boot: OK"
    else
        log_error "❌ Spring Boot: KO"
    fi
    
    # Health check FastAPI
    if curl -f http://localhost/ai/health &> /dev/null; then
        log_success "✅ FastAPI: OK"
    else
        log_error "❌ FastAPI: KO"
    fi
}

# Arrêter les services
stop_services() {
    log_info "Arrêt des services..."
    
    cd "$PROJECT_DIR"
    docker-compose down
    
    log_success "Services arrêtés"
}

# Backup de la base de données
backup_database() {
    log_info "Sauvegarde de la base de données..."
    
    BACKUP_DIR="$PROJECT_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker exec myreprise_mysql mysqldump -u myreprise_user -p${DB_PASSWORD} myreprise > "$BACKUP_FILE"
    
    # Compression
    gzip "$BACKUP_FILE"
    
    # Garder seulement les 10 dernières sauvegardes
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | sort -r | tail -n +11 | xargs -r rm
    
    log_success "Sauvegarde créée: ${BACKUP_FILE}.gz"
}

# Restaurer la base de données
restore_database() {
    if [ -z "$3" ]; then
        log_error "Usage: ./deploy.sh $ENVIRONMENT restore <backup_file>"
        exit 1
    fi
    
    BACKUP_FILE="$3"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Fichier de sauvegarde non trouvé: $BACKUP_FILE"
        exit 1
    fi
    
    log_info "Restauration de la base de données depuis: $BACKUP_FILE"
    
    # Décompresser si nécessaire
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | docker exec -i myreprise_mysql mysql -u myreprise_user -p${DB_PASSWORD} myreprise
    else
        cat "$BACKUP_FILE" | docker exec -i myreprise_mysql mysql -u myreprise_user -p${DB_PASSWORD} myreprise
    fi
    
    log_success "Base de données restaurée"
}

# Mise à jour des services
update_services() {
    log_info "Mise à jour des services..."
    
    # Pull des dernières images
    docker-compose pull
    
    # Reconstruire les images locales
    build_images
    
    # Redémarrer avec les nouvelles images
    docker-compose up -d
    
    log_success "Services mis à jour"
}

# Afficher les logs
show_logs() {
    SERVICE="${3:-all}"
    
    if [ "$SERVICE" = "all" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$SERVICE"
    fi
}

# Afficher l'aide
show_help() {
    echo "Usage: $0 [environment] [action] [options]"
    echo ""
    echo "Environnements:"
    echo "  dev      - Développement (par défaut)"
    echo "  staging  - Pré-production"
    echo "  prod     - Production"
    echo ""
    echo "Actions:"
    echo "  start    - Démarrer les services (par défaut)"
    echo "  stop     - Arrêter les services"
    echo "  restart  - Redémarrer les services"
    echo "  build    - Construire les images Docker"
    echo "  deploy   - Déploiement complet (build + start)"
    echo "  backup   - Sauvegarder la base de données"
    echo "  restore  - Restaurer la base de données"
    echo "  update   - Mettre à jour les services"
    echo "  health   - Vérifier la santé des services"
    echo "  logs     - Afficher les logs"
    echo "  help     - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 dev start"
    echo "  $0 prod deploy"
    echo "  $0 staging backup"
    echo "  $0 dev restore backups/backup_20231201_120000.sql.gz"
    echo "  $0 dev logs nginx"
}

# Fonction principale
main() {
    log_info "🚀 Déploiement MyReprise Backend"
    log_info "Environnement: $ENVIRONMENT"
    log_info "Action: $ACTION"
    
    case "$ACTION" in
        "start")
            check_prerequisites
            generate_ssl
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            start_services
            ;;
        "build")
            check_prerequisites
            build_images
            ;;
        "deploy")
            check_prerequisites
            generate_ssl
            build_images
            start_services
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            restore_database "$@"
            ;;
        "update")
            update_services
            ;;
        "health")
            check_health
            ;;
        "logs")
            show_logs "$@"
            ;;
        "help")
            show_help
            ;;
        *)
            log_error "Action inconnue: $ACTION"
            show_help
            exit 1
            ;;
    esac
    
    log_success "🎉 Déploiement terminé avec succès!"
}

# Exécuter la fonction principale
main "$@"
