/**
 * Middleware d'authentification et autorisation
 */

const jwt = require('jsonwebtoken');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification JWT
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token d\'authentification requis',
        code: 'MISSING_TOKEN'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Format de token invalide. Utilisez "Bearer <token>"',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token manquant',
        code: 'MISSING_TOKEN'
      });
    }

    try {
      // Vérifier si le token est blacklisté
      const isBlacklisted = await cache.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          error: 'Token invalide ou expiré',
          code: 'TOKEN_BLACKLISTED'
        });
      }

      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ajouter les informations utilisateur à la requête
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        token: token
      };

      // Continuer vers le middleware suivant
      next();

    } catch (jwtError) {
      let errorMessage = 'Token invalide';
      let errorCode = 'INVALID_TOKEN';

      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token expiré';
        errorCode = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Token malformé';
        errorCode = 'MALFORMED_TOKEN';
      }

      return res.status(401).json({
        error: errorMessage,
        code: errorCode
      });
    }

  } catch (error) {
    logger.logError(error, req);
    return res.status(500).json({
      error: 'Erreur lors de la vérification de l\'authentification',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Middleware d'autorisation par rôle
 */
function authorize(roles = []) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentification requise',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Si aucun rôle n'est spécifié, autoriser tous les utilisateurs authentifiés
      if (roles.length === 0) {
        return next();
      }

      // Récupérer les rôles de l'utilisateur depuis le cache
      let userRoles = await cache.get(`user_roles:${req.user.userId}`);

      if (!userRoles) {
        // Si pas en cache, récupérer depuis la base de données
        const { query } = require('../config/database');
        const result = await query(`
          SELECT r.name 
          FROM roles r 
          JOIN user_roles ur ON r.id = ur.role_id 
          WHERE ur.user_id = $1
        `, [req.user.userId]);

        userRoles = result.rows.map(row => row.name);
        
        // Mettre en cache pour 1 heure
        await cache.set(`user_roles:${req.user.userId}`, userRoles, 3600);
      }

      // Vérifier si l'utilisateur a au moins un des rôles requis
      const hasRequiredRole = roles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        logger.warn(`Accès refusé pour l'utilisateur ${req.user.userId}. Rôles requis: ${roles.join(', ')}, Rôles utilisateur: ${userRoles.join(', ')}`);
        
        return res.status(403).json({
          error: 'Droits insuffisants',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: roles,
          userRoles: userRoles
        });
      }

      // Ajouter les rôles à l'objet utilisateur
      req.user.roles = userRoles;
      
      next();

    } catch (error) {
      logger.logError(error, req);
      return res.status(500).json({
        error: 'Erreur lors de la vérification des autorisations',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
}

/**
 * Middleware pour vérifier que l'utilisateur peut accéder à ses propres ressources
 */
function authorizeOwnership(userIdParam = 'userId') {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentification requise',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const resourceUserId = req.params[userIdParam] || req.body[userIdParam] || req.query[userIdParam];

      if (!resourceUserId) {
        return res.status(400).json({
          error: 'ID utilisateur manquant',
          code: 'MISSING_USER_ID'
        });
      }

      // Convertir en string pour la comparaison
      if (String(req.user.userId) !== String(resourceUserId)) {
        return res.status(403).json({
          error: 'Accès non autorisé à cette ressource',
          code: 'RESOURCE_ACCESS_DENIED'
        });
      }

      next();

    } catch (error) {
      logger.logError(error, req);
      return res.status(500).json({
        error: 'Erreur lors de la vérification de propriété',
        code: 'OWNERSHIP_ERROR'
      });
    }
  };
}

/**
 * Middleware optionnel d'authentification (n'échoue pas si pas de token)
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continuer sans authentification
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continuer sans authentification
    }

    try {
      // Vérifier si le token est blacklisté
      const isBlacklisted = await cache.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        return next(); // Continuer sans authentification
      }

      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ajouter les informations utilisateur à la requête
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        token: token
      };

    } catch (jwtError) {
      // Ignorer les erreurs JWT et continuer sans authentification
      logger.debug('Token JWT invalide dans optionalAuthenticate:', jwtError.message);
    }

    next();

  } catch (error) {
    logger.logError(error, req);
    next(); // Continuer même en cas d'erreur
  }
}

module.exports = {
  authenticate,
  authorize,
  authorizeOwnership,
  optionalAuthenticate
};
