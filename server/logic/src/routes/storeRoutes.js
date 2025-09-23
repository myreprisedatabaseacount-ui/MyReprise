const express = require('express');
const { getStoreByUser, getStoreInfo, updateStore, createStore } = require('../controllers/storeController');

const storeRoutes = express.Router();

// GET /api/stores/user/:userId - Récupérer le store d'un utilisateur
storeRoutes.get('/:userId', getStoreByUser);

// GET /api/stores/user/:userId/info - Récupérer les informations complètes du store
storeRoutes.get('/:userId/info', getStoreInfo);

// PUT /api/stores/user/:userId - Mettre à jour le store
storeRoutes.put('/:userId', updateStore);

// POST /api/stores - Créer un nouveau store
storeRoutes.post('/', createStore);

module.exports = storeRoutes;
