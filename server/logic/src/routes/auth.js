/**
 * Routes d'authentification et autorisation
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite à 5 tentatives par IP
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation pour l'inscription
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
];

// Validation pour la connexion
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis'),
];

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Hash du mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertion de l'utilisateur
    const newUser = await query(
      `INSERT INTO users (email, password, first_name, last_name, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id, email, first_name, last_name, created_at`,
      [email, hashedPassword, firstName, lastName]
    );

    const user = newUser.rows[0];

    // Génération du token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log de l'inscription
    logger.logAuth('register', user.id, { email });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      error: 'Erreur lors de la création de l\'utilisateur'
    });
  }
});

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Récupération de l'utilisateur
    const userResult = await query(
      'SELECT id, email, password, first_name, last_name, is_active FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    const user = userResult.rows[0];

    // Vérifier si le compte est actif
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Compte désactivé'
      });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect'
      });
    }

    // Génération du token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Mise en cache des informations utilisateur
    await cache.set(`user:${user.id}`, {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    }, 3600); // 1 heure

    // Log de la connexion
    logger.logAuth('login', user.id, { email });

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      error: 'Erreur lors de la connexion'
    });
  }
});

/**
 * POST /api/auth/logout
 * Déconnexion (invalidation du token côté client principalement)
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      // Ajouter le token à une blacklist (optionnel)
      await cache.set(`blacklist:${token}`, true, 86400); // 24h
      
      // Log de la déconnexion
      if (req.user) {
        logger.logAuth('logout', req.user.userId);
      }
    }

    res.json({
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      error: 'Erreur lors de la déconnexion'
    });
  }
});

/**
 * GET /api/auth/profile
 * Récupération du profil utilisateur
 */
router.get('/profile', async (req, res) => {
  try {
    // Cette route nécessite une authentification (middleware à ajouter)
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token d\'authentification requis'
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérifier si le token est blacklisté
      const isBlacklisted = await cache.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          error: 'Token invalide'
        });
      }

      // Récupération des informations utilisateur depuis le cache
      let user = await cache.get(`user:${decoded.userId}`);
      
      if (!user) {
        // Si pas en cache, récupérer depuis la DB
        const userResult = await query(
          'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = $1 AND is_active = true',
          [decoded.userId]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({
            error: 'Utilisateur non trouvé'
          });
        }

        user = {
          id: userResult.rows[0].id,
          email: userResult.rows[0].email,
          firstName: userResult.rows[0].first_name,
          lastName: userResult.rows[0].last_name,
          createdAt: userResult.rows[0].created_at
        };

        // Remettre en cache
        await cache.set(`user:${user.id}`, user, 3600);
      }

      res.json({
        user
      });

    } catch (jwtError) {
      return res.status(401).json({
        error: 'Token invalide'
      });
    }

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      error: 'Erreur lors de la récupération du profil'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Renouvellement du token JWT
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Token d\'authentification requis'
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      
      // Vérifier si le token est blacklisté
      const isBlacklisted = await cache.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          error: 'Token invalide'
        });
      }

      // Générer un nouveau token
      const newToken = jwt.sign(
        { 
          userId: decoded.userId, 
          email: decoded.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Blacklister l'ancien token
      await cache.set(`blacklist:${token}`, true, 86400);

      res.json({
        message: 'Token renouvelé avec succès',
        token: newToken
      });

    } catch (jwtError) {
      return res.status(401).json({
        error: 'Token invalide'
      });
    }

  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      error: 'Erreur lors du renouvellement du token'
    });
  }
});

module.exports = router;
