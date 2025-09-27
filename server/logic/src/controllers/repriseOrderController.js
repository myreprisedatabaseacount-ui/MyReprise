const db = require('../config/db');
const { Offer } = require('../models/Offer');
const { User } = require('../models/User');
const { Address } = require('../models/Address');
const { Order } = require('../models/Order');
const { UserSnapshot } = require('../models/UserSnapshot');
const { ProductSnapshot } = require('../models/ProductSnapshot');
const sequelize = db.getSequelize();
const { Op } = db.Sequelize;
const OfferImage = sequelize.models.OfferImage;

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

/**
 * Liste les commandes reçues sur les offres de l'utilisateur connecté.
 * - Utilise req.user (middleware d'auth) pour récupérer l'id utilisateur
 * - Ne retourne que les commandes où l'utilisateur est destinataire (is_sender = 0)
 * - Agrège par offre (offer) et trie les groupes par date de commande la plus récente
 * - Compare ProductSnapshot avec l'offre et UserSnapshot avec l'utilisateur courant
 * - Implémente la pagination (page, limit) sur les offres de l'utilisateur
 */
const listReceivedOrdersOnMyOffers = async (req, res) => {
  try {
    const user = req.user;
    const currentUserId = user?.userId || user?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    // Pagination
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const offset = (page - 1) * limit;

    // 1) Récupérer d'abord les orders IDs reçus (pas envoyés) pour l'utilisateur via Sequelize
    const receivedSnapshots = await UserSnapshot.findAll({
      where: { userId: currentUserId, isSender: false },
      attributes: ['orderId'],
      group: ['order_id'],
      raw: true
    });
    const receivedOrderIds = receivedSnapshots.map(r => r.orderId);
    if (receivedOrderIds.length === 0) {
      return res.status(200).json({
        success: true,
        pagination: { page, limit, totalOffers: 0, offersReturned: 0 },
        data: []
      });
    }

    // 2) Récupérer les couples (orderId, offerId) pour ces orders via ProductSnapshot
    const psRows = await ProductSnapshot.findAll({
      where: { orderId: { [Op.in]: receivedOrderIds } },
      attributes: ['orderId', 'offerId', 'price', 'title'],
      raw: true
    });

    if (!psRows || psRows.length === 0) {
      return res.status(200).json({
        success: true,
        pagination: { page, limit, totalOffers: 0, offersReturned: 0 },
        data: []
      });
    }

    // 3) Offres concernées par ces commandes et appartenant à l'utilisateur
    const offerIdsFromSnapshots = [...new Set(psRows.map(r => r.offerId))];
    const offersForUser = await Offer.findAll({
      where: { id: { [Op.in]: offerIdsFromSnapshots }, sellerId: currentUserId, isDeleted: false },
      attributes: ['id', 'price', 'title', 'description', 'productCondition', 'sellerId', 'status', 'createdAt']
    });
    if (!offersForUser.length) {
      return res.status(200).json({
        success: true,
        pagination: { page, limit, totalOffers: 0, offersReturned: 0 },
        data: []
      });
    }

    // 4) Charger les images des offres concernées en une requête
    // Préparer les offerIds de l'utilisateur et des autres participants
    const myOfferIds = offersForUser.map(o => o.id);
    const offerImages = await OfferImage.findAll({
      where: { offerId: { [Op.in]: myOfferIds } },
      attributes: ['offerId', 'imageUrl', 'isMain'],
      raw: true
    });
    const offerIdToImages = new Map();
    for (const img of offerImages) {
      const arr = offerIdToImages.get(img.offerId) || [];
      arr.push(img);
      offerIdToImages.set(img.offerId, arr);
    }

    // 5) Charger aussi les offres de l'autre partie (non miennes) pour enrichir l'affichage
    const otherOfferIds = [...new Set(psRows.map(r => r.offerId).filter(id => !myOfferIds.includes(id)))];
    let otherOffers = [];
    if (otherOfferIds.length) {
      otherOffers = await Offer.findAll({
        where: { id: { [Op.in]: otherOfferIds }, isDeleted: false },
        attributes: ['id', 'price', 'title', 'description', 'productCondition', 'sellerId', 'status', 'createdAt']
      });
      const otherImages = await OfferImage.findAll({
        where: { offerId: { [Op.in]: otherOfferIds } },
        attributes: ['offerId', 'imageUrl', 'isMain'],
        raw: true
      });
      for (const img of otherImages) {
        const arr = offerIdToImages.get(img.offerId) || [];
        arr.push(img);
        offerIdToImages.set(img.offerId, arr);
      }
    }

    // 6) Charger les Orders correspondants en un seul appel
    const filteredOrderIds = [...new Set(psRows.map(r => r.orderId))];

    const orders = await Order.findAll({
      where: { id: { [Op.in]: filteredOrderIds } },
      order: [['created_at', 'DESC']]
    });
    const orderIdToOrder = new Map(orders.map(o => [o.id, o]));
    const completedOrderIds = new Set(orders.filter(o => o.status === 'completed').map(o => o.id));

    // 7) Charger les UserSnapshots (destinataire = current user) pour ces orders
    const usRows = await UserSnapshot.findAll({
      where: { userId: currentUserId, isSender: false, orderId: { [Op.in]: filteredOrderIds } },
      attributes: ['orderId', 'name', 'email', 'phone'],
      raw: true
    });
    const orderIdToUserSnap = new Map(usRows.map(r => [r.orderId, r]));

    // 7bis) Charger les UserSnapshots du sender et leurs Users (pour avatar)
    const senderSnapshots = await UserSnapshot.findAll({
      where: { isSender: true, orderId: { [Op.in]: filteredOrderIds } },
      attributes: ['orderId', 'userId', 'name', 'email', 'phone'],
      raw: true
    });
    const orderIdToSenderSnap = new Map(senderSnapshots.map(r => [r.orderId, r]));
    const senderUserIds = [...new Set(senderSnapshots.map(s => s.userId).filter(Boolean))];
    let senderUsers = [];
    if (senderUserIds.length) {
      senderUsers = await User.findAll({ where: { id: { [Op.in]: senderUserIds } }, attributes: ['id', 'profileImage'] });
    }
    const senderIdToUser = new Map(senderUsers.map(u => [u.id, u]));

    // Compter le nombre de commandes réussies (status = 'completed') par expéditeur sans dépendre d'une association
    const completedBySenderId = new Map();
    if (senderSnapshots.length) {
      for (const snap of senderSnapshots) {
        if (completedOrderIds.has(snap.orderId)) {
          completedBySenderId.set(snap.userId, (completedBySenderId.get(snap.userId) || 0) + 1);
        }
      }
    }

    // 8) Charger l'utilisateur courant (pour comparaison nom/email)
    const currentUser = await User.findByPk(currentUserId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage', 'isVerified']
    });
    const currentFullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();
    const currentEmail = (currentUser?.email || '').trim().toLowerCase();

    // 9) Mise en forme groupée par offre
    const offerIdToOffer = new Map([...offersForUser, ...otherOffers].map(o => [o.id, o]));
    const orderIdToSnapshots = new Map();
    for (const snap of psRows) {
      const arr = orderIdToSnapshots.get(snap.orderId) || [];
      arr.push(snap);
      orderIdToSnapshots.set(snap.orderId, arr);
    }
    const groups = new Map(); // offerId -> { offer, orders: [], latestOrderAt }

    for (const row of psRows) {
      // Ne considérer ici que les snapshots correspondant à MES offres
      if (!myOfferIds.includes(row.offerId)) continue;
      const offer = offerIdToOffer.get(row.offerId);
      const order = orderIdToOrder.get(row.orderId);
      if (!offer || !order) continue;

      const offerPublic = typeof offer.getPublicData === 'function' ? offer.getPublicData() : {
        id: offer.id,
        price: parseFloat(offer.price),
        title: offer.title,
        description: offer.description,
        productCondition: offer.productCondition,
        status: offer.status,
        createdAt: offer.createdAt
      };
      // Ajouter info vendeur (utilisateur courant)
      offerPublic.seller = {
        id: currentUser?.id || currentUserId,
        name: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
        avatar: currentUser?.profileImage || null,
        verified: !!currentUser?.isVerified
      };

      // Ajouter images de l'offre (principale + liste)
      const imgs = offerIdToImages.get(offer.id) || [];
      const mainImage = imgs.find(i => i.isMain) || imgs[0] || null;
      if (mainImage) {
        offerPublic.mainImageUrl = mainImage.imageUrl;
      }
      if (imgs.length) {
        offerPublic.images = imgs.map(i => i.imageUrl);
      }

      // Comparaison ProductSnapshot vs Offer
      const priceChanged = Number(row.price) !== Number(offer.price);
      const titleChanged = (row.title || '').trim() !== (offer.title || '').trim();
      const productChanges = priceChanged ? {
        priceChanged: true,
        snapshotPrice: Number(row.price),
        currentPrice: Number(offer.price)
      } : null;
      const finalProductChanges = (priceChanged || titleChanged) ? {
        ...(productChanges || {}),
        ...(titleChanged ? { titleChanged: true, snapshotTitle: row.title, currentTitle: offer.title } : {})
      } : null;

      // Comparaison UserSnapshot vs User courant
      const us = orderIdToUserSnap.get(row.orderId);
      let userChanges = null;
      if (us) {
        const snapName = (us.name || '').trim();
        const snapEmail = (us.email || '').trim().toLowerCase();
        if (snapName && snapName !== currentFullName) {
          userChanges = { ...(userChanges || {}), nameUpdated: snapName };
        }
        if (snapEmail && snapEmail !== currentEmail) {
          userChanges = { ...(userChanges || {}), emailUpdated: snapEmail };
        }
      }

      const orderPublic = typeof order.getPublicData === 'function' ? order.getPublicData() : {
        id: order.id,
        balanceAmount: Number(order.balanceAmount),
        balancePayerId: order.balancePayerId,
        status: order.status,
        createdAt: order.createdAt
      };

      const existing = groups.get(row.offerId) || {
        offer: offerPublic,
        orders: [],
        latestOrderAt: null
      };

      // Déterminer la snapshot du produit de l'autre utilisateur et ses infos
      const snapsForOrder = orderIdToSnapshots.get(row.orderId) || [];
      const otherSnap = snapsForOrder.find(s => s.offerId !== row.offerId) || null;
      let otherOfferPublic = null;
      if (otherSnap) {
        const otherOffer = offerIdToOffer.get(otherSnap.offerId);
        if (otherOffer) {
          otherOfferPublic = typeof otherOffer.getPublicData === 'function' ? otherOffer.getPublicData() : {
            id: otherOffer.id,
            price: parseFloat(otherOffer.price),
            title: otherOffer.title,
            description: otherOffer.description,
            productCondition: otherOffer.productCondition,
            status: otherOffer.status,
            createdAt: otherOffer.createdAt
          };
          const imgs2 = offerIdToImages.get(otherOffer.id) || [];
          const main2 = imgs2.find(i => i.isMain) || imgs2[0] || null;
          if (main2) otherOfferPublic.mainImageUrl = main2.imageUrl;
          if (imgs2.length) otherOfferPublic.images = imgs2.map(i => i.imageUrl);
        }
      }

      const recipient = us ? { name: us.name, email: us.email, phone: us.phone } : null;
      const senderSnap = orderIdToSenderSnap.get(row.orderId) || null;
      const senderUser = senderSnap ? senderIdToUser.get(senderSnap.userId) : null;
      const sender = senderSnap ? {
        userId: senderSnap.userId,
        name: senderSnap.name,
        email: senderSnap.email,
        phone: senderSnap.phone,
        profileImage: senderUser?.profileImage || null,
        completedOrdersCount: completedBySenderId.get(senderSnap.userId) || 0
      } : null;

      const senderProductSnapshot = otherSnap ? { title: otherSnap.title, price: Number(otherSnap.price) } : null;

      existing.orders.push({ 
        order: orderPublic, 
        productChanges: finalProductChanges, 
        userChanges, 
        recipient, 
        sender, 
        senderOffer: otherOfferPublic,
        senderProductSnapshot
      });
      if (!existing.latestOrderAt || new Date(order.createdAt) > new Date(existing.latestOrderAt)) {
        existing.latestOrderAt = order.createdAt;
      }
      groups.set(row.offerId, existing);
    }

    // 8) Transformer en tableau et trier par latestOrderAt DESC
    const groupedArray = Array.from(groups.values()).sort((a, b) => {
      return new Date(b.latestOrderAt) - new Date(a.latestOrderAt);
    });

    // 9) Appliquer la pagination sur les offres qui ont des commandes
    const totalOffersWithOrders = groupedArray.length;
    const paginated = groupedArray.slice(offset, offset + limit);

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalOffers: totalOffersWithOrders,
        offersReturned: paginated.length
      },
      data: paginated
    });
  } catch (error) {
    console.error('❌ listReceivedOrdersOnMyOffers error:', error);
    return res.status(500).json({ error: 'Erreur interne', details: error.message || 'Erreur inconnue' });
  }
};

