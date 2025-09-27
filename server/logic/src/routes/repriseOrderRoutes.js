const express = require('express');
const { authenticateToken } = require('../middleware/authEnhanced');
const { createRepriseOrder, listReceivedOrdersOnMyOffers, getOrderDetails, getNegotiationInitByOrderId } = require('../controllers/repriseOrderController');

const router = express.Router();

// Toutes les routes de reprise exigent l'authentification
router.post('/', authenticateToken, createRepriseOrder);
router.get('/received-orders-on-my-offers', authenticateToken, listReceivedOrdersOnMyOffers);
router.get('/order-details', authenticateToken, getOrderDetails);
router.get('/negotiation-init/:orderId', authenticateToken, getNegotiationInitByOrderId);

module.exports = router;


