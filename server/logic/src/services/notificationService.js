const { admin } = require('../config/firebaseAdmin');
const db = require('../config/db');
const { Notification } = require('../models/Notification');
const { UserDevice } = require('../models/UserDevice');

async function registerDeviceToken(userId, fcmToken, platform = 'web', deviceInfo = {}) {
	if (!userId || !fcmToken) {
		throw new Error('userId et fcmToken sont requis');
	}

	const transaction = await db.beginTransaction();
	try {
		// Désactiver l'ancien enregistrement si le token existe déjà pour un autre user
		await UserDevice.update({ is_active: false }, { where: { fcm_token: fcmToken }, transaction });

		// Upsert par (user_id, fcm_token)
		const [record] = await UserDevice.findOrCreate({
			where: { fcm_token: fcmToken },
			defaults: { user_id: userId, fcm_token: fcmToken, platform, device_info: deviceInfo },
			transaction
		});

		if (record.user_id !== userId || record.platform !== platform) {
			await record.update({ user_id: userId, platform, device_info: deviceInfo, is_active: true }, { transaction });
		}

		await db.commitTransaction(transaction);
		return record;
	} catch (error) {
		await db.rollbackTransaction(transaction);
		throw error;
	}
}

// Envoie une notification FCM à un utilisateur et la sauvegarde en base
async function sendAndStoreNotification(userId, payload) {
	if (!userId) throw new Error('userId requis');
	if (!payload || !payload.title || !payload.body) throw new Error('payload {title, body} requis');

	// Créer l'enregistrement en "pending"
	const notif = await Notification.create({
		user_id: userId,
		title: payload.title,
		body: payload.body,
		data: payload.data || null,
		status: 'pending'
	});

	try {
		// Récupérer les tokens actifs de l'utilisateur
		const devices = await UserDevice.findAll({ where: { user_id: userId, is_active: true } });
		const tokens = devices.map(d => d.fcm_token).filter(Boolean);

		if (tokens.length === 0) {
			await notif.update({ status: 'failed', error_message: 'Aucun token FCM actif' });
			return notif;
		}

		// Préparer le message multicast
		const message = {
			notification: { title: payload.title, body: payload.body },
			data: payload.data ? Object.entries(payload.data).reduce((acc, [k, v]) => { acc[String(k)] = String(v); return acc; }, {}) : undefined,
			tokens
		};

		const response = await admin.messaging().sendEachForMulticast(message);

		const successCount = response.successCount || 0;
		const failureCount = response.failureCount || 0;
		let errorMsg = null;

		// Désactiver les tokens invalides
		if (response.responses && Array.isArray(response.responses)) {
			for (let i = 0; i < response.responses.length; i++) {
				const r = response.responses[i];
				if (!r.success) {
					const token = tokens[i];
					const code = r.error && r.error.code;
					if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
						await UserDevice.update({ is_active: false }, { where: { fcm_token: token } });
					}
				}
			}
		}

		await notif.update({
			status: failureCount === 0 && successCount > 0 ? 'sent' : (successCount > 0 ? 'sent' : 'failed'),
			provider_message_id: `multicast:${Date.now()}`,
			error_message: failureCount > 0 ? `Echecs: ${failureCount}` : null
		});

		return notif;
	} catch (error) {
		await notif.update({ status: 'failed', error_message: error.message });
		throw error;
	}
}

module.exports = {
	registerDeviceToken,
	sendAndStoreNotification
};


