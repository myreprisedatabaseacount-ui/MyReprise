const crypto = require('crypto');
const { Op } = require('sequelize');
const logger = require('../utils/logger.js');
const WhatsAppService = require('./whatsappService.js');

/**
 * Service de gestion des OTP (One-Time Password)
 * Gère la génération, l'envoi et la vérification des codes OTP
 */
class OTPService {
    constructor() {
        this.otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
        this.otpLength = parseInt(process.env.OTP_LENGTH) || 6;
        this.maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;
        
        // Stockage en mémoire des OTP (en production, utiliser Redis)
        this.otpStore = new Map();
    }

    /**
     * Génère un code OTP sécurisé
     * @param {number} length - Longueur du code (défaut: 6)
     * @returns {string} Code OTP généré
     */
    generateOTP(length = null) {
        const codeLength = length || this.otpLength;
        const digits = '0123456789';
        let otp = '';
        
        for (let i = 0; i < codeLength; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        
        return otp;
    }

    /**
     * Génère un hash sécurisé pour l'OTP
     * @param {string} otp - Code OTP
     * @param {string} phone - Numéro de téléphone
     * @returns {string} Hash de l'OTP
     */
    generateOTPHash(otp, phone) {
        const secret = process.env.JWT_SECRET || 'default-secret';
        return crypto
            .createHmac('sha256', secret)
            .update(`${otp}-${phone}-${Date.now()}`)
            .digest('hex');
    }

    /**
     * Enregistre un OTP dans le store
     * @param {string} phone - Numéro de téléphone
     * @param {string} country - Code pays
     * @param {string} purpose - Objectif de l'OTP (verification, reset_password, etc.)
     * @returns {Object} Informations de l'OTP créé
     */
    async createOTP(phone, country, purpose = 'verification') {
        try {
            // Nettoyer les anciens OTP pour ce numéro
            await this.cleanupExpiredOTPs(phone);
            
            // Vérifier le nombre de tentatives récentes
            const recentAttempts = await this.getRecentAttempts(phone);
            if (recentAttempts >= this.maxAttempts) {
                throw new Error(`Trop de tentatives récentes pour ${phone}. Veuillez attendre ${this.otpExpiryMinutes} minutes.`);
            }

            // Générer le code OTP
            const otp = this.generateOTP();
            const hash = this.generateOTPHash(otp, phone);
            const expiresAt = new Date(Date.now() + (this.otpExpiryMinutes * 60 * 1000));
            
            // Créer l'objet OTP
            const otpData = {
                id: crypto.randomUUID(),
                phone: phone,
                country: country,
                otp: otp,
                hash: hash,
                purpose: purpose,
                attempts: 0,
                maxAttempts: this.maxAttempts,
                createdAt: new Date(),
                expiresAt: expiresAt,
                isUsed: false
            };

            // Stocker l'OTP
            this.otpStore.set(otpData.id, otpData);
            
            // Programmer la suppression automatique
            setTimeout(() => {
                this.otpStore.delete(otpData.id);
            }, this.otpExpiryMinutes * 60 * 1000);

            logger.info(`OTP créé pour ${phone} (${purpose}) - Expire dans ${this.otpExpiryMinutes} minutes`);

            return {
                success: true,
                otpId: otpData.id,
                phone: phone,
                expiresAt: expiresAt,
                purpose: purpose
            };

        } catch (error) {
            logger.error('Erreur lors de la création OTP:', error);
            throw error;
        }
    }

    /**
     * Envoie un OTP via WhatsApp
     * @param {string} phone - Numéro de téléphone
     * @param {string} country - Code pays
     * @param {string} purpose - Objectif de l'OTP
     * @returns {Promise<Object>} Résultat de l'envoi
     */
    async sendOTP(phone, country, purpose = 'verification') {
        try {
            // Créer l'OTP
            const otpData = await this.createOTP(phone, country, purpose);
            
            // Récupérer l'OTP depuis le store
            const storedOTP = this.otpStore.get(otpData.otpId);
            if (!storedOTP) {
                throw new Error('Erreur lors de la récupération de l\'OTP');
            }

            // Envoyer via WhatsApp
            const whatsappResult = await WhatsAppService.sendOTP(
                phone, 
                country, 
                storedOTP.otp
            );

            // Mettre à jour le statut
            storedOTP.sentAt = new Date();
            storedOTP.messageId = whatsappResult.messageId;
            this.otpStore.set(otpData.otpId, storedOTP);

            logger.info(`OTP envoyé avec succès vers ${phone} via WhatsApp`);

            return {
                success: true,
                message: 'Code de vérification envoyé avec succès',
                otpId: otpData.otpId,
                phone: phone,
                expiresAt: otpData.expiresAt,
                purpose: purpose,
                deliveryMethod: 'whatsapp'
            };

        } catch (error) {
            logger.error('Erreur lors de l\'envoi OTP:', error);
            throw error;
        }
    }

    /**
     * Vérifie un code OTP
     * @param {string} phone - Numéro de téléphone
     * @param {string} otpCode - Code OTP saisi
     * @param {string} purpose - Objectif de l'OTP
     * @returns {Promise<Object>} Résultat de la vérification
     */
    async verifyOTP(phone, otpCode, purpose = 'verification') {
        try {
            // Trouver l'OTP actif pour ce numéro
            const activeOTP = await this.findActiveOTP(phone, purpose);
            
            if (!activeOTP) {
                return {
                    success: false,
                    error: 'Aucun code de vérification actif trouvé pour ce numéro',
                    code: 'NO_ACTIVE_OTP'
                };
            }

            // Vérifier si l'OTP n'a pas expiré
            if (new Date() > activeOTP.expiresAt) {
                this.otpStore.delete(activeOTP.id);
                return {
                    success: false,
                    error: 'Le code de vérification a expiré',
                    code: 'OTP_EXPIRED'
                };
            }

            // Vérifier si l'OTP n'a pas été utilisé
            if (activeOTP.isUsed) {
                return {
                    success: false,
                    error: 'Ce code de vérification a déjà été utilisé',
                    code: 'OTP_ALREADY_USED'
                };
            }

            // Incrémenter le nombre de tentatives
            activeOTP.attempts += 1;
            this.otpStore.set(activeOTP.id, activeOTP);

            // Vérifier le nombre de tentatives
            if (activeOTP.attempts > activeOTP.maxAttempts) {
                this.otpStore.delete(activeOTP.id);
                return {
                    success: false,
                    error: 'Trop de tentatives incorrectes. Veuillez demander un nouveau code.',
                    code: 'TOO_MANY_ATTEMPTS'
                };
            }

            // Vérifier le code OTP
            if (activeOTP.otp !== otpCode) {
                return {
                    success: false,
                    error: 'Code de vérification incorrect',
                    code: 'INVALID_OTP',
                    remainingAttempts: activeOTP.maxAttempts - activeOTP.attempts
                };
            }

            // Marquer l'OTP comme utilisé
            activeOTP.isUsed = true;
            activeOTP.verifiedAt = new Date();
            this.otpStore.set(activeOTP.id, activeOTP);

            // Supprimer l'OTP après utilisation
            setTimeout(() => {
                this.otpStore.delete(activeOTP.id);
            }, 60000); // Supprimer après 1 minute

            logger.info(`OTP vérifié avec succès pour ${phone}`);

            return {
                success: true,
                message: 'Code de vérification validé avec succès',
                phone: phone,
                purpose: purpose,
                verifiedAt: activeOTP.verifiedAt
            };

        } catch (error) {
            logger.error('Erreur lors de la vérification OTP:', error);
            throw error;
        }
    }

    /**
     * Trouve un OTP actif pour un numéro donné
     * @param {string} phone - Numéro de téléphone
     * @param {string} purpose - Objectif de l'OTP
     * @returns {Object|null} OTP actif ou null
     */
    async findActiveOTP(phone, purpose = 'verification') {
        for (const [id, otpData] of this.otpStore.entries()) {
            if (otpData.phone === phone && 
                otpData.purpose === purpose && 
                !otpData.isUsed && 
                new Date() < otpData.expiresAt) {
                return otpData;
            }
        }
        return null;
    }

    /**
     * Récupère les tentatives récentes pour un numéro
     * @param {string} phone - Numéro de téléphone
     * @returns {number} Nombre de tentatives récentes
     */
    async getRecentAttempts(phone) {
        const recentTime = new Date(Date.now() - (this.otpExpiryMinutes * 60 * 1000));
        let attempts = 0;

        for (const [id, otpData] of this.otpStore.entries()) {
            if (otpData.phone === phone && otpData.createdAt > recentTime) {
                attempts += otpData.attempts;
            }
        }

        return attempts;
    }

    /**
     * Nettoie les OTP expirés pour un numéro
     * @param {string} phone - Numéro de téléphone
     */
    async cleanupExpiredOTPs(phone) {
        const now = new Date();
        
        for (const [id, otpData] of this.otpStore.entries()) {
            if (otpData.phone === phone && 
                (otpData.expiresAt < now || otpData.isUsed)) {
                this.otpStore.delete(id);
            }
        }
    }

    /**
     * Récupère les statistiques des OTP
     * @returns {Object} Statistiques
     */
    getStats() {
        const total = this.otpStore.size;
        let active = 0;
        let used = 0;
        let expired = 0;

        const now = new Date();

        for (const [id, otpData] of this.otpStore.entries()) {
            if (otpData.isUsed) {
                used++;
            } else if (otpData.expiresAt < now) {
                expired++;
            } else {
                active++;
            }
        }

        return {
            total,
            active,
            used,
            expired,
            maxAttempts: this.maxAttempts,
            expiryMinutes: this.otpExpiryMinutes
        };
    }

    /**
     * Supprime tous les OTP (pour les tests)
     */
    clearAllOTPs() {
        this.otpStore.clear();
        logger.info('Tous les OTP ont été supprimés');
    }
}

module.exports = new OTPService();
