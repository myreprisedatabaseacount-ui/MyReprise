# Modèles de Conversation

Ce document décrit les nouveaux modèles ajoutés pour gérer le système de conversation et de négociation.

## Modèles Créés

### 1. Conversation
**Table:** `conversations`

Gère les conversations entre utilisateurs.

**Champs:**
- `id` (INTEGER, PK, AUTO_INCREMENT)
- `type` (ENUM: 'chat', 'negotiation') - Type de conversation
- `created_at` (DATE) - Date de création
- `updated_at` (DATE) - Date de dernière modification

**Index:**
- `type`
- `created_at`

### 2. Message
**Table:** `messages`

Stocke les messages dans les conversations.

**Champs:**
- `id` (INTEGER, PK, AUTO_INCREMENT)
- `conversation_id` (INTEGER, FK) - Référence vers Conversation
- `sender_id` (INTEGER, FK) - Référence vers User (expéditeur)
- `text` (TEXT) - Contenu textuel du message (max 5000 caractères)
- `audio_url` (STRING) - URL du fichier audio (optionnel)
- `reply_to_message_id` (INTEGER, FK) - Référence vers Message (réponse)
- `is_deleted` (BOOLEAN) - Message supprimé ou non
- `is_edited` (BOOLEAN) - Message modifié ou non
- `offer_id` (INTEGER, FK) - Référence vers Offer (optionnel)
- `created_at` (DATE) - Date de création
- `updated_at` (DATE) - Date de dernière modification

**Index:**
- `conversation_id`
- `sender_id`
- `reply_to_message_id`
- `offer_id`
- `created_at`
- `is_deleted`

### 3. Delta
**Table:** `deltas`

Gère les négociations de prix dans les conversations.

**Champs:**
- `id` (INTEGER, PK, AUTO_INCREMENT)
- `offer_id` (INTEGER, FK) - Référence vers Offer
- `sender_id` (INTEGER, FK) - Référence vers User (expéditeur)
- `receiver_id` (INTEGER, FK) - Référence vers User (destinataire)
- `conversation_id` (INTEGER, FK) - Référence vers Conversation
- `order_id` (INTEGER, FK) - Référence vers Order (optionnel)
- `price` (DECIMAL(10,2)) - Prix proposé
- `is_accepted` (BOOLEAN) - Proposition acceptée ou non
- `created_at` (DATE) - Date de création
- `updated_at` (DATE) - Date de dernière modification

**Index:**
- `offer_id`
- `sender_id`
- `receiver_id`
- `conversation_id`
- `order_id`
- `is_accepted`
- `created_at`

### 4. ConversationParticipants
**Table:** `conversation_participants`

Gère les participants aux conversations.

**Champs:**
- `id` (INTEGER, PK, AUTO_INCREMENT)
- `conversation_id` (INTEGER, FK) - Référence vers Conversation
- `user_id` (INTEGER, FK) - Référence vers User
- `joined_at` (DATE) - Date d'adhésion
- `left_at` (DATE) - Date de départ (optionnel)
- `blocked_conversation` (BOOLEAN) - Conversation bloquée par l'utilisateur
- `role` (ENUM: 'admin', 'membre') - Rôle dans la conversation
- `created_at` (DATE) - Date de création
- `updated_at` (DATE) - Date de dernière modification

**Index:**
- `conversation_id`
- `user_id`
- `role`
- `blocked_conversation`
- `joined_at`
- UNIQUE(`conversation_id`, `user_id`)

### 5. MessageReads
**Table:** `message_reads`

Suit les lectures des messages par les utilisateurs.

**Champs:**
- `id` (INTEGER, PK, AUTO_INCREMENT)
- `message_id` (INTEGER, FK) - Référence vers Message
- `user_id` (INTEGER, FK) - Référence vers User
- `read_at` (DATE) - Date de lecture
- `created_at` (DATE) - Date de création
- `updated_at` (DATE) - Date de dernière modification

**Index:**
- `message_id`
- `user_id`
- `read_at`
- UNIQUE(`message_id`, `user_id`)

## Associations

### Conversation
- `hasMany` Message (via `conversation_id`)
- `hasMany` Delta (via `conversation_id`)
- `hasMany` ConversationParticipants (via `conversation_id`)

### Message
- `belongsTo` Conversation (via `conversation_id`)
- `belongsTo` User/Sender (via `sender_id`)
- `belongsTo` Message/ReplyToMessage (via `reply_to_message_id`)
- `belongsTo` Offer (via `offer_id`)
- `hasMany` Message/Replies (via `reply_to_message_id`)
- `hasMany` MessageReads (via `message_id`)

### Delta
- `belongsTo` Offer (via `offer_id`)
- `belongsTo` User/Sender (via `sender_id`)
- `belongsTo` User/Receiver (via `receiver_id`)
- `belongsTo` Conversation (via `conversation_id`)
- `belongsTo` Order (via `order_id`)

### ConversationParticipants
- `belongsTo` Conversation (via `conversation_id`)
- `belongsTo` User (via `user_id`)

### MessageReads
- `belongsTo` Message (via `message_id`)
- `belongsTo` User (via `user_id`)

### User (associations ajoutées)
- `hasMany` SentMessages (via `sender_id`)
- `hasMany` SentDeltas (via `sender_id`)
- `hasMany` ReceivedDeltas (via `receiver_id`)
- `hasMany` ConversationParticipations (via `user_id`)
- `hasMany` MessageReads (via `user_id`)

### Offer (associations ajoutées)
- `hasMany` Messages (via `offer_id`)
- `hasMany` Deltas (via `offer_id`)

### Order (associations ajoutées)
- `hasMany` Deltas (via `order_id`)

## Utilisation

Ces modèles permettent de gérer :
1. **Conversations** : Chat simple ou négociations
2. **Messages** : Texte, audio, réponses, liens vers offres
3. **Négociations** : Propositions de prix avec acceptation
4. **Participants** : Gestion des membres et rôles
5. **Lectures** : Suivi des messages lus

## Exemples d'utilisation

```javascript
// Créer une conversation de négociation
const conversation = await Conversation.create({
  type: 'negotiation'
});

// Ajouter des participants
await ConversationParticipants.bulkCreate([
  { conversation_id: conversation.id, user_id: user1.id, role: 'admin' },
  { conversation_id: conversation.id, user_id: user2.id, role: 'membre' }
]);

// Envoyer un message
const message = await Message.create({
  conversation_id: conversation.id,
  sender_id: user1.id,
  text: 'Bonjour, je suis intéressé par votre offre',
  offer_id: offer.id
});

// Proposer un prix
const delta = await Delta.create({
  offer_id: offer.id,
  sender_id: user1.id,
  receiver_id: user2.id,
  conversation_id: conversation.id,
  price: 150.00
});

// Marquer un message comme lu
await MessageReads.create({
  message_id: message.id,
  user_id: user2.id
});
```
