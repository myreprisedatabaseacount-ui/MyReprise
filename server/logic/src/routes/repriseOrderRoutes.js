const express = require('express');
const { authenticateToken } = require('../middleware/authEnhanced');
const { createRepriseOrder } = require('../controllers/repriseOrderController');

const router = express.Router();

// Toutes les routes de reprise exigent l'authentification
router.post('/', authenticateToken, createRepriseOrder);

module.exports = router;


