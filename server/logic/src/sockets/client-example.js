/**
 * Exemple d'utilisation des sockets côté client
 * Ce fichier montre comment utiliser les sockets dans une application frontend
 */

// Import Socket.IO côté client
// import io from 'socket.io-client';

// Configuration de la connexion
const socket = io('http://localhost:3001', {
    withCredentials: true,
    // Optionnel: passer le token en query parameter si les cookies ne fonctionnent pas
    // query: {
    //     token: 'your-jwt-token-here'
    // }
});

// Événements de connexion
socket.on('connect', () => {
    console.log('🔌 Connecté au serveur de chat');
    console.log('Socket ID:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('🔌 Déconnecté du serveur:', reason);
});

// Événements de conversation
socket.on('conversation_joined', (data) => {
    console.log('✅ Conversation rejoint:', data);
    // Mettre à jour l'interface utilisateur
    updateConversationUI(data);
});

socket.on('user_joined', (data) => {
    console.log('👥 Utilisateur rejoint:', data);
    // Afficher une notification
    showNotification(`${data.user.email} a rejoint la conversation`);
});

socket.on('user_left', (data) => {
    console.log('👋 Utilisateur parti:', data);
    // Afficher une notification
    showNotification(`${data.user.email} a quitté la conversation`);
});

// Événements de messages
socket.on('new_message', (data) => {
    console.log('💬 Nouveau message:', data);
    // Ajouter le message à l'interface
    addMessageToUI(data.message);
});

socket.on('message_read', (data) => {
    console.log('👁️ Message lu:', data);
    // Mettre à jour l'état de lecture du message
    updateMessageReadStatus(data.messageId, data.userId);
});

// Événements d'erreur
socket.on('error', (error) => {
    console.error('❌ Erreur socket:', error);
    // Afficher l'erreur à l'utilisateur
    showError(error.message);
});

// Fonctions pour interagir avec les sockets

/**
 * Rejoindre une conversation
 * @param {number} conversationId - ID de la conversation
 */
function joinConversation(conversationId) {
    socket.emit('join_conversation', {
        conversationId: conversationId
    });
}

/**
 * Envoyer un message texte
 * @param {number} conversationId - ID de la conversation
 * @param {string} text - Contenu du message
 * @param {number} replyToMessageId - ID du message de réponse (optionnel)
 */
function sendTextMessage(conversationId, text, replyToMessageId = null) {
    socket.emit('send_message', {
        conversationId: conversationId,
        text: text,
        replyToMessageId: replyToMessageId
    });
}

/**
 * Envoyer un message audio
 * @param {number} conversationId - ID de la conversation
 * @param {string} audioUrl - URL de l'audio
 */
function sendAudioMessage(conversationId, audioUrl) {
    socket.emit('send_message', {
        conversationId: conversationId,
        audioUrl: audioUrl
    });
}

/**
 * Marquer un message comme lu
 * @param {number} messageId - ID du message
 */
function markMessageAsRead(messageId) {
    socket.emit('mark_message_read', {
        messageId: messageId
    });
}

/**
 * Quitter une conversation
 * @param {number} conversationId - ID de la conversation
 */
function leaveConversation(conversationId) {
    socket.emit('leave_conversation', {
        conversationId: conversationId
    });
}

// Fonctions d'interface utilisateur (à adapter selon votre framework)

function updateConversationUI(data) {
    // Mettre à jour l'interface avec les participants
    console.log('Participants:', data.participants);
}

function addMessageToUI(message) {
    // Ajouter le message à la liste des messages
    console.log('Ajouter message:', message);
}

function updateMessageReadStatus(messageId, userId) {
    // Mettre à jour l'état de lecture
    console.log('Message lu:', messageId, 'par:', userId);
}

function showNotification(message) {
    // Afficher une notification
    console.log('Notification:', message);
}

function showError(message) {
    // Afficher une erreur
    console.error('Erreur:', message);
}

// Exemple d'utilisation
// joinConversation(1);
// sendTextMessage(1, 'Salut tout le monde !');
// markMessageAsRead(123);

// Export des fonctions pour utilisation dans d'autres modules
// export {
//     joinConversation,
//     sendTextMessage,
//     sendAudioMessage,
//     markMessageAsRead,
//     leaveConversation
// };
