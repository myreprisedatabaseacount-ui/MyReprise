# Configuration des Sockets - MyReprise

## Vue d'ensemble

Ce module implémente un système de chat en temps réel sécurisé utilisant Socket.IO. Il supporte les conversations de groupe avec authentification JWT et gestion des permissions.

## Architecture

```
src/sockets/
├── index.js              # Configuration principale des sockets
├── client-example.js     # Exemple d'utilisation côté client
└── README.md            # Documentation

src/services/
├── conversationService.js # Gestion des conversations
└── messageService.js     # Gestion des messages

src/middleware/
└── socketAuth.js         # Authentification pour les sockets
```

## Fonctionnalités

### 🔐 Sécurité
- Authentification JWT obligatoire
- Vérification des permissions par conversation
- Isolation des groupes de chat
- Protection contre l'accès non autorisé

### 💬 Chat en temps réel
- Messages texte et audio
- Réponses aux messages
- Statut de lecture
- Notifications de présence

### 👥 Gestion des groupes
- Conversations multi-utilisateurs
- Rôles (admin, membre)
- Gestion des participants
- Blocage de conversations

## Endpoints Socket

### 1. `join_conversation`
Rejoindre une conversation existante.

**Émission:**
```javascript
socket.emit('join_conversation', {
    conversationId: 123
});
```

**Réception:**
```javascript
socket.on('conversation_joined', (data) => {
    console.log(data);
    // {
    //     conversationId: 123,
    //     message: "Vous avez rejoint la conversation",
    //     participants: [...]
    // }
});
```

### 2. `send_message`
Envoyer un message dans une conversation.

**Émission:**
```javascript
// Message texte
socket.emit('send_message', {
    conversationId: 123,
    text: "Salut tout le monde !"
});

// Message audio
socket.emit('send_message', {
    conversationId: 123,
    audioUrl: "https://example.com/audio.mp3"
});

// Réponse à un message
socket.emit('send_message', {
    conversationId: 123,
    text: "Merci pour l'info !",
    replyToMessageId: 456
});
```

**Réception:**
```javascript
socket.on('new_message', (data) => {
    console.log(data);
    // {
    //     conversationId: 123,
    //     message: {
    //         id: 789,
    //         text: "Salut tout le monde !",
    //         sender: { id: 1, email: "user@example.com" },
    //         createdAt: "2024-01-01T12:00:00Z",
    //         ...
    //     }
    // }
});
```

### 3. `mark_message_read`
Marquer un message comme lu.

**Émission:**
```javascript
socket.emit('mark_message_read', {
    messageId: 789
});
```

### 4. `leave_conversation`
Quitter une conversation.

**Émission:**
```javascript
socket.emit('leave_conversation', {
    conversationId: 123
});
```

## Événements de notification

### Présence des utilisateurs
```javascript
// Utilisateur rejoint
socket.on('user_joined', (data) => {
    console.log(`${data.user.email} a rejoint la conversation`);
});

// Utilisateur quitte
socket.on('user_left', (data) => {
    console.log(`${data.user.email} a quitté la conversation`);
});
```

### Statut de lecture
```javascript
socket.on('message_read', (data) => {
    console.log(`Message ${data.messageId} lu par utilisateur ${data.userId}`);
});
```

### Gestion des erreurs
```javascript
socket.on('error', (error) => {
    console.error('Erreur:', error.message);
});
```

## Configuration côté client

### Installation
```bash
npm install socket.io-client
```

### Connexion
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
    withCredentials: true
});
```

### Authentification
Le token JWT est automatiquement récupéré depuis les cookies. Si nécessaire, vous pouvez le passer en query parameter :

```javascript
const socket = io('http://localhost:3001', {
    withCredentials: true,
    query: {
        token: 'your-jwt-token'
    }
});
```

## Base de données

### Tables utilisées
- `conversations` - Conversations
- `conversation_participants` - Participants aux conversations
- `messages` - Messages
- `message_reads` - Statut de lecture des messages
- `users` - Utilisateurs

### Relations
- Une conversation a plusieurs participants
- Un message appartient à une conversation et un expéditeur
- Un message peut être une réponse à un autre message
- Les lectures sont tracées par utilisateur et message

## Sécurité

### Authentification
- Middleware `authenticateSocket` vérifie le JWT
- Token récupéré depuis les cookies ou query parameters
- Vérification de l'existence de l'utilisateur

### Autorisation
- Vérification des permissions avant chaque action
- Seuls les participants peuvent accéder aux conversations
- Isolation des rooms Socket.IO par conversation

### Validation
- Validation des données d'entrée
- Gestion des erreurs avec messages explicites
- Logging des actions importantes

## Exemple d'utilisation complète

```javascript
// Connexion
const socket = io('http://localhost:3001', {
    withCredentials: true
});

// Écouter les événements
socket.on('connect', () => {
    console.log('Connecté !');
    
    // Rejoindre une conversation
    socket.emit('join_conversation', { conversationId: 1 });
});

socket.on('conversation_joined', (data) => {
    console.log('Conversation rejoint:', data);
});

socket.on('new_message', (data) => {
    // Afficher le nouveau message
    displayMessage(data.message);
});

// Envoyer un message
function sendMessage(text) {
    socket.emit('send_message', {
        conversationId: 1,
        text: text
    });
}
```

## Logs et monitoring

Le système génère des logs détaillés pour :
- Connexions/déconnexions des utilisateurs
- Rejoindre/quitter des conversations
- Envoi de messages
- Erreurs d'authentification
- Erreurs de permissions

## Déploiement

Les sockets utilisent le même port que le serveur Express (3001 par défaut). Aucune configuration supplémentaire n'est nécessaire pour le déploiement.
