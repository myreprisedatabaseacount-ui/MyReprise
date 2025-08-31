const express = require('express');
const router = express.Router();
const localizationManager = require('../utils/LocalizationManager');
const { Brand, Category, Subject, Setting } = require('../models');

// Middleware de localisation automatique
router.use(localizationManager.middleware());

/**
 * Obtenir toutes les marques (localisées automatiquement)
 */
router.get('/brands', async (req, res) => {
  try {
    const brands = await Brand.findAll({
      include: [
        {
          model: Category,
          as: 'Category'
        }
      ]
    });

    // Localisation automatique via middleware
    res.localizedJson(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtenir toutes les catégories (localisées automatiquement)
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Brand,
          as: 'Brands'
        }
      ]
    });

    res.localizedJson(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtenir l'arbre des catégories (localisé automatiquement)
 */
router.get('/categories/tree', async (req, res) => {
  try {
    const currentLanguage = req.language; // Injecté par le middleware
    const tree = await Category.getCategoryTree(currentLanguage);
    
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Rechercher des marques (localisé automatiquement)
 */
router.get('/brands/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Paramètre de recherche manquant' });
    }

    const currentLanguage = req.language;
    const brands = await Brand.searchBrands(query, currentLanguage);
    
    res.localizedJson(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtenir les paramètres de langue
 */
router.get('/settings/language', async (req, res) => {
  try {
    const config = await localizationManager.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Changer la langue de l'application
 */
router.post('/settings/language', async (req, res) => {
  try {
    const { language } = req.body;
    
    if (!language || !['fr', 'ar'].includes(language)) {
      return res.status(400).json({ 
        error: 'Langue invalide. Utilisez "fr" ou "ar".' 
      });
    }

    const result = await localizationManager.setCurrentLanguage(language);
    
    if (result.success) {
      const config = await localizationManager.getConfig();
      res.json({
        success: true,
        message: `Langue changée vers ${language}`,
        config: config
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Basculer entre les langues
 */
router.post('/settings/language/toggle', async (req, res) => {
  try {
    const result = await Setting.toggleLanguage();
    
    if (result.success) {
      const config = await localizationManager.getConfig();
      res.json({
        ...result,
        config: config
      });
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtenir une marque par ID (localisée)
 */
router.get('/brands/:id', async (req, res) => {
  try {
    const brand = await Brand.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'Category'
        }
      ]
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marque introuvable' });
    }

    res.localizedJson(brand);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Obtenir une catégorie avec son chemin complet (localisé)
 */
router.get('/categories/:id/path', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Catégorie introuvable' });
    }

    const currentLanguage = req.language;
    const fullPath = await category.getFullPath(currentLanguage);
    
    res.json({
      id: category.id,
      path: fullPath,
      language: currentLanguage,
      category: category.getLocalizedData(currentLanguage)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initialiser les paramètres par défaut
 */
router.post('/settings/initialize', async (req, res) => {
  try {
    const result = await Setting.initializeDefaultSettings();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
