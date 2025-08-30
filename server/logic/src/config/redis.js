/**
 * Configuration Redis pour cache et sessions
 */

const redis = require('redis');
const logger = require('../utils/logger');

let client;

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',  // Changed from 'redis' to 'localhost'
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

async function connectToRedis() {
  try {
    client = redis.createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        connectTimeout: redisConfig.connectTimeout,
        commandTimeout: redisConfig.commandTimeout,
        keepAlive: redisConfig.keepAlive
      },
      password: redisConfig.password,
      database: redisConfig.db,
      retryDelayOnFailover: redisConfig.retryDelayOnFailover,
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest
    });

    client.on('error', (err) => {
      logger.error('Erreur Redis:', err);
    });

    client.on('connect', () => {
      logger.info('✅ Connexion Redis établie');
    });

    client.on('reconnecting', () => {
      logger.warn('⚠️ Reconnexion Redis en cours...');
    });

    client.on('ready', () => {
      logger.info('✅ Redis prêt à recevoir des commandes');
    });

    await client.connect();
    
    // Test de la connexion
    await client.ping();
    logger.info('✅ Test de connexion Redis réussi');
    
    return client;
  } catch (error) {
    logger.error('❌ Erreur de connexion à Redis:', error);
    throw error;
  }
}

async function closeRedis() {
  if (client) {
    await client.quit();
    logger.info('Connexion Redis fermée');
  }
}

function getRedisClient() {
  if (!client) {
    throw new Error('Client Redis non initialisé');
  }
  return client;
}

// Fonctions utilitaires pour le cache
const cache = {
  async get(key) {
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du cache pour la clé ${key}:`, error);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 3600) {
    try {
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
      logger.debug(`Cache mis à jour pour la clé ${key} avec TTL ${ttlSeconds}s`);
    } catch (error) {
      logger.error(`Erreur lors de la mise en cache pour la clé ${key}:`, error);
    }
  },

  async del(key) {
    try {
      await client.del(key);
      logger.debug(`Cache supprimé pour la clé ${key}`);
    } catch (error) {
      logger.error(`Erreur lors de la suppression du cache pour la clé ${key}:`, error);
    }
  },

  async exists(key) {
    try {
      return await client.exists(key);
    } catch (error) {
      logger.error(`Erreur lors de la vérification d'existence du cache pour la clé ${key}:`, error);
      return false;
    }
  },

  async flushAll() {
    try {
      await client.flushAll();
      logger.info('Cache Redis vidé complètement');
    } catch (error) {
      logger.error('Erreur lors du vidage du cache Redis:', error);
    }
  },

  // Cache avec pattern pour les listes
  async getList(pattern) {
    try {
      const keys = await client.keys(pattern);
      const values = await Promise.all(
        keys.map(async (key) => {
          const value = await client.get(key);
          return { key, value: value ? JSON.parse(value) : null };
        })
      );
      return values;
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la liste avec pattern ${pattern}:`, error);
      return [];
    }
  }
};

// Session store pour Express
const session = {
  async get(sessionId) {
    try {
      const sessionKey = `session:${sessionId}`;
      const sessionData = await client.get(sessionKey);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la session ${sessionId}:`, error);
      return null;
    }
  },

  async set(sessionId, sessionData, maxAge = 86400) {
    try {
      const sessionKey = `session:${sessionId}`;
      await client.setEx(sessionKey, maxAge, JSON.stringify(sessionData));
    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde de la session ${sessionId}:`, error);
    }
  },

  async destroy(sessionId) {
    try {
      const sessionKey = `session:${sessionId}`;
      await client.del(sessionKey);
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la session ${sessionId}:`, error);
    }
  }
};

module.exports = {
  connectToRedis,
  closeRedis,
  getRedisClient,
  cache,
  session
};
