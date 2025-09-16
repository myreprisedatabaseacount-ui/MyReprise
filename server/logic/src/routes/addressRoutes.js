const express = require('express');
const router = express.Router();
const AddressController = require('../controllers/AddressController');

// Route pour rechercher des localisations par terme de recherche
router.post('/search', AddressController.getLocationsBySearch);

// Route pour obtenir une adresse par ID
router.get('/:id', AddressController.getAddressById);

// Route pour obtenir toutes les adresses avec pagination
router.get('/', AddressController.getAllAddresses);

// Route pour obtenir les villes uniques
router.get('/cities/unique', AddressController.getUniqueCities);

// Route pour obtenir les secteurs d'une ville
router.get('/cities/:city/sectors', AddressController.getSectorsByCity);

module.exports = router;
