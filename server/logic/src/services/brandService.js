const { Brand } = require('../models/Brand.js');
const { getRedisClient } = require('../config/redis');
const Neo4jSyncService = require('./neo4jSyncService');
const logger = require('../utils/logger');

// ========================================
// SERVICE DE GESTION DES MARQUES
// ========================================

class BrandService {
    
    // ========================================
    // MÉTHODES DE CRÉATION
    // ========================================
    
    /**
     * Crée une nouvelle marque avec synchronisation
     */
    static async createBrand(brandData) {
        try {
            logger.info(`🔄 Création d'une nouvelle marque: ${brandData.nameFr}`);
            
            // Créer la marque en base
            const newBrand = await Brand.createBrand(brandData);
            
            // Récupérer la marque complète avec les catégories pour avoir le bon format
            const completeBrand = await Brand.findByPk(newBrand.id, {
                include: [{
                    model: require('../models/Category').Category,
                    as: 'categories',
                    through: { attributes: [] },
                    attributes: ['id', 'nameFr', 'nameAr', 'image', 'descriptionFr', 'descriptionAr']
                }]
            });
            
            // Synchroniser vers Redis avec le format correct
            await this.cacheBrand(completeBrand);
            
            // Invalider les caches de listes pour que la nouvelle marque apparaisse
            await this.invalidateBrandCaches(newBrand.id);
            
            // Synchroniser vers Neo4j (asynchrone, non bloquant)
            Neo4jSyncService.syncBrand(completeBrand, 'CREATE').catch(error => {
                logger.error('Erreur synchronisation Neo4j marque (non bloquant):', error);
            });
            
            logger.info(`✅ Marque créée avec succès: ${completeBrand.nameFr} (ID: ${completeBrand.id})`);
            
            // Retourner le format cohérent avec getBrandById
            const response = {
                success: true,
                data: {
                    brand: {
                        id: completeBrand.id,
                        nameFr: completeBrand.nameFr,
                        nameAr: completeBrand.nameAr,
                        descriptionFr: completeBrand.descriptionFr,
                        descriptionAr: completeBrand.descriptionAr,
                        logo: completeBrand.logo,
                        createdAt: completeBrand.createdAt,
                        updatedAt: completeBrand.updatedAt,
                        categories: completeBrand.categories || []
                    }
                }
            };
            
            return response;
            
        } catch (error) {
            logger.error('Erreur création marque:', error);
            throw error;
        }
    }
    
    // ========================================
    // MÉTHODES DE RECHERCHE
    // ========================================
    
    /**
     * Récupère toutes les marques avec pagination
     */
    static async getAllBrands(page = 1, limit = 10, filters = {}, language = 'fr') {
        try {
            const cacheKey = `brands:list:${page}:${limit}:${JSON.stringify(filters)}:${language}`;
            
            // Vérifier le cache Redis
            const cachedData = await this.getFromCache(cacheKey);
            if (cachedData) {
                logger.debug(`📦 Données marques récupérées du cache: ${cacheKey}`);
                return cachedData;
            }
            
            // Construire la clause WHERE pour les filtres
            const whereClause = {};
            if (filters.search) {
                const nameField = language === 'ar' ? 'nameAr' : 'nameFr';
                const descField = language === 'ar' ? 'descriptionAr' : 'descriptionFr';
                
                whereClause[require('sequelize').Op.or] = [
                    { [nameField]: { [require('sequelize').Op.like]: `%${filters.search}%` } },
                    { [descField]: { [require('sequelize').Op.like]: `%${filters.search}%` } }
                ];
            }
            
            // Récupérer directement les marques avec leurs catégories en une seule requête optimisée
            const offset = (page - 1) * limit;
            const orderField = language === 'ar' ? 'nameAr' : 'nameFr';
            
            const { count, rows: brandsWithCategories } = await Brand.findAndCountAll({
                where: whereClause,
                include: [{
                    model: require('../models/Category').Category,
                    as: 'categories',
                    through: { attributes: [] },
                    attributes: ['id', 'nameFr', 'nameAr', 'image', 'descriptionFr', 'descriptionAr']
                }],
                order: [[orderField, 'ASC']],
                limit: limit,
                offset: offset
            });
            
            const result = {
                success: true,
                brands: brandsWithCategories,
                totalCount: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            };
            
            // Transformer les données
            const transformedBrands = brandsWithCategories.map(brand => ({
                id: brand.id,
                nameFr: brand.nameFr,
                nameAr: brand.nameAr,
                descriptionFr: brand.descriptionFr,
                descriptionAr: brand.descriptionAr,
                logo: brand.logo,
                createdAt: brand.createdAt,
                updatedAt: brand.updatedAt,
                categories: brand.categories || []
            }));
            
            const response = {
                success: true,
                data: {
                    brands: transformedBrands,
                    pagination: {
                        totalCount: result.totalCount,
                        totalPages: result.totalPages,
                        currentPage: result.currentPage,
                        limit
                    }
                }
            };
            
            // Mettre en cache (TTL: 10 minutes pour les listes)
            await this.setCache(cacheKey, response, 600);
            
            return response;
            
        } catch (error) {
            logger.error('Erreur récupération marques:', error);
            throw error;
        }
    }
    
