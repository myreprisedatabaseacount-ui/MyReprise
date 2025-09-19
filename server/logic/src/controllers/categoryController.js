const { Category } = require('../models/Category.js');

const getCategoriesByListingType = async (req, res) => {
  try {
    const { listingType } = req.params;
    
    if (!listingType) {
      return res.status(400).json({
        error: "Type de listing requis"
      });
    }

    // Valider le listingType
    const validListingTypes = ['item', 'vehicle', 'property'];
    if (!validListingTypes.includes(listingType)) {
      return res.status(400).json({
        error: "Type de listing invalide. Types acceptés: item, vehicle, property"
      });
    }

    console.log(`📥 Recherche des catégories pour listingType: ${listingType}`);

    // Récupérer les catégories par listingType
    const categories = await Category.findAll({
      where: { 
        listingType: listingType 
      },
        order: [['nameFr', 'ASC']]
      });
      
    // Convertir en format public
    const publicCategories = categories.map(category => category.getLocalizedData('fr'));

    console.log(`✅ ${publicCategories.length} catégories trouvées pour ${listingType}`);

    return res.status(200).json({
      success: true,
      data: publicCategories,
      message: `Catégories récupérées avec succès pour ${listingType}`
    });

  } catch (error) {
    console.error("❌ Erreur getCategoriesByListingType:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des catégories",
      details: error.message || "Erreur inconnue"
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { language = 'fr' } = req.query;

    console.log(`📥 Récupération de toutes les catégories (langue: ${language})`);

    const categories = await Category.findAll({
      order: [['nameFr', 'ASC']]
    });

    const publicCategories = categories.map(category => category.getLocalizedData(language));

    console.log(`✅ ${publicCategories.length} catégories récupérées`);

      return res.status(200).json({
        success: true,
      data: publicCategories,
      message: "Toutes les catégories récupérées avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur getAllCategories:", error);
    return res.status(500).json({
      error: "Erreur lors de la récupération des catégories",
      details: error.message || "Erreur inconnue"
    });
  }
};

module.exports = {
  getCategoriesByListingType,
  getAllCategories
};