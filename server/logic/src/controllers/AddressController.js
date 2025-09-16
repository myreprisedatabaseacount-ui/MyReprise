const { Op } = require('sequelize');
const { Address } = require('../models/Address');

class AddressController {
  /**
   * Recherche intelligente de localisations par terme de recherche
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getLocationsBySearch(req, res) {
    try {
      const { searchedTerm } = req.body;

      // Validation du terme de recherche
      if (!searchedTerm || searchedTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Le terme de recherche doit contenir au moins 2 caractères'
        });
      }

      const searchTerm = searchedTerm.trim();

      // Recherche avec Sequelize
      const addresses = await Address.findAll({
        where: {
          [Op.or]: [
            { addressName: { [Op.like]: `%${searchTerm}%` } },
            { city: { [Op.like]: `%${searchTerm}%` } },
            { sector: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        order: [
          // Priorité : addressName d'abord, puis city, puis sector
          [
            Address.sequelize.literal(`
              CASE 
                WHEN addressName LIKE '%${searchTerm}%' THEN 1
                WHEN city LIKE '%${searchTerm}%' THEN 2
                WHEN sector LIKE '%${searchTerm}%' THEN 3
                ELSE 4
              END
            `),
            'ASC'
          ],
          ['addressName', 'ASC']
        ],
        limit: 20
      });

      // Formater les résultats
      const formattedResults = addresses.map(address => ({
        id: address.id,
        addressName: address.addressName,
        city: address.city,
        sector: address.sector,
        latitude: address.latitude,
        longitude: address.longitude,
        displayName: `${address.addressName}, ${address.city}${address.sector ? `, ${address.sector}` : ''}`,
        hasCoordinates: address.latitude !== null && address.longitude !== null
      }));

      res.json({
        success: true,
        data: formattedResults,
        count: formattedResults.length,
        searchTerm: searchTerm
      });

    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresses:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur lors de la recherche d\'adresses'
      });
    }
  }

  /**
   * Obtenir une adresse par ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getAddressById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          error: 'ID d\'adresse invalide'
        });
      }

      // Recherche avec Sequelize
      const address = await Address.findByPk(id);

      if (!address) {
        return res.status(404).json({
          success: false,
          error: 'Adresse non trouvée'
        });
      }

      // Formater le résultat
      const formattedAddress = {
        id: address.id,
        addressName: address.addressName,
        city: address.city,
        sector: address.sector,
        latitude: address.latitude,
        longitude: address.longitude,
        displayName: `${address.addressName}, ${address.city}${address.sector ? `, ${address.sector}` : ''}`,
        hasCoordinates: address.latitude !== null && address.longitude !== null
      };

      res.json({
        success: true,
        data: formattedAddress
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'adresse:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur lors de la récupération de l\'adresse'
      });
    }
  }

  /**
   * Obtenir toutes les adresses avec pagination
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getAllAddresses(req, res) {
    try {
      const { page = 1, limit = 10, search, city, sector } = req.query;
      const offset = (page - 1) * limit;

      // Construire les conditions de recherche
      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { addressName: { [Op.like]: `%${search}%` } },
          { city: { [Op.like]: `%${search}%` } },
          { sector: { [Op.like]: `%${search}%` } }
        ];
      }
      
      if (city) whereClause.city = city;
      if (sector) whereClause.sector = sector;

      // Recherche avec pagination
      const { count, rows } = await Address.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['city', 'ASC'], ['sector', 'ASC'], ['addressName', 'ASC']]
      });

      // Formater les résultats
      const formattedResults = rows.map(address => ({
        id: address.id,
        addressName: address.addressName,
        city: address.city,
        sector: address.sector,
        latitude: address.latitude,
        longitude: address.longitude,
        displayName: `${address.addressName}, ${address.city}${address.sector ? `, ${address.sector}` : ''}`,
        hasCoordinates: address.latitude !== null && address.longitude !== null
      }));

      res.json({
        success: true,
        data: formattedResults,
        pagination: {
          totalCount: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des adresses:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur lors de la récupération des adresses'
      });
    }
  }

  /**
   * Obtenir les villes uniques
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getUniqueCities(req, res) {
    try {
      const cities = await Address.getUniqueCities();
      
      res.json({
        success: true,
        data: cities
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des villes:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur lors de la récupération des villes'
      });
    }
  }

  /**
   * Obtenir les secteurs d'une ville
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  static async getSectorsByCity(req, res) {
    try {
      const { city } = req.params;

      if (!city) {
        return res.status(400).json({
          success: false,
          error: 'Nom de ville requis'
        });
      }

      const sectors = await Address.getSectorsByCity(city);
      
      res.json({
        success: true,
        data: sectors,
        city: city
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des secteurs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur lors de la récupération des secteurs'
      });
    }
  }
}

module.exports = AddressController;