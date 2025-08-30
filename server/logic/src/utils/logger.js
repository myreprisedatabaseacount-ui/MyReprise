/**
 * Configuration du système de logging avec Winston
 */

const winston = require('winston');
const path = require('path');

// Configuration des niveaux de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Configuration des couleurs
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Format pour les logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Format pour les fichiers (sans couleurs)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Configuration des transports
const transports = [
  // Console transport pour le développement
  new winston.transports.Console({
    format: format,
    level: level(),
  }),
  
  // Fichier pour toutes les erreurs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Fichier pour tous les logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Créer le logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
    }),
  ],
  exitOnError: false,
});

// Stream pour Morgan (logging HTTP)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Fonctions utilitaires
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
  };
  
  if (res.statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

logger.logError = (error, req = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
  };
  
  if (req) {
    errorData.request = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
    };
  }
  
  logger.error('Application Error', errorData);
};

logger.logAuth = (action, userId, details = {}) => {
  logger.info('Auth Action', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

logger.logPayment = (action, amount, currency, details = {}) => {
  logger.info('Payment Action', {
    action,
    amount,
    currency,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

logger.logAI = (action, model, processingTime, details = {}) => {
  logger.info('AI Action', {
    action,
    model,
    processingTime: `${processingTime}ms`,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Middleware pour Express
logger.expressMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    logger.logRequest(req, res, responseTime);
  });
  
  next();
};

module.exports = logger;
