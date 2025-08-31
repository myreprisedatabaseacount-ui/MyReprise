const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
    allowNull: false,
    defaultValue: 'string'
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_system',
    defaultValue: false,
    comment: 'Paramètre système (non modifiable par les utilisateurs)'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'created_at',
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'updated_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['key']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_system']
    }
  ]
});

// Méthodes d'instance
Setting.prototype.getValue = function() {
  if (!this.value) return null;
  
  switch (this.type) {
    case 'number':
      return parseFloat(this.value);
    case 'boolean':
      return this.value === 'true';
    case 'json':
      try {
        return JSON.parse(this.value);
      } catch (error) {
        return null;
      }
    default:
      return this.value;
  }
};

Setting.prototype.setValue = function(newValue) {
  switch (this.type) {
    case 'number':
      this.value = newValue.toString();
      break;
    case 'boolean':
      this.value = newValue ? 'true' : 'false';
      break;
    case 'json':
      this.value = JSON.stringify(newValue);
      break;
    default:
      this.value = newValue.toString();
  }
  return this;
};

// Méthodes statiques
Setting.get = async function(key, defaultValue = null) {
  try {
    const setting = await this.findOne({
      where: { key: key }
    });
    
    return setting ? setting.getValue() : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

Setting.set = async function(key, value, options = {}) {
  try {
    const [setting, created] = await this.findOrCreate({
      where: { key: key },
      defaults: {
        key: key,
        value: value.toString(),
        type: options.type || 'string',
        description: options.description || null,
        isSystem: options.isSystem || false
      }
    });

    if (!created) {
      setting.setValue(value);
      if (options.description) setting.description = options.description;
      await setting.save();
    }

    return {
      success: true,
      setting: setting,
      created: created
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Méthodes spécifiques pour la langue
Setting.getCurrentLanguage = async function() {
  return await this.get('currentLanguage', 'fr');
};

Setting.setCurrentLanguage = async function(language) {
  if (!['fr', 'ar'].includes(language)) {
    throw new Error('Langue non supportée. Utilisez "fr" ou "ar".');
  }
  
  return await this.set('currentLanguage', language, {
    type: 'string',
    description: 'Langue courante de l\'application (fr ou ar)',
    isSystem: true
  });
};

Setting.getAppLanguage = async function() {
  return await this.getCurrentLanguage();
};

// Méthode pour obtenir tous les paramètres
Setting.getAllSettings = function() {
  return this.findAll({
    order: [['key', 'ASC']]
  });
};

// Méthode pour obtenir les paramètres système
Setting.getSystemSettings = function() {
  return this.findAll({
    where: {
      isSystem: true
    },
    order: [['key', 'ASC']]
  });
};

// Méthode pour obtenir les paramètres utilisateur
Setting.getUserSettings = function() {
  return this.findAll({
    where: {
      isSystem: false
    },
    order: [['key', 'ASC']]
  });
};

// Méthode pour obtenir plusieurs paramètres en une fois
Setting.getMany = async function(keys) {
  const settings = await this.findAll({
    where: {
      key: {
        [sequelize.Op.in]: keys
      }
    }
  });

  const result = {};
  keys.forEach(key => {
    const setting = settings.find(s => s.key === key);
    result[key] = setting ? setting.getValue() : null;
  });

  return result;
};

// Méthode pour initialiser les paramètres par défaut
Setting.initializeDefaultSettings = async function() {
  const defaultSettings = [
    {
      key: 'currentLanguage',
      value: 'fr',
      type: 'string',
      description: 'Langue courante de l\'application (fr ou ar)',
      isSystem: true
    },
    {
      key: 'appName',
      value: 'MyReprise',
      type: 'string',
      description: 'Nom de l\'application',
      isSystem: false
    },
    {
      key: 'maxFileSize',
      value: '10',
      type: 'number',
      description: 'Taille maximale des fichiers en MB',
      isSystem: true
    },
    {
      key: 'enableNotifications',
      value: 'true',
      type: 'boolean',
      description: 'Activer les notifications',
      isSystem: false
    },
    {
      key: 'supportedLanguages',
      value: '["fr", "ar"]',
      type: 'json',
      description: 'Langues supportées par l\'application',
      isSystem: true
    }
  ];

  try {
    const results = [];
    for (const setting of defaultSettings) {
      const [created, wasCreated] = await this.findOrCreate({
        where: { key: setting.key },
        defaults: setting
      });
      results.push({ setting: created, created: wasCreated });
    }

    return {
      success: true,
      settings: results,
      message: 'Paramètres par défaut initialisés'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Méthode pour obtenir la configuration multilingue
Setting.getLocalizationConfig = async function() {
  const [currentLanguage, supportedLanguages] = await Promise.all([
    this.getCurrentLanguage(),
    this.get('supportedLanguages', ['fr', 'ar'])
  ]);

  return {
    currentLanguage: currentLanguage,
    supportedLanguages: supportedLanguages,
    isRTL: currentLanguage === 'ar',
    dateFormat: currentLanguage === 'ar' ? 'DD/MM/YYYY' : 'DD/MM/YYYY',
    numberFormat: currentLanguage === 'ar' ? 'ar-MA' : 'fr-FR'
  };
};

// Méthode pour basculer la langue
Setting.toggleLanguage = async function() {
  const currentLang = await this.getCurrentLanguage();
  const newLang = currentLang === 'fr' ? 'ar' : 'fr';
  
  await this.setCurrentLanguage(newLang);
  
  return {
    success: true,
    previousLanguage: currentLang,
    currentLanguage: newLang,
    message: `Langue changée de ${currentLang} vers ${newLang}`
  };
};

module.exports = Setting;
