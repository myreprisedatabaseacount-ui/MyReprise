const { Sequelize } = require("sequelize");
require("dotenv").config();

// Créer une seule instance de Sequelize pour garantir une connexion unique
class Database {
  // Constructor
  constructor() {
    if (!Database.instance) {
      this.sequelize = new Sequelize(
        process.env.DB_DATABASE || 'myreprise_new',
        process.env.DB_USERNAME || 'root',
        process.env.DB_PASSWORD || '',
        {
          host: process.env.DB_HOST || 'localhost',
          dialect: "mysql",
          dialectOptions: {
            connectTimeout: 10000, // Temps d'attente en millisecondes (ici 10 secondes)
            charset: 'utf8mb4'
          },
          logging: process.env.NODE_ENV === 'development' ? console.log : false,
          port: process.env.DB_PORT || 3306,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
          define: {
            timestamps: true,
            underscored: true,
            freezeTableName: true
          }
        }
      );
      Database.instance = this;
    }

    return Database.instance;
  }

  // Méthode pour initialiser la connexion à la base de données
  async initializeDatabase() {
    try {
      await this.sequelize.authenticate();
      console.log("✅ Connexion à la base de données MySQL réussie !");
      
      // Synchronisation des modèles (optionnel)
      if (process.env.SYNC_DB === 'true') {
        await this.sequelize.sync({ alter: true });
        console.log("✅ Base de données synchronisée avec les modèles");
      }
      
    } catch (error) {
      console.error("❌ Erreur lors de la connexion à la base de données :", error);
      throw error;
    }
  }

  // Méthode pour synchroniser les modèles
  async syncModels(options = { force: false, alter: false }) {
    try {
      await this.sequelize.sync(options);
      console.log("✅ Modèles synchronisés avec la base de données");
    } catch (error) {
      console.error("❌ Erreur lors de la synchronisation des modèles :", error);
      throw error;
    }
  }

  // Méthode pour fermer la connexion
  async closeDatabase() {
    try {
      await this.sequelize.close();
      console.log("✅ Connexion à la base de données fermée !");
    } catch (error) {
      console.error("❌ Erreur lors de la fermeture de la connexion :", error);
      throw error;
    }
  }

  // Accéder à l'instance de Sequelize
  getSequelize() {
    return this.sequelize;
  }

  // Méthode pour tester la connexion
  async testConnection() {
    try {
      await this.sequelize.authenticate();
      console.log("✅ Test de connexion réussi");
      return true;
    } catch (error) {
      console.error("❌ Test de connexion échoué :", error);
      return false;
    }
  }

  // Méthode pour obtenir les informations de la base de données
  getDatabaseInfo() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_DATABASE || 'myreprise_new',
      dialect: 'mysql'
    };
  }

  // Méthode pour exécuter des requêtes SQL brutes
  async query(sql, options = {}) {
    try {
      const result = await this.sequelize.query(sql, options);
      return result;
    } catch (error) {
      console.error("❌ Erreur lors de l'exécution de la requête :", error);
      throw error;
    }
  }

  // Méthode pour commencer une transaction
  async beginTransaction() {
    return await this.sequelize.transaction();
  }

  // Méthode pour valider une transaction
  async commitTransaction(transaction) {
    await transaction.commit();
  }

  // Méthode pour annuler une transaction
  async rollbackTransaction(transaction) {
    await transaction.rollback();
  }
}

module.exports = new Database();
