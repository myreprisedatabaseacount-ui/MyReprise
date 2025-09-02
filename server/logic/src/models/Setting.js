const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
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
      unique: true
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      allowNull: false,
      defaultValue: 'string'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_system'
    }
  }, {
    tableName: 'settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Méthodes statiques
  Setting.get = async function(key, defaultValue = null) {
    const setting = await this.findOne({ where: { key } });
    if (!setting) return defaultValue;
    
    switch (setting.type) {
      case 'number': return parseFloat(setting.value);
      case 'boolean': return setting.value === 'true';
      case 'json': return JSON.parse(setting.value);
      default: return setting.value;
    }
  };

  Setting.set = async function(key, value, type = 'string') {
    const stringValue = type === 'json' ? JSON.stringify(value) : String(value);
    
    const [setting] = await this.upsert({
      key,
      value: stringValue,
      type
    });
    
    return setting;
  };

  Setting.getCurrentLanguage = async function() {
    return await this.get('currentLanguage', 'fr');
  };

  Setting.initializeDefaultSettings = async function() {
    const defaults = [
      { key: 'currentLanguage', value: 'fr', type: 'string', description: 'Langue par défaut de l\'application' }
    ];

    for (const setting of defaults) {
      await this.findOrCreate({
        where: { key: setting.key },
        defaults: setting
      });
    }
  };

  return Setting;
};