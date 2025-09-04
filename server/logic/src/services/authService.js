const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models/User.js');
const db = require('../config/db');
const logger = require('../utils/logger.js');
const Neo4jSyncService = require('./neo4jSyncService.js');

// ========================================
// CONFIGURATION JWT
// ========================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ========================================
// SERVICE D'AUTHENTIFICATION UNIFIÉ
// ========================================

class AuthService {
    
    /**
     * Génère les tokens JWT pour un utilisateur
     */
    static generateTokens(user) {
        const token = jwt.sign(
            { 
                userId: user.id, 
                primaryIdentifier: user.primaryIdentifier,
                authProvider: user.authProvider,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRES_IN }
        );

        return { token, refreshToken };
    }

    /**
     * Authentification par téléphone avec mot de passe
     */
    static async authenticateWithPhone(phone, password) {
        try {
            const user = await User.findByPhone(phone);
            if (!user) {
                throw new Error('Numéro de téléphone ou mot de passe incorrect');
            }

            if (user.authProvider !== 'phone') {
                throw new Error('Ce compte n\'utilise pas l\'authentification par téléphone');
            }

            // Vérification du mot de passe
            if (!user.password) {
                throw new Error('Mot de passe non défini pour ce compte');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error('Numéro de téléphone ou mot de passe incorrect');
            }

            const tokens = this.generateTokens(user);
            
            logger.info(`Utilisateur connecté par téléphone: ${user.phone}`);
            
            return {
                success: true,
                message: 'Connexion réussie',
                data: {
                    user: user.getPublicData(),
                    token: tokens.token,
                    refreshToken: tokens.refreshToken
                }
            };

        } catch (error) {
            logger.error('Erreur authentification téléphone:', error);
            throw error;
        }
    }

    /**
     * Authentification par Google
     */
    static async authenticateWithGoogle(googleData) {
        try {
            const { googleId, email, firstName, lastName, profilePicture } = googleData;

            // Vérifier si l'utilisateur existe déjà
            let user = await User.findByGoogleId(googleId);
            
            if (!user) {
                // Vérifier si un utilisateur avec cet email existe déjà
                const existingUserByEmail = await User.findByEmail(email);
                if (existingUserByEmail) {
                    throw new Error('Un compte avec cet email existe déjà avec un autre provider');
                }

                // Créer un nouvel utilisateur
                const userData = {
                    firstName,
                    lastName,
                    email: email.toLowerCase(),
                    googleId,
                    authProvider: 'google',
                    primaryIdentifier: email.toLowerCase(),
                    isVerified: true, // Google est considéré comme vérifié
                    role: 'user'
                };

                user = await User.createUser(userData);
                logger.info(`Nouvel utilisateur Google créé: ${email}`);
                
                // Synchroniser vers Neo4j (asynchrone, non bloquant)
                Neo4jSyncService.syncUser(user, 'CREATE').catch(error => {
                    logger.error('Erreur synchronisation Neo4j (non bloquant):', error);
                });
            }

            const tokens = this.generateTokens(user);
            
            logger.info(`Utilisateur connecté par Google: ${user.email}`);
            
            return {
                success: true,
                message: 'Connexion Google réussie',
                data: {
                    user: user.getPublicData(),
                    token: tokens.token,
                    refreshToken: tokens.refreshToken
                }
            };

        } catch (error) {
            logger.error('Erreur authentification Google:', error);
            throw error;
        }
    }

    /**
     * Authentification par Facebook
     */
    static async authenticateWithFacebook(facebookData) {
        try {
            const { facebookId, email, phone, firstName, lastName, profilePicture } = facebookData;

            // Vérifier si l'utilisateur existe déjà
            let user = await User.findByFacebookId(facebookId);
            
            if (!user) {
                // Vérifier les conflits avec d'autres providers
                if (email) {
                    const existingUserByEmail = await User.findByEmail(email);
                    if (existingUserByEmail) {
                        throw new Error('Un compte avec cet email existe déjà avec un autre provider');
                    }
                }

                if (phone) {
                    const existingUserByPhone = await User.findByPhone(phone);
                    if (existingUserByPhone) {
                        throw new Error('Un compte avec ce téléphone existe déjà avec un autre provider');
                    }
                }

                // Créer un nouvel utilisateur
                const userData = {
                    firstName,
                    lastName,
                    facebookId,
                    authProvider: 'facebook',
                    primaryIdentifier: facebookId,
                    isVerified: true, // Facebook est considéré comme vérifié
                    role: 'user'
                };

                // Ajouter les données optionnelles
                if (email) {
                    userData.facebookEmail = email.toLowerCase();
                }
                if (phone) {
                    userData.facebookPhone = phone;
                }

                user = await User.createUser(userData);
                logger.info(`Nouvel utilisateur Facebook créé: ${facebookId}`);
                
                // Synchroniser vers Neo4j (asynchrone, non bloquant)
                Neo4jSyncService.syncUser(user, 'CREATE').catch(error => {
                    logger.error('Erreur synchronisation Neo4j (non bloquant):', error);
                });
            }

            const tokens = this.generateTokens(user);
            
            logger.info(`Utilisateur connecté par Facebook: ${user.facebookId}`);
            
            return {
                success: true,
                message: 'Connexion Facebook réussie',
                data: {
                    user: user.getPublicData(),
                    token: tokens.token,
                    refreshToken: tokens.refreshToken
                }
            };

        } catch (error) {
            logger.error('Erreur authentification Facebook:', error);
            throw error;
        }
    }

