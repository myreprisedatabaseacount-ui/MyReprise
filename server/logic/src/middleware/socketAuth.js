const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware d'authentification pour les sockets
 * Vérifie le token JWT depuis les cookies ou les query parameters
 */
const authenticateSocket = async (socket, next) => {
    try {
        let token = null;

        // Essayer de récupérer le token depuis les cookies
        if (socket.handshake.headers.cookie) {
            const cookies = socket.handshake.headers.cookie.split(';');
            const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('tk='));
            if (tokenCookie) {
                token = tokenCookie.split('=')[1];
            }
        }

        // Essayer de récupérer le token depuis les query parameters
        if (!token && socket.handshake.query.token) {
            token = socket.handshake.query.token;
        }

        if (!token) {
            return next(new Error('Token d\'accès requis'));
        }

        // Vérification du token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Vérification que l'utilisateur existe toujours
        const user = await User.findByPk(decoded.userId);
        if (!user) {
            return next(new Error('Utilisateur non trouvé'));
        }

        // Ajout des informations utilisateur au socket
        socket.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            primaryIdentifier: decoded.primaryIdentifier,
            authProvider: decoded.authProvider
        };

        next();

    } catch (error) {
        logger.error('Erreur d\'authentification socket:', error);

        if (error.name === 'JsonWebTokenError') {
            return next(new Error('Token invalide'));
        }

        if (error.name === 'TokenExpiredError') {
            return next(new Error('Token expiré'));
        }

        return next(new Error('Erreur d\'authentification'));
    }
};

module.exports = { authenticateSocket };
