const express = require('express');
const WhatsAppService = require('../services/whatsappService.js');
const logger = require('../utils/logger.js');

const router = express.Router();

/**
 * @route   GET /api/whatsapp/webhook
 * @desc    Vérification du webhook WhatsApp
 * @access  Public
 */
router.get('/webhook', (req, res) => {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        logger.info('Tentative de vérification webhook WhatsApp:', { mode, token: token ? 'présent' : 'absent' });

        const result = WhatsAppService.verifyWebhook(mode, token, challenge);

        if (result) {
            logger.info('Webhook WhatsApp vérifié avec succès');
            res.status(200).send(challenge);
        } else {
            logger.warn('Échec de la vérification du webhook WhatsApp');
            res.status(403).json({
                success: false,
                error: 'Token de vérification invalide'
            });
        }

    } catch (error) {
        logger.error('Erreur lors de la vérification du webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   POST /api/whatsapp/webhook
 * @desc    Réception des événements WhatsApp
 * @access  Public
 */
router.post('/webhook', (req, res) => {
    try {
        logger.info('Événement webhook WhatsApp reçu');

        // Traiter les événements
        const events = WhatsAppService.processWebhookEvents(req.body);

        // Log des événements reçus
        events.forEach(event => {
            logger.info(`Événement WhatsApp: ${event.type}`, {
                messageId: event.messageId,
                from: event.from,
                status: event.status
            });
        });

        // Répondre avec succès
        res.status(200).json({
            success: true,
            message: 'Événements traités avec succès',
            eventsCount: events.length
        });

    } catch (error) {
        logger.error('Erreur lors du traitement du webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur interne du serveur'
        });
    }
});

/**
 * @route   GET /api/whatsapp/status/:messageId
 * @desc    Vérifier le statut d'un message WhatsApp
 * @access  Private (pour les tests)
 */
router.get('/status/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;

        const status = await WhatsAppService.getMessageStatus(messageId);

        res.json({
            success: true,
            data: {
                messageId,
                status
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la vérification du statut:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la vérification du statut'
        });
    }
});

/**
 * @route   POST /api/whatsapp/test-otp
 * @desc    Tester l'envoi d'OTP (pour les tests)
 * @access  Private (pour les tests)
 */
router.post('/test-otp', async (req, res) => {
    try {
        const { phone, country = 'FR' } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                error: 'Numéro de téléphone requis'
            });
        }

        // Générer un OTP de test
        const otp = WhatsAppService.generateOTP();
        
        // Envoyer l'OTP
        const result = await WhatsAppService.sendOTP(phone, country, otp);

        res.json({
            success: true,
            message: 'OTP de test envoyé',
            data: {
                phone: result.phone,
                otp: result.otp,
                messageId: result.messageId,
                simulated: result.simulated
            }
        });

    } catch (error) {
        logger.error('Erreur lors du test OTP:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'envoi du test OTP'
        });
    }
});

module.exports = router;