    /**
     * Inscription par téléphone avec mot de passe
     */
    static async registerWithPhone(userData) {
        try {
            const { firstName, lastName, phone, password } = userData;

            // Hashage du mot de passe
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const newUserData = {
                firstName,
                lastName,
                phone,
                password: hashedPassword,
                authProvider: 'phone',
                primaryIdentifier: phone,
                isVerified: false, // TODO: Implémenter la vérification OTP
                role: 'user'
            };

            const newUser = await User.createUser(newUserData);
            const tokens = this.generateTokens(newUser);

            // Synchroniser vers Neo4j (asynchrone, non bloquant)
            Neo4jSyncService.syncUser(newUser, 'CREATE').catch(error => {
                logger.error('Erreur synchronisation Neo4j (non bloquant):', error);
            });

            logger.info(`Nouvel utilisateur téléphone inscrit: ${phone}`);

            return {
                success: true,
                message: 'Inscription réussie',
                data: {
                    user: newUser.getPublicData(),
                    token: tokens.token,
                    refreshToken: tokens.refreshToken
                }
            };

        } catch (error) {
            logger.error('Erreur inscription téléphone:', error);
            throw error;
        }
    }

    /**
     * Rafraîchissement du token
     */
    static async refreshToken(refreshTokenValue) {
        try {
            if (!refreshTokenValue) {
                throw new Error('Refresh token requis');
            }

            // Vérification du refresh token
            const decoded = jwt.verify(refreshTokenValue, JWT_SECRET);
            const user = await User.findByPk(decoded.userId);

            if (!user) {
                throw new Error('Utilisateur non trouvé');
            }

            // Génération d'un nouveau token
            const tokens = this.generateTokens(user);

            return {
                success: true,
                data: {
                    token: tokens.token
                }
            };

        } catch (error) {
            logger.error('Erreur lors du rafraîchissement du token:', error);
            throw new Error('Refresh token invalide');
        }
    }

    /**
     * Déconnexion
     */
    static async logout(user) {
        try {
            // TODO: Implémenter la blacklist des tokens
            logger.info(`Utilisateur déconnecté: ${user.primaryIdentifier}`);
            
            return {
                success: true,
                message: 'Déconnexion réussie'
            };

        } catch (error) {
            logger.error('Erreur lors de la déconnexion:', error);
            throw new Error('Erreur interne du serveur');
        }
    }

    /**
     * Vérifie si un utilisateur peut utiliser un provider spécifique
     */
    static async canUseProvider(identifier, provider) {
        try {
            switch (provider) {
                case 'phone':
                    const userByPhone = await User.findByPhone(identifier);
                    return !userByPhone || userByPhone.authProvider === 'phone';
                    
                case 'google':
                    const userByEmail = await User.findByEmail(identifier);
                    return !userByEmail || userByEmail.authProvider === 'google';
                    
                case 'facebook':
                    const userByFacebookId = await User.findByFacebookId(identifier);
                    return !userByFacebookId || userByFacebookId.authProvider === 'facebook';
                    
                default:
                    return false;
            }
        } catch (error) {
            logger.error('Erreur vérification provider:', error);
            return false;
        }
    }

    /**
     * Récupère l'identifiant principal d'un utilisateur selon son provider
     */
    static getPrimaryIdentifier(user) {
        switch (user.authProvider) {
            case 'phone':
                return user.phone;
            case 'google':
                return user.email;
            case 'facebook':
                return user.facebookId;
            default:
                return user.primaryIdentifier;
        }
    }
}

module.exports = AuthService;
