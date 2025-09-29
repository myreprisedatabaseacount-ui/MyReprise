const express = require('express');
const { authenticateToken } = require('../middleware/authEnhanced');
const { createRepriseOrder, listReceivedOrdersOnMyOffers, getOrderDetails, getNegotiationInitByOrderId, listSendedOrdersOnMyOffers } = require('../controllers/repriseOrderController');

const router = express.Router();

// Toutes les routes de reprise exigent l'authentification
router.post('/', authenticateToken, createRepriseOrder);
router.get('/received-orders-on-my-offers', authenticateToken, listReceivedOrdersOnMyOffers);
router.get('/order-details', authenticateToken, getOrderDetails);
router.get('/sended-orders-on-my-offers', authenticateToken, listSendedOrdersOnMyOffers);
router.get('/negotiation-init/:orderId', authenticateToken, getNegotiationInitByOrderId);

module.exports = router;