    /**
     * Récupère une marque par ID
     */
    static async getBrandById(id, language = 'fr') {
        try {
            const cacheKey = `brand:${id}:${language}`;
            
            // Vérifier le cache Redis
            const cachedData = await this.getFromCache(cacheKey);
            if (cachedData) {
                // Vérifier si les données en cache ont le bon format
                if (cachedData.success && cachedData.data && cachedData.data.brand) {
                    logger.debug(`📦 Données marque récupérées du cache: ${cacheKey}`);
                    return cachedData;
                } else {
                    // Les données en cache sont dans l'ancien format, les supprimer
                    logger.warn(`🗑️ Données en cache obsolètes détectées, suppression: ${cacheKey}`);
                    await this.clearCache(cacheKey);
                }
            }
            
            // Récupérer depuis la base de données avec les catégories
            const brand = await Brand.findByPk(id, {
                include: [{
                    model: require('../models/Category').Category,
                    as: 'categories',
                    through: { attributes: [] },
                    attributes: ['id', 'nameFr', 'nameAr', 'image', 'descriptionFr', 'descriptionAr']
                }]
            });
            
            if (!brand) {
                return {
                    success: false,
                    error: 'Marque non trouvée'
                };
            }
            
            const response = {
                success: true,
                data: {
                    brand: {
                        id: brand.id,
                        nameFr: brand.nameFr,
                        nameAr: brand.nameAr,
                        descriptionFr: brand.descriptionFr,
                        descriptionAr: brand.descriptionAr,
                        logo: brand.logo,
                        createdAt: brand.createdAt,
                        updatedAt: brand.updatedAt,
                        categories: brand.categories || []
                    }
                }
            };
            
            // Mettre en cache (TTL: 10 minutes)
            await this.setCache(cacheKey, response, 600);
            
            return response;
            
        } catch (error) {
            logger.error('Erreur récupération marque:', error);
            throw error;
        }
    }
    
