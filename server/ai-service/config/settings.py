"""
Configuration des paramètres pour le service IA
"""

import os
import json
from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

class Settings(BaseSettings):
    """Configuration principale du service IA"""
    
    # Configuration de base
    app_name: str = "MyReprise AI Service"
    version: str = "1.0.0"
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    
    # Configuration du serveur
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    workers: int = Field(default=4, env="WORKERS")
    
    # Base de données MySQL
    database_url: str = Field(
        default="mysql://myreprise_user:password@localhost:3306/myreprise",
        env="DATABASE_URL"
    )
    database_pool_size: int = Field(default=10, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=20, env="DATABASE_MAX_OVERFLOW")
    
    # Redis
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")
    redis_host: str = Field(default="localhost", env="REDIS_HOST")
    redis_port: int = Field(default=6379, env="REDIS_PORT")
    redis_db: int = Field(default=0, env="REDIS_DB")
    redis_password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    
    # APIs IA
    openai_api_key: str = Field(default="dummy_key", env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-3.5-turbo", env="OPENAI_MODEL")
    openai_max_tokens: int = Field(default=1000, env="OPENAI_MAX_TOKENS")
    
    huggingface_api_key: Optional[str] = Field(default=None, env="HUGGINGFACE_API_KEY")
    
    # Sécurité
    secret_key: str = Field(env="SECRET_KEY", default="your-secret-key-here")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS - Stockage temporaire en string pour éviter les problèmes de parsing
    allowed_origins_str: str = Field(
        default="http://localhost:3000,https://myreprise.com",
        env="ALLOWED_ORIGINS"
    )
    allowed_hosts_str: str = Field(
        default="localhost,127.0.0.1,myreprise.com",
        env="ALLOWED_HOSTS"
    )
    
    @property
    def allowed_origins(self) -> List[str]:
        """Retourne la liste des origines autorisées"""
        return [item.strip() for item in self.allowed_origins_str.split(',') if item.strip()]
    
    @property
    def allowed_hosts(self) -> List[str]:
        """Retourne la liste des hôtes autorisés"""
        return [item.strip() for item in self.allowed_hosts_str.split(',') if item.strip()]
    
    # Configuration des modèles ML
    ai_model_cache_dir: str = Field(default="./models", env="MODEL_CACHE_DIR")
    max_ai_model_cache_size_gb: int = Field(default=5, env="MAX_MODEL_CACHE_SIZE_GB")
    
    # Configuration du cache
    cache_ttl_seconds: int = Field(default=3600, env="CACHE_TTL_SECONDS")  # 1 heure
    cache_max_size: int = Field(default=1000, env="CACHE_MAX_SIZE")
    
    # Configuration des tâches
    max_concurrent_tasks: int = Field(default=10, env="MAX_CONCURRENT_TASKS")
    task_timeout_seconds: int = Field(default=300, env="TASK_TIMEOUT_SECONDS")  # 5 minutes
    
    # Configuration de logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file: str = Field(default="logs/ai-service.log", env="LOG_FILE")
    log_max_bytes: int = Field(default=10485760, env="LOG_MAX_BYTES")  # 10MB
    log_backup_count: int = Field(default=5, env="LOG_BACKUP_COUNT")
    
    # Configuration des limites
    max_file_size_mb: int = Field(default=50, env="MAX_FILE_SIZE_MB")
    max_text_length: int = Field(default=10000, env="MAX_TEXT_LENGTH")
    max_image_size_mb: int = Field(default=20, env="MAX_IMAGE_SIZE_MB")
    max_audio_size_mb: int = Field(default=100, env="MAX_AUDIO_SIZE_MB")
    
    # Configuration spécifique aux services IA
    text_processing: dict = Field(default={
        "max_batch_size": 10,
        "supported_languages": ["fr", "en", "es", "de", "it"],
        "sentiment_threshold": 0.7,
        "summary_max_length": 200
    })
    
    image_processing: dict = Field(default={
        "max_batch_size": 5,
        "supported_formats": ["jpg", "jpeg", "png", "gif", "bmp"],
        "max_width": 4096,
        "max_height": 4096,
        "quality": 85
    })
    
    audio_processing: dict = Field(default={
        "max_batch_size": 3,
        "supported_formats": ["wav", "mp3", "flac", "ogg"],
        "max_duration_seconds": 600,  # 10 minutes
        "sample_rate": 16000
    })
    
    # Monitoring et métriques
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_port: int = Field(default=9090, env="METRICS_PORT")
    
    # Configuration de production
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        protected_namespaces = ('settings_',)  # Fix Pydantic conflict
        # Ignorer les erreurs de parsing pour les champs optionnels
        extra = "ignore"
        
    def get_database_url(self) -> str:
        """Retourne l'URL de la base de données avec le schéma MySQL"""
        if self.database_url.startswith("mysql://"):
            return self.database_url.replace("mysql://", "mysql+aiomysql://", 1)
        return self.database_url
    
    def get_redis_url(self) -> str:
        """Retourne l'URL Redis complète"""
        if self.redis_url:
            return self.redis_url
        
        password_part = f":{self.redis_password}@" if self.redis_password else ""
        return f"redis://{password_part}{self.redis_host}:{self.redis_port}/{self.redis_db}"
    
    def is_development(self) -> bool:
        """Vérifie si on est en mode développement"""
        return self.environment.lower() in ["development", "dev", "local"]
    
    def is_production(self) -> bool:
        """Vérifie si on est en mode production"""
        return self.environment.lower() in ["production", "prod"]

# Instance globale des paramètres
_settings = None

def get_settings() -> Settings:
    """Factory function pour obtenir l'instance des paramètres"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings

# Export des settings pour l'import direct
settings = get_settings()