/**
 * Détails des commandes avec filtres:
 * - Filtrer par produit (offerId) et mois (YYYY-MM)
 * - Ou par expéditeur vers moi (senderId)
 * Retourne aussi isOrderSender et isProductOwner par rapport à req.user
 */
const getOrderDetails = async (req, res) => {
  try {
    const user = req.user;
    const currentUserId = user?.userId || user?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const { offerId, month, senderId, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * limitNum;

    // Construire le filtre d'orders via ProductSnapshot/UserSnapshot
    const wherePs = {};
    if (offerId) {
      wherePs.offerId = Number(offerId);
    }
    const whereUs = {};
    if (senderId) {
      whereUs.userId = Number(senderId);
      whereUs.isSender = true;
    }

    let candidateOrderIds = null;
    if (offerId) {
      const rows = await ProductSnapshot.findAll({ attributes: ['orderId'], where: wherePs, raw: true });
      candidateOrderIds = [...new Set(rows.map(r => r.orderId))];
    }
    if (senderId) {
      const rows = await UserSnapshot.findAll({ attributes: ['orderId'], where: whereUs, raw: true });
      const ids = [...new Set(rows.map(r => r.orderId))];
      candidateOrderIds = candidateOrderIds ? candidateOrderIds.filter(id => ids.includes(id)) : ids;
    }

    const orderWhere = {};
    if (candidateOrderIds) {
      orderWhere.id = { [Op.in]: candidateOrderIds };
    }
    if (month) {
      // month format: YYYY-MM
      const [y, m] = String(month).split('-').map(n => parseInt(n, 10));
      if (y && m && m >= 1 && m <= 12) {
        const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
        const end = new Date(Date.UTC(y, m, 0, 23, 59, 59));
        orderWhere.createdAt = { [Op.between]: [start, end] };
      }
    }

    const orders = await Order.findAll({
      where: orderWhere,
      order: [['created_at', 'DESC']],
      offset,
      limit: limitNum
    });

    const orderIds = orders.map(o => o.id);
    if (orderIds.length === 0) {
      return res.status(200).json({ success: true, pagination: { page: pageNum, limit: limitNum, total: 0 }, data: [] });
    }

    // Snapshots associés
    const ps = await ProductSnapshot.findAll({ where: { orderId: { [Op.in]: orderIds } }, raw: true });
    const us = await UserSnapshot.findAll({ where: { orderId: { [Op.in]: orderIds } }, raw: true });

    // Offres et utilisateurs liés
    const offerIds = [...new Set(ps.map(r => r.offerId))];
    const offers = await Offer.findAll({ where: { id: { [Op.in]: offerIds } }, attributes: ['id','sellerId','title','price','productCondition','description','createdAt'] });
    const offerIdToOffer = new Map(offers.map(o => [o.id, o]));
    // Charger les images principales des offres
    if (offerIds.length && OfferImage) {
      const imgs = await OfferImage.findAll({ where: { offerId: { [Op.in]: offerIds } }, attributes: ['offerId','imageUrl','isMain'], raw: true });
      const mainByOffer = new Map();
      for (const img of imgs) {
        const current = mainByOffer.get(img.offerId);
        if (!current || img.isMain) {
          mainByOffer.set(img.offerId, img.imageUrl);
        }
      }
      // Annoter une propriété non persistée
      for (const [oid, offer] of offerIdToOffer.entries()) {
        offer.mainImageUrl = mainByOffer.get(oid) || null;
      }
    }

    const userIds = [...new Set(us.map(r => r.userId).filter(Boolean))];
    const users = await User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id','firstName','lastName','email','profileImage'] });
    const userIdToUser = new Map(users.map(u => [u.id, u]));

    const data = orders.map(order => {
      const productSnaps = ps.filter(r => r.orderId === order.id);
      const userSnaps = us.filter(r => r.orderId === order.id);
      // Déterminer mon offre (celle dont le vendeur est currentUser)
      const offerForOrder = productSnaps.map(r => offerIdToOffer.get(r.offerId)).filter(Boolean);
      const myOffer = offerForOrder.find(of => of.sellerId === currentUserId) || null;
      const otherOffer = offerForOrder.find(of => of && myOffer && of.id !== myOffer.id) || offerForOrder.find(of => !myOffer && of) || null;

      // Déterminer isOrderSender & isProductOwner
      const senderSnap = userSnaps.find(s => s.isSender) || null;
      const isOrderSender = senderSnap ? senderSnap.userId === currentUserId : false;
      const isProductOwner = !!myOffer;

      return {
        order: {
          id: order.id,
          status: order.status,
          balanceAmount: Number(order.balanceAmount),
          balancePayerId: order.balancePayerId,
          createdAt: order.createdAt
        },
        isOrderSender,
        isProductOwner,
        products: productSnaps.map(s => {
          const of = offerIdToOffer.get(s.offerId);
          return ({
            snapshot: { title: s.title, price: Number(s.price), productCondition: s.productCondition },
            offer: of ? {
              id: s.offerId,
              title: of.title,
              price: Number(of.price),
              sellerId: of.sellerId,
              productCondition: of.productCondition,
              mainImageUrl: of.mainImageUrl || null
            } : null
          });
        }),
        participants: userSnaps.map(s => ({
          snapshot: { name: s.name, email: s.email, phone: s.phone, isSender: !!s.isSender },
          user: s.userId ? userIdToUser.get(s.userId) || null : null
        }))
      };
    });

    return res.status(200).json({ success: true, pagination: { page: pageNum, limit: limitNum, total: data.length }, data });
  } catch (error) {
    console.error('❌ getOrderDetails error:', error);
    return res.status(500).json({ error: 'Erreur interne', details: error.message || 'Erreur inconnue' });
  }
};

module.exports.getOrderDetails = getOrderDetails;

// Endpoint: GET /api/reprise-orders/negotiation-init/:orderId
// Retourne les données minimales pour initialiser l'étape 1 de négociation depuis un orderId
const getNegotiationInitByOrderId = async (req, res) => {
  try {
    const user = req.user;
    const currentUserId = user?.userId || user?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const { orderId } = req.params;
    const id = parseInt(orderId, 10);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: 'orderId invalide' });
    }

    // Déjà importés en haut du fichier

    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable' });

    // Snapshots liés
    const ps = await ProductSnapshot.findAll({ where: { orderId: id }, raw: true });
    const us = await UserSnapshot.findAll({ where: { orderId: id }, raw: true });
    if (!ps.length || !us.length) return res.status(404).json({ error: 'Snapshots manquants pour cette commande' });

    // Offres liées + image principale
    const offerIds = [...new Set(ps.map(r => r.offerId))];
    const offers = await Offer.findAll({ where: { id: { [Op.in]: offerIds } }, attributes: ['id','sellerId','title','price','productCondition','description'] });
    const offerIdToOffer = new Map(offers.map(o => [o.id, o]));
    if (OfferImage && offerIds.length) {
      const imgs = await OfferImage.findAll({ where: { offerId: { [Op.in]: offerIds } }, attributes: ['offerId','imageUrl','isMain'], raw: true });
      const mainByOffer = new Map();
      for (const img of imgs) {
        const current = mainByOffer.get(img.offerId);
        if (!current || img.isMain) mainByOffer.set(img.offerId, img.imageUrl);
      }
      for (const [oid, off] of offerIdToOffer.entries()) {
        off.mainImageUrl = mainByOffer.get(oid) || null;
      }
    }

    // Déterminer mon offre vs l'autre
    const offersForOrder = ps.map(r => offerIdToOffer.get(r.offerId)).filter(Boolean);
    const myOffer = offersForOrder.find(of => of.sellerId === currentUserId) || null;
    const otherOffer = offersForOrder.find(of => of && myOffer && of.id !== myOffer.id) || offersForOrder.find(of => !myOffer && of) || null;

    // Direction basée sur payer/recevoir relatif à l'utilisateur courant
    const difference = Number(order.balanceAmount) || 0;
    const direction = difference === 0 ? 'egal' : (order.balancePayerId === currentUserId ? 'payer' : 'recevoir');

    // Choix du "target" identique aux pages reçues: si je suis propriétaire produit -> target = mon offre
    // sinon (je suis l'expéditeur) -> target = l'offre de l'autre.
    const senderSnap = us.find(s => s.isSender);
    const isOrderSender = senderSnap ? senderSnap.userId === currentUserId : false;
    const isProductOwner = !!myOffer;

    const targetOffer = isProductOwner ? myOffer : otherOffer;
    const mineOffer = isProductOwner ? otherOffer : myOffer;

    const toPublic = (of) => of ? ({ id: of.id, title: of.title, price: Number(of.price), sellerId: of.sellerId, image: of.mainImageUrl || null }) : null;

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        target: toPublic(targetOffer),
        mine: toPublic(mineOffer),
        difference,
        direction,
        isOrderSender,
        isProductOwner,
      }
    });
  } catch (error) {
    console.error('❌ getNegotiationInitByOrderId error:', error);
    return res.status(500).json({ error: 'Erreur interne', details: error.message || 'Erreur inconnue' });
  }
};

module.exports = {
  createRepriseOrder,
  listReceivedOrdersOnMyOffers,
  getOrderDetails,
  getNegotiationInitByOrderId
};