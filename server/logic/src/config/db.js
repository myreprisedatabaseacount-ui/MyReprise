const { Sequelize, Op } = require("sequelize");
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
        try {
          await this.sequelize.sync({ alter: true });
          console.log("✅ Base de données synchronisée avec les modèles");
        } catch (syncError) {
          console.warn("⚠️ Erreur lors de la synchronisation (non critique):", syncError.message);
          // Ne pas faire échouer le serveur pour une erreur de synchronisation
        }
      } else {
        console.log("ℹ️ Synchronisation désactivée (SYNC_DB != 'true')");
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

  // Méthode pour supprimer les index problématiques
  async dropProblematicIndexes() {
    try {
      console.log("🔄 Vérification et suppression des index problématiques...");
      
      // D'abord, récupérer tous les index existants
      const existingIndexes = await this.sequelize.query(`
        SELECT 
          TABLE_NAME,
          INDEX_NAME,
          COLUMN_NAME
        FROM 
          INFORMATION_SCHEMA.STATISTICS 
        WHERE 
          TABLE_SCHEMA = 'myreprise_new' 
          AND INDEX_NAME != 'PRIMARY'
          AND INDEX_NAME NOT LIKE '%_fk'
          AND INDEX_NAME NOT LIKE '%_pkey'
        ORDER BY TABLE_NAME, INDEX_NAME
      `);
      
      console.log(`📊 ${existingIndexes[0].length} index trouvés dans la base de données`);
      
      // Grouper les index par table
      const indexesByTable = {};
      existingIndexes[0].forEach(index => {
        if (!indexesByTable[index.TABLE_NAME]) {
          indexesByTable[index.TABLE_NAME] = new Set();
        }
        indexesByTable[index.TABLE_NAME].add(index.INDEX_NAME);
      });
      
      // Supprimer les index non essentiels (garder seulement les clés étrangères et primaires)
      let droppedCount = 0;
      let errorCount = 0;
      
      for (const [tableName, indexNames] of Object.entries(indexesByTable)) {
        for (const indexName of indexNames) {
          // Garder seulement les index de clés étrangères et les index essentiels
          if (indexName.includes('_fk') || 
              indexName.includes('_pkey') || 
              indexName === 'PRIMARY' ||
              indexName.includes('unique') ||
              indexName.includes('UNIQUE')) {
            continue;
          }
          
          try {
            await this.sequelize.query(`ALTER TABLE \`${tableName}\` DROP INDEX \`${indexName}\`;`);
            console.log(`✅ Index \`${indexName}\` supprimé de la table \`${tableName}\``);
            droppedCount++;
          } catch (error) {
            if (!error.message.includes("doesn't exist") && 
                !error.message.includes("Unknown key") &&
                !error.message.includes("check that column/key exists")) {
              console.warn(`⚠️ Erreur lors de la suppression de l'index \`${indexName}\` de \`${tableName}\`: ${error.message}`);
              errorCount++;
            }
          }
        }
      }

      console.log(`✅ Suppression des index terminée: ${droppedCount} supprimés, ${errorCount} erreurs`);
      
    } catch (error) {
      console.error("❌ Erreur lors de la suppression des index problématiques:", error);
      // Ne pas faire échouer le serveur pour cette erreur
    }
  }
}

const dbInstance = new Database();

// Ajouter Sequelize et Op à l'instance pour compatibilité
dbInstance.Sequelize = Sequelize;
dbInstance.Op = Op;

module.exports = dbInstance;
