const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger.js');
require("dotenv").config({ path: require('path').join(__dirname, '../../../server/.env') });
/**
 * Service WhatsApp Business API pour l'envoi d'OTP
 * Compatible avec l'API WhatsApp Business v17.0
 */
class WhatsAppService {
    constructor() {
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
        this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0';
        this.baseURL = `https://graph.facebook.com/${this.apiVersion}`;
        
        // Validation des variables d'environnement
        this.validateConfig();
    }

    /**
     * Valide la configuration WhatsApp
     */
    validateConfig() {
        const requiredVars = [
            'WHATSAPP_ACCESS_TOKEN',
            'WHATSAPP_PHONE_NUMBER_ID'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            logger.warn(`Variables WhatsApp manquantes: ${missingVars.join(', ')}`);
            logger.warn('Le service WhatsApp fonctionnera en mode simulation');
        }
    }

    /**
     * Génère un code OTP sécurisé
     * @param {number} length - Longueur du code (défaut: 6)
     * @returns {string} Code OTP généré
     */
    generateOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        
        return otp;
    }

    /**
     * Formate un numéro de téléphone pour WhatsApp
     * @param {string} phone - Numéro de téléphone
     * @param {string} country - Code pays (ex: FR, US, MA)
     * @returns {string} Numéro formaté
     */
    formatPhoneNumber(phone, country = 'MA') {
        // Supprimer tous les caractères non numériques
        let cleanPhone = phone.replace(/\D/g, '');
        
        // Ajouter le code pays si nécessaire
        if (!cleanPhone.startsWith('+')) {
            const countryCodes = {
                'FR': '33',
                'MA': '212',
                'US': '1',
                'CA': '1',
                'GB': '44',
                'DE': '49',
                'ES': '34',
                'IT': '39'
            };
            
            const countryCode = countryCodes[country.toUpperCase()] || '212';
            
            // Supprimer le 0 initial si présent
            if (cleanPhone.startsWith('0')) {
                cleanPhone = cleanPhone.substring(1);
            }
            if(cleanPhone.startsWith(countryCode)) {
                cleanPhone = cleanPhone.substring(countryCode.length);
            }
            
            cleanPhone = `+${countryCode}${cleanPhone}`;
        }
        
        return cleanPhone;
    }

    /**
     * Envoie un OTP via WhatsApp Business API
     * @param {string} phone - Numéro de téléphone du destinataire
     * @param {string} country - Code pays
     * @param {string} otp - Code OTP à envoyer
     * @param {string} templateName - Nom du template WhatsApp (défaut: 'otp_verification')
     * @returns {Promise<Object>} Résultat de l'envoi
     */
    async sendOTP(phone, country, otp, templateName = 'hello_world') {
        try {
            // Recharger les variables d'environnement à chaque appel
            require("dotenv").config({ path: require('path').join(__dirname, '../../../\.env') });
            
            // Mettre à jour les variables
            this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
            this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
            this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
            this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0';
            this.baseURL = `https://graph.facebook.com/${this.apiVersion}`;

            console.log('🔍 Variables d\'environnement :');
            console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Configuré' : '❌ Manquant');
            console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Configuré' : '❌ Manquant');
            console.log('WHATSAPP_API_VERSION:', process.env.WHATSAPP_API_VERSION || 'v22.0');

            // Vérifier la configuration
            if (!this.accessToken || !this.phoneNumberId) {
                logger.warn('Configuration WhatsApp manquante, simulation de l\'envoi OTP');
                return this.simulateOTPSending(phone, otp);
            }

            const formattedPhone = this.formatPhoneNumber(phone, country);
            console.log("formatted phone : ", formattedPhone);
            
            // URL de l'API WhatsApp
            const url = `${this.baseURL}/${this.phoneNumberId}/messages`;
            
            // Headers pour l'API
            const headers = {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            };

            console.log("headers :", headers);
            console.log("data dans le body :", templateName, country, otp);

            // Corps de la requête pour l'OTP
            const messageData = {
                messaging_product: 'whatsapp',
                to: formattedPhone.slice(1),
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: 'en_US'
                    }
                }
            };

            logger.info(`Envoi OTP WhatsApp vers ${formattedPhone}`);
            
            // Afficher le code OTP dans la console pour le développement
            console.log(`🔐 CODE OTP POUR ${formattedPhone}: ${otp}`);
            console.log(`📱 Utilisez ce code pour la vérification`);

            // Envoi de la requête
            const response = await axios.post(url, messageData, { headers });

            logger.info(`OTP WhatsApp envoyé avec succès: ${response.data.messages[0].id}`);

            return {
                success: true,
                messageId: response.data.messages[0].id,
                phone: formattedPhone,
                otp: otp,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Erreur lors de l\'envoi OTP WhatsApp:', error.response?.data || error.message);
            
            // En cas d'erreur, simuler l'envoi pour les tests
            if (process.env.NODE_ENV === 'development') {
                logger.warn('Mode développement: simulation de l\'envoi OTP');
                return this.simulateOTPSending(phone, otp);
            }

            throw new Error(`Erreur envoi WhatsApp: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    /**
     * Simule l'envoi d'OTP pour les tests
     * @param {string} phone - Numéro de téléphone
     * @param {string} otp - Code OTP
     * @returns {Object} Résultat simulé
     */
    simulateOTPSending(phone, otp) {
        logger.info(`[SIMULATION] OTP ${otp} envoyé vers ${phone}`);
        
        return {
            success: true,
            messageId: `sim_${Date.now()}`,
            phone: phone,
            otp: otp,
            timestamp: new Date().toISOString(),
            simulated: true
        };
    }

    /**
     * Détermine le code de langue selon le pays
     * @param {string} country - Code pays
     * @returns {string} Code de langue WhatsApp
     */
    getLanguageCode(country) {
        const languageMap = {
            'FR': 'fr',
            'MA': 'ar',
            'US': 'en_US',
            'CA': 'en_US',
            'GB': 'en_GB',
            'DE': 'de',
            'ES': 'es',
            'IT': 'it'
        };
        
        return languageMap[country?.toUpperCase()] || 'fr';
    }

    /**
     * Vérifie le statut d'un message WhatsApp
     * @param {string} messageId - ID du message
     * @returns {Promise<Object>} Statut du message
     */
    async getMessageStatus(messageId) {
        try {
            if (!this.accessToken) {
                return { status: 'simulated', messageId };
            }

            const url = `${this.baseURL}/${messageId}`;
            const headers = {
                'Authorization': `Bearer ${this.accessToken}`
            };

            const response = await axios.get(url, { headers });
            return response.data;

        } catch (error) {
            logger.error('Erreur lors de la vérification du statut:', error.message);
            throw error;
        }
    }

    /**
     * Valide un webhook WhatsApp
     * @param {string} mode - Mode de vérification
     * @param {string} token - Token de vérification
     * @param {string} challenge - Challenge à retourner
     * @returns {string|null} Challenge si valide, null sinon
     */
    verifyWebhook(mode, token, challenge) {
        const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
        
        if (mode === 'subscribe' && token === verifyToken) {
            logger.info('Webhook WhatsApp vérifié avec succès');
            return challenge;
        }
        
        logger.warn('Échec de la vérification du webhook WhatsApp');
        return null;
    }

    /**
     * Traite les événements de webhook WhatsApp
     * @param {Object} body - Corps de la requête webhook
     * @returns {Object} Événements traités
     */
    processWebhookEvents(body) {
        try {
            const events = [];
            
            if (body.entry && body.entry.length > 0) {
                for (const entry of body.entry) {
                    if (entry.changes && entry.changes.length > 0) {
                        for (const change of entry.changes) {
                            if (change.value && change.value.messages) {
                                for (const message of change.value.messages) {
                                    events.push({
                                        type: 'message',
                                        messageId: message.id,
                                        from: message.from,
                                        timestamp: message.timestamp,
                                        message: message.text?.body || '',
                                        type: message.type
                                    });
                                }
                            }
                            
                            if (change.value && change.value.statuses) {
                                for (const status of change.value.statuses) {
                                    events.push({
                                        type: 'status',
                                        messageId: status.id,
                                        status: status.status,
                                        timestamp: status.timestamp,
                                        recipientId: status.recipient_id
                                    });
                                }
                            }
                        }
                    }
                }
            }
            
            logger.info(`${events.length} événements WhatsApp traités`);
            return events;
            
        } catch (error) {
            logger.error('Erreur lors du traitement des événements webhook:', error);
            return [];
        }
    }
}

module.exports = new WhatsAppService();