    /**
     * Recherche des marques
     */
    static async searchBrands(searchTerm, filters = {}, language = 'fr') {
        try {
            const cacheKey = `brands:search:${searchTerm}:${JSON.stringify(filters)}:${language}`;
            
            // Vérifier le cache Redis
            const cachedData = await this.getFromCache(cacheKey);
            if (cachedData) {
                logger.debug(`📦 Résultats recherche marques récupérés du cache: ${cacheKey}`);
                return cachedData;
            }
            
            // Rechercher dans la base de données
            const brands = await Brand.searchBrands(searchTerm, filters, language);
            
            const response = {
                success: true,
                data: {
                    brands: brands.map(brand => brand.getLocalizedData(language))
                }
            };
            
            // Mettre en cache (TTL: 3 minutes)
            await this.setCache(cacheKey, response, 180);
            
            return response;
            
        } catch (error) {
            logger.error('Erreur recherche marques:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les marques populaires
     */
    static async getPopularBrands(limit = 10, language = 'fr') {
        try {
            const cacheKey = `brands:popular:${limit}:${language}`;
            
            // Vérifier le cache Redis
            const cachedData = await this.getFromCache(cacheKey);
            if (cachedData) {
                logger.debug(`📦 Marques populaires récupérées du cache: ${cacheKey}`);
                return cachedData;
            }
            
            // Récupérer depuis la base de données
            const brands = await Brand.getPopularBrands(limit);
            
            const response = {
                success: true,
                data: {
                    brands: brands.map(brand => brand.getLocalizedData(language))
                }
            };
            
            // Mettre en cache (TTL: 15 minutes)
            await this.setCache(cacheKey, response, 900);
            
            return response;
            
        } catch (error) {
            logger.error('Erreur récupération marques populaires:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les marques par catégorie
     */
    static async getBrandsByCategory(categoryId, language = 'fr') {
        try {
            const cacheKey = `brands:category:${categoryId}:${language}`;
            
            // Vérifier le cache Redis
            const cachedData = await this.getFromCache(cacheKey);
            if (cachedData) {
                logger.debug(`📦 Marques par catégorie récupérées du cache: ${cacheKey}`);
                return cachedData;
            }
            
            // Récupérer depuis la base de données
            const brands = await Brand.findByCategory(categoryId);
            
            const response = {
                success: true,
                data: {
                    brands: brands.map(brand => brand.getLocalizedData(language))
                }
            };
            
            // Mettre en cache (TTL: 10 minutes)
            await this.setCache(cacheKey, response, 600);
            
            return response;
            
        } catch (error) {
            logger.error('Erreur récupération marques par catégorie:', error);
            throw error;
        }
    }
    
    // ========================================
    // MÉTHODES DE MISE À JOUR
    // ========================================
    
    /**
     * Met à jour une marque avec synchronisation
     */
    static async updateBrand(id, updateData) {
        try {
            logger.info(`🔄 Mise à jour de la marque ID: ${id}`);
            
            // Mettre à jour en base
            const updatedBrand = await Brand.updateBrand(id, updateData);
            
            // Récupérer la marque complète avec les catégories pour avoir le bon format
            const completeBrand = await Brand.findByPk(id, {
                include: [{
                    model: require('../models/Category').Category,
                    as: 'categories',
                    through: { attributes: [] },
                    attributes: ['id', 'nameFr', 'nameAr', 'image', 'descriptionFr', 'descriptionAr']
                }]
            });
            
            // Mettre à jour le cache Redis avec le format correct
            await this.cacheBrand(completeBrand);
            
            // Synchroniser vers Neo4j (asynchrone, non bloquant)
            Neo4jSyncService.syncBrand(completeBrand, 'UPDATE').catch(error => {
                logger.error('Erreur synchronisation Neo4j marque (non bloquant):', error);
            });
            
            // Invalider les caches liés
            await this.invalidateBrandCaches(id);
            
            logger.info(`✅ Marque mise à jour avec succès: ${completeBrand.nameFr} (ID: ${id})`);
            
            // Retourner le format cohérent avec getBrandById
            const response = {
                success: true,
                data: {
                    brand: {
                        id: completeBrand.id,
                        nameFr: completeBrand.nameFr,
                        nameAr: completeBrand.nameAr,
                        descriptionFr: completeBrand.descriptionFr,
                        descriptionAr: completeBrand.descriptionAr,
                        logo: completeBrand.logo,
                        createdAt: completeBrand.createdAt,
                        updatedAt: completeBrand.updatedAt,
                        categories: completeBrand.categories || []
                    }
                }
            };
            
            return response;
            
        } catch (error) {
            logger.error('Erreur mise à jour marque:', error);
            throw error;
        }
    }
    
    // Note: Les méthodes activateBrand et deactivateBrand ont été supprimées
    // car le champ isActive n'existe pas dans la base de données
    
    // ========================================
    // MÉTHODES DE SUPPRESSION
    // ========================================
    
    /**
     * Supprime une marque avec synchronisation
     */
    static async deleteBrand(id) {
        try {
            logger.info(`🔄 Suppression de la marque ID: ${id}`);
            
            // Récupérer la marque avant suppression
            const brand = await Brand.findByPk(id);
            if (!brand) {
                return {
                    success: false,
                    error: 'Marque non trouvée'
                };
            }
            
            // Supprimer de la base
            await Brand.deleteBrand(id);
            
            // Supprimer du cache Redis
            await this.removeFromCache(`brand:${id}:fr`);
            await this.removeFromCache(`brand:${id}:ar`);
            
            // Synchroniser vers Neo4j (asynchrone, non bloquant)
            Neo4jSyncService.syncBrand(brand, 'DELETE').catch(error => {
                logger.error('Erreur synchronisation Neo4j marque (non bloquant):', error);
            });
            
            // Invalider les caches liés
            await this.invalidateBrandCaches(id);
            
            logger.info(`✅ Marque supprimée avec succès: ${brand.nameFr} (ID: ${id})`);
            
            return {
                success: true,
                message: 'Marque supprimée avec succès'
            };
            
        } catch (error) {
            logger.error('Erreur suppression marque:', error);
            throw error;
        }
    }
    
    // ========================================
    // MÉTHODES DE STATISTIQUES
    // ========================================
    
    /**
     * Récupère les statistiques des marques
     */
    static async getBrandStats() {
        try {
            const cacheKey = 'brands:stats';
            
            // Vérifier le cache Redis
            const cachedData = await this.getFromCache(cacheKey);
            if (cachedData) {
                logger.debug(`📦 Statistiques marques récupérées du cache: ${cacheKey}`);
                return cachedData;
            }
            
            // Récupérer depuis la base de données
            const stats = await Brand.getBrandStats();
            
            const response = {
                success: true,
                data: stats
            };
            
            // Mettre en cache (TTL: 30 minutes)
            await this.setCache(cacheKey, response, 1800);
            
            return response;
            
        } catch (error) {
            logger.error('Erreur récupération statistiques marques:', error);
            throw error;
        }
    }
    
    // ========================================
    // MÉTHODES DE CACHE
    // ========================================
    
    /**
     * Met une marque en cache
     */
    static async cacheBrand(brand) {
        try {
            const redis = getRedisClient();
            
            // Format cohérent avec getBrandById - données complètes
            const brandData = {
                id: brand.id,
                nameFr: brand.nameFr,
                nameAr: brand.nameAr,
                descriptionFr: brand.descriptionFr,
                descriptionAr: brand.descriptionAr,
                logo: brand.logo,
                createdAt: brand.createdAt,
                updatedAt: brand.updatedAt,
                categories: brand.categories || []
            };
            
            const cacheData = {
                success: true,
                data: {
                    brand: brandData
                }
            };
            
            // Cache en français (même format que getBrandById)
            await redis.setEx(
                `brand:${brand.id}:fr`,
                600, // 10 minutes
                JSON.stringify(cacheData)
            );
            
            // Cache en arabe (même format que getBrandById)
            await redis.setEx(
                `brand:${brand.id}:ar`,
                600, // 10 minutes
                JSON.stringify(cacheData)
            );
            
            logger.debug(`📦 Marque mise en cache: ${brand.id}`);
            
        } catch (error) {
            logger.error('Erreur mise en cache marque:', error);
        }
    }
    
    /**
     * Récupère des données du cache
     */
    static async getFromCache(key) {
        try {
            const redis = getRedisClient();
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Erreur récupération cache:', error);
            return null;
        }
    }
    
    /**
     * Met des données en cache
     */
    static async setCache(key, data, ttl = 300) {
        try {
            const redis = getRedisClient();
            await redis.setEx(key, ttl, JSON.stringify(data));
        } catch (error) {
            logger.error('Erreur mise en cache:', error);
        }
    }
    
    /**
     * Supprime des données du cache
     */
    static async removeFromCache(key) {
        try {
            const redis = getRedisClient();
            await redis.del(key);
        } catch (error) {
            logger.error('Erreur suppression cache:', error);
        }
    }
    
    /**
     * Alias pour removeFromCache (pour la compatibilité)
     */
    static async clearCache(key) {
        return this.removeFromCache(key);
    }
    
    /**
     * Vide tout le cache des marques
     */
    static async clearAllBrandsCache() {
        try {
            const redis = getRedisClient();
            const pattern = 'brand*';
            const keys = await redis.keys(pattern);
            
            if (keys.length > 0) {
                await redis.del(...keys);
                logger.info(`🗑️ Cache des marques vidé: ${keys.length} clés supprimées`);
            }
            
            return { success: true, clearedKeys: keys.length };
        } catch (error) {
            logger.error('Erreur vidage cache marques:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Invalide les caches liés à une marque
     */
    static async invalidateBrandCaches(brandId) {
        try {
            const redis = getRedisClient();
            
            // Supprimer les caches de listes
            const pattern = 'brands:*';
            const keys = await redis.keys(pattern);
            
            for (const key of keys) {
                await redis.del(key);
            }
            
            logger.debug(`🗑️ Caches marques invalidés pour ID: ${brandId}`);
            
        } catch (error) {
            logger.error('Erreur invalidation caches marques:', error);
        }
    }
}

module.exports = BrandService;
