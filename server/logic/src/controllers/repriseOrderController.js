// Contrôleur de création d'une commande de reprise
// - Auth via middleware (req.user)
// - Validation et prévention XSS basique
// - Persistance Order + Snapshots en transaction
const db = require('../config/db');
const { Offer } = require('../models/Offer');
const { User } = require('../models/User');
const { Address } = require('../models/Address');
const { Order } = require('../models/Order');

function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

const createRepriseOrder = async (req, res) => {
  try {
    // req.user est injecté par authenticateToken (authEnhanced.js)
    const user = req.user;
    if (!user || !(user.userId || user.id)) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const { senderOfferId, receiverOfferId, differenceAmount, method, locationId } = req.body || {};

    // Validation
    if (!senderOfferId || !receiverOfferId) {
      return res.status(400).json({ error: 'senderOfferId et receiverOfferId sont requis' });
    }
    const diffAmountNum = Number(differenceAmount);
    if (!Number.isFinite(diffAmountNum) || diffAmountNum < 0) {
      return res.status(400).json({ error: 'differenceAmount doit être un nombre >= 0' });
    }
    if (!['delivery', 'pickup'].includes(method)) {
      return res.status(400).json({ error: 'method doit être delivery ou pickup' });
    }
    const locIdNum = locationId !== undefined && locationId !== null ? Number(locationId) : null;
    if (locIdNum !== null && (!Number.isInteger(locIdNum) || locIdNum <= 0)) {
      return res.status(400).json({ error: 'locationId invalide' });
    }

    const sequelize = db.getSequelize();
    const t = await sequelize.transaction();
    try {
      // Verrouiller les offres le temps des vérifications pour éviter les courses
      const senderOffer = await Offer.findByPk(Number(senderOfferId), { transaction: t, lock: t.LOCK.UPDATE });
      const receiverOffer = await Offer.findByPk(Number(receiverOfferId), { transaction: t, lock: t.LOCK.UPDATE });
      if (!senderOffer || !receiverOffer) {
        await t.rollback();
        return res.status(404).json({ error: 'Offre introuvable (sender ou receiver)' });
      }

      // Vérifier statut et non-suppression
      if (senderOffer.isDeleted || receiverOffer.isDeleted || senderOffer.status !== 'available' || receiverOffer.status !== 'available') {
        await t.rollback();
        return res.status(400).json({ error: 'Offre indisponible' });
      }

      // Vérifier que l’offre envoyée appartient à l’utilisateur courant
      if (senderOffer.sellerId !== (user.userId || user.id)) {
        await t.rollback();
        return res.status(403).json({ error: 'Vous ne possédez pas cette offre (senderOfferId)' });
      }

      // Refuser si les deux offres appartiennent au même utilisateur
      if (senderOffer.sellerId === receiverOffer.sellerId) {
        await t.rollback();
        return res.status(400).json({ error: 'Les deux offres appartiennent au même utilisateur' });
      }

      // Refuser si l'utilisateur tente de reprendre son propre produit (receiver)
      if (receiverOffer.sellerId === (user.userId || user.id)) {
        await t.rollback();
        return res.status(400).json({ error: 'Vous ne pouvez pas faire une reprise sur votre propre produit' });
      }

      const senderUser = await User.findByPk(senderOffer.sellerId, { transaction: t });
      const receiverUser = await User.findByPk(receiverOffer.sellerId, { transaction: t });
      if (!senderUser || !receiverUser) {
        await t.rollback();
        return res.status(404).json({ error: 'Utilisateur expéditeur ou destinataire introuvable' });
      }

      const senderPrice = Number(senderOffer.price) || 0;
      const receiverPrice = Number(receiverOffer.price) || 0;
      if (!Number.isFinite(senderPrice) || senderPrice <= 0 || !Number.isFinite(receiverPrice) || receiverPrice <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Prix d\'offre invalide' });
      }
      const baseDiff = senderPrice - receiverPrice;
      const cheaperUserId = baseDiff > 0 ? receiverOffer.sellerId : baseDiff < 0 ? senderOffer.sellerId : null;
      const balancePayerId = cheaperUserId; // Celui qui a le produit le moins cher paie

      // differenceAmount ne doit pas excéder la diff absolue si les prix diffèrent
      const absoluteDiff = Math.abs(baseDiff);
      if (absoluteDiff === 0 && diffAmountNum !== 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Aucune différence autorisée entre des produits de même valeur' });
      }
      if (diffAmountNum > absoluteDiff) {
        await t.rollback();
        return res.status(400).json({ error: 'differenceAmount dépasse la différence maximale autorisée' });
      }

      // Si locationId fourni, vérifier qu\'il existe
      if (locIdNum) {
        const addr = await Address.findByPk(locIdNum, { transaction: t });
        if (!addr) {
          await t.rollback();
          return res.status(404).json({ error: 'Adresse introuvable' });
        }
      }

      const newOrder = await Order.create({
        balanceAmount: diffAmountNum,
        balancePayerId: balancePayerId || null,
        status: 'pending',
        notes: null
      }, { transaction: t });

      const UserSnapshot = sequelize.models.UserSnapshot;
      const ProductSnapshot = sequelize.models.ProductSnapshot;

      // User snapshots
      await UserSnapshot.create({
        orderId: newOrder.id,
        name: sanitizeString(`${senderUser.firstName || ''} ${senderUser.lastName || ''}`.trim()),
        email: sanitizeString(senderUser.email || ''),
        phone: sanitizeString(senderUser.phone || ''),
        isSender: true,
        addressId: locIdNum,
        userId: senderUser.id
      }, { transaction: t });

      await UserSnapshot.create({
        orderId: newOrder.id,
        name: sanitizeString(`${receiverUser.firstName || ''} ${receiverUser.lastName || ''}`.trim()),
        email: sanitizeString(receiverUser.email || ''),
        phone: sanitizeString(receiverUser.phone || ''),
        isSender: false,
        addressId: locIdNum,
        userId: receiverUser.id
      }, { transaction: t });

      // Product snapshots
      await ProductSnapshot.create({
        orderId: newOrder.id,
        offerId: senderOffer.id,
        title: sanitizeString(senderOffer.title || ''),
        price: Number(senderOffer.price) || 0,
        description: sanitizeString(senderOffer.description || ''),
        productCondition: senderOffer.productCondition || 'good',
        isFromProduct: true
      }, { transaction: t });

      await ProductSnapshot.create({
        orderId: newOrder.id,
        offerId: receiverOffer.id,
        title: sanitizeString(receiverOffer.title || ''),
        price: Number(receiverOffer.price) || 0,
        description: sanitizeString(receiverOffer.description || ''),
        productCondition: receiverOffer.productCondition || 'good',
        isFromProduct: true
      }, { transaction: t });

      await t.commit();

      return res.status(201).json({
        success: true,
        data: {
          order: newOrder.getPublicData ? newOrder.getPublicData() : {
            id: newOrder.id,
            balanceAmount: Number(newOrder.balanceAmount),
            balancePayerId: newOrder.balancePayerId,
            status: newOrder.status
          },
          balanceLogic: {
            senderPrice,
            receiverPrice,
            cheaperUserId: cheaperUserId,
          }
        },
        message: 'Commande de reprise créée avec snapshots'
      });
    } catch (innerError) {
      try { await t.rollback(); } catch {}
      console.error('❌ createRepriseOrder tx error:', innerError);
      return res.status(500).json({ error: 'Erreur interne', details: innerError.message || 'Erreur inconnue' });
    }
  } catch (error) {
    console.error('❌ createRepriseOrder error:', error);
    return res.status(500).json({ error: 'Erreur interne', details: error.message || 'Erreur inconnue' });
  }
};

module.exports = { createRepriseOrder };


