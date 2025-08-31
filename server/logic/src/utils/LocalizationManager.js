const Setting = require('../models/Setting');

class LocalizationManager {
  constructor() {
    this.cachedLanguage = null;
    this.cacheExpiry = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes en millisecondes
  }

  /**
   * Obtenir la langue courante (avec cache)
   */
  async getCurrentLanguage() {
    const now = Date.now();
    
    // Vérifier si le cache est valide
    if (this.cachedLanguage && this.cacheExpiry && now < this.cacheExpiry) {
      return this.cachedLanguage;
    }

    // Récupérer depuis la base de données
    const language = await Setting.getCurrentLanguage();
    
    // Mettre en cache
    this.cachedLanguage = language;
    this.cacheExpiry = now + this.cacheDuration;
    
    return language;
  }

  /**
   * Définir la langue courante et vider le cache
   */
  async setCurrentLanguage(language) {
    const result = await Setting.setCurrentLanguage(language);
    
    if (result.success) {
      // Vider le cache
      this.cachedLanguage = language;
      this.cacheExpiry = Date.now() + this.cacheDuration;
    }
    
    return result;
  }

  /**
   * Vider le cache manuellement
   */
  clearCache() {
    this.cachedLanguage = null;
    this.cacheExpiry = null;
  }

  /**
   * Localiser automatiquement un objet Brand
   */
  async localizeBrand(brand) {
    const language = await this.getCurrentLanguage();
    return brand.getLocalizedData ? brand.getLocalizedData(language) : brand;
  }

  /**
   * Localiser automatiquement un objet Category
   */
  async localizeCategory(category) {
    const language = await this.getCurrentLanguage();
    return category.getLocalizedData ? category.getLocalizedData(language) : category;
  }

  /**
   * Localiser automatiquement un objet Subject
   */
  async localizeSubject(subject) {
    const language = await this.getCurrentLanguage();
    return subject.getLocalizedData ? subject.getLocalizedData(language) : subject;
  }



  /**
   * Localiser automatiquement un tableau d'objets
   */
  async localizeArray(items, type) {
    const language = await this.getCurrentLanguage();
    
    return items.map(item => {
      if (item.getLocalizedData) {
        return item.getLocalizedData(language);
      }
      return item;
    });
  }

  /**
   * Localiser automatiquement une réponse API complète
   */
  async localizeResponse(data) {
    const language = await this.getCurrentLanguage();
    
    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.localizeItem(item, language)));
    } else if (data && typeof data === 'object') {
      return this.localizeItem(data, language);
    }
    
    return data;
  }

  /**
   * Localiser un élément individuel
   */
  async localizeItem(item, language) {
    if (!item || typeof item !== 'object') return item;
    
    // Si l'objet a une méthode getLocalizedData, l'utiliser
    if (item.getLocalizedData) {
      return item.getLocalizedData(language);
    }
    
    // Si l'objet a des relations, les localiser aussi
    const localizedItem = { ...item };
    
    // Localiser les relations Brand
    if (item.Brand && item.Brand.getLocalizedData) {
      localizedItem.Brand = item.Brand.getLocalizedData(language);
    }
    
    // Localiser les relations Category
    if (item.Category && item.Category.getLocalizedData) {
      localizedItem.Category = item.Category.getLocalizedData(language);
    }
    
    // Localiser les relations Subject
    if (item.Subject && item.Subject.getLocalizedData) {
      localizedItem.Subject = item.Subject.getLocalizedData(language);
    }
    

    
    return localizedItem;
  }

  /**
   * Middleware Express pour injection automatique de la langue
   */
  middleware() {
    return async (req, res, next) => {
      try {
        // Récupérer la langue courante
        const currentLanguage = await this.getCurrentLanguage();
        
        // L'injecter dans la requête
        req.language = currentLanguage;
        res.locals.language = currentLanguage;
        
        // Ajouter des méthodes utilitaires
        req.localize = async (data) => {
          return await this.localizeResponse(data);
        };
        
        res.localizedJson = async (data) => {
          const localizedData = await this.localizeResponse(data);
          return res.json(localizedData);
        };
        
        next();
      } catch (error) {
        console.error('Erreur middleware localisation:', error);
        req.language = 'fr'; // Fallback
        res.locals.language = 'fr';
        next();
      }
    };
  }

  /**
   * Obtenir la configuration de localisation complète
   */
  async getConfig() {
    return await Setting.getLocalizationConfig();
  }
}

// Instance singleton
const localizationManager = new LocalizationManager();

module.exports = localizationManager;
