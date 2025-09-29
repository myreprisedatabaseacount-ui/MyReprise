const admin = require('firebase-admin');
const path = require('path');

// Initialisation unique du SDK Firebase Admin
let initialized = false;
let adminInstance = null;

function getDisabledAdmin() {
    console.warn('⚠️ Notifications désactivées: aucune credential Firebase fournie.');
    return {
        messaging() {
            return {
                async sendEachForMulticast(message) {
                    const tokens = (message && message.tokens) || [];
                    return {
                        successCount: 0,
                        failureCount: tokens.length,
                        responses: tokens.map(() => ({ success: false, error: { code: 'messaging/disabled' } }))
                    };
                }
            };
        }
    };
}

function initializeFirebaseAdmin() {
    if (initialized) return adminInstance;
    try {
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CREDENTIAL_PATH) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault()
            });
            adminInstance = admin;
            initialized = true;
            return adminInstance;
        }

        if (process.env.FIREBASE_CREDENTIAL_BASE64) {
            const jsonStr = Buffer.from(process.env.FIREBASE_CREDENTIAL_BASE64, 'base64').toString('utf8');
            const serviceAccount = JSON.parse(jsonStr);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            adminInstance = admin;
            initialized = true;
            return adminInstance;
        }

        // Mode fallback: fichier local dans config/serviceAccountKey.json (à ignorer du repo)
        const fallbackPath = path.join(__dirname, 'serviceAccountKey.json');
        try {
            const serviceAccount = require(fallbackPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            adminInstance = admin;
            initialized = true;
            return adminInstance;
        } catch (e) {
            // Ne pas bloquer le serveur: activer un mode dégradé sans envoi réel
            adminInstance = getDisabledAdmin();
            initialized = true;
            return adminInstance;
        }
    } catch (error) {
        console.error('Erreur initialisation Firebase Admin:', error);
        // Mode dégradé en cas d'erreur inattendue
        adminInstance = getDisabledAdmin();
        initialized = true;
        return adminInstance;
    }
}

module.exports = {
    admin: initializeFirebaseAdmin(),
    initializeFirebaseAdmin
};