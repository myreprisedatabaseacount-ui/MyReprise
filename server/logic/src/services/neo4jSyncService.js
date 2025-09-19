const axios = require('axios');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

// ========================================
// SERVICE DE SYNCHRONISATION NEO4J
// ========================================

class Neo4jSyncService {
    
    // Configuration
    static GRAPH_SERVICE_URL = process.env.GRAPH_SERVICE_URL || 'http://localhost:8002';
    static SYNC_QUEUE_KEY = 'neo4j_sync_queue';
    static SYNC_RETRY_KEY = 'neo4j_sync_retry';
    static MAX_RETRIES = 3;
    static RETRY_DELAY = 5000; // 5 secondes

    /**
     * Synchronise un utilisateur vers Neo4j (temps réel)
     */
    static async syncUser(user, action = 'CREATE') {
        try {
            logger.info(`🔄 Synchronisation ${action} utilisateur ${user.id} vers Neo4j`);

            // Préparer les données utilisateur pour Neo4j
            const userData = this.prepareUserDataForNeo4j(user, action);

            // Tentative de synchronisation temps réel
            const success = await this.syncToGraphService(userData);

            if (success) {
                // Mettre en cache pour optimiser les futures requêtes
                await this.cacheUserData(user);
                logger.info(`✅ Utilisateur ${user.id} synchronisé avec succès`);
                return true;
            } else {
                // En cas d'échec, ajouter à la queue de retry
                await this.addToRetryQueue(userData);
                logger.warn(`⚠️ Synchronisation échouée, ajouté à la queue de retry`);
                return false;
            }

        } catch (error) {
            logger.error(`❌ Erreur synchronisation utilisateur ${user.id}:`, error);
            
            // En cas d'erreur, ajouter à la queue de retry
            const userData = this.prepareUserDataForNeo4j(user, action);
            await this.addToRetryQueue(userData);
            
            return false;
        }
    }

    /**
     * Synchronise directement avec le Graph Service
     */
    static async syncToGraphService(data) {
        try {
            let endpoint = '/sync/user';
            
            // Déterminer l'endpoint selon le type de données
            if (data.type === 'OFFER_CATEGORY_RELATION') {
                endpoint = '/sync/offer-category-relation';
            } else if (data.type === 'OFFER') {
                endpoint = '/sync/offer';
            } else if (data.type === 'CATEGORY') {
                endpoint = '/sync/category';
            }

            const response = await axios.post(
                `${this.GRAPH_SERVICE_URL}${endpoint}`,
                data,
                {
                    timeout: 10000, // 10 secondes timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.status === 200;

        } catch (error) {
            logger.error('Erreur appel Graph Service:', error.message);
            if (error.response) {
                logger.error('Détails erreur:', error.response.data);
            }
            return false;
        }
    }

    /**
     * Prépare les données utilisateur pour Neo4j
     */
    static prepareUserDataForNeo4j(user, action) {
        return {
            action: action, // CREATE, UPDATE, DELETE
            userId: user.id,
            userData: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                authProvider: user.authProvider,
                primaryIdentifier: user.primaryIdentifier,
                isVerified: user.isVerified,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                // Données spécifiques au provider
                googleId: user.googleId,
                facebookId: user.facebookId,
                facebookEmail: user.facebookEmail,
                facebookPhone: user.facebookPhone
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Met en cache les données utilisateur dans Redis
     */
    static async cacheUserData(user) {
        try {
            const redis = getRedisClient();
            const cacheKey = `user:${user.id}`;
            const userData = {
                id: user.id,
                primaryIdentifier: user.primaryIdentifier,
                authProvider: user.authProvider,
                isVerified: user.isVerified,
                role: user.role,
                lastSync: new Date().toISOString()
            };

            // Cache pour 1 heure
            await redis.setEx(cacheKey, 3600, JSON.stringify(userData));
            logger.debug(`📦 Données utilisateur ${user.id} mises en cache`);

        } catch (error) {
            logger.error('Erreur mise en cache:', error);
        }
    }

    /**
     * Ajoute un utilisateur à la queue de retry
     */
    static async addToRetryQueue(userData) {
        try {
            const redis = getRedisClient();
            const retryData = {
                ...userData,
                retryCount: 0,
                nextRetry: Date.now() + this.RETRY_DELAY
            };

            await redis.lPush(this.SYNC_RETRY_KEY, JSON.stringify(retryData));
            logger.info(`🔄 Utilisateur ${userData.userId} ajouté à la queue de retry`);

        } catch (error) {
            logger.error('Erreur ajout queue retry:', error);
        }
    }

    /**
     * Traite la queue de retry (à appeler périodiquement)
     */
    static async processRetryQueue() {
        try {
            const redis = getRedisClient();
            const retryItems = await redis.lRange(this.SYNC_RETRY_KEY, 0, -1);
            
            for (const item of retryItems) {
                const retryData = JSON.parse(item);
                
                // Vérifier si c'est le moment de retry
                if (Date.now() >= retryData.nextRetry) {
                    let success = false;
                    let entityId = '';
                    let entityType = '';

                    // Déterminer le type d'entité et appeler la bonne méthode
                    if (retryData.type === 'category') {
                        success = await this.syncCategoryToGraphService(retryData);
                        entityId = retryData.categoryId;
                        entityType = 'catégorie';
                    } else {
                        // Par défaut, traiter comme utilisateur
                        success = await this.syncToGraphService(retryData);
                        entityId = retryData.userId;
                        entityType = 'utilisateur';
                    }
                    
                    if (success) {
                        // Supprimer de la queue
                        await redis.lRem(this.SYNC_RETRY_KEY, 1, item);
                        logger.info(`✅ Retry réussi pour ${entityType} ${entityId}`);
                    } else {
                        // Incrémenter le compteur de retry
                        retryData.retryCount++;
                        
                        if (retryData.retryCount >= this.MAX_RETRIES) {
                            // Supprimer après max retries
                            await redis.lRem(this.SYNC_RETRY_KEY, 1, item);
                            logger.error(`❌ Max retries atteint pour ${entityType} ${entityId}`);
                        } else {
                            // Programmer le prochain retry
                            retryData.nextRetry = Date.now() + (this.RETRY_DELAY * retryData.retryCount);
                            await redis.lRem(this.SYNC_RETRY_KEY, 1, item);
                            await redis.lPush(this.SYNC_RETRY_KEY, JSON.stringify(retryData));
                        }
                    }
                }
            }

        } catch (error) {
            logger.error('Erreur traitement queue retry:', error);
        }
    }

    /**
     * Synchronise un utilisateur existant (pour migration)
     */
    static async syncExistingUser(userId) {
        try {
            const { User } = require('../models/User');
            const user = await User.findByPk(userId);
            
            if (!user) {
                throw new Error(`Utilisateur ${userId} non trouvé`);
            }

            return await this.syncUser(user, 'CREATE');

        } catch (error) {
            logger.error(`Erreur synchronisation utilisateur existant ${userId}:`, error);
            return false;
        }
    }

    /**
     * Synchronise tous les utilisateurs (pour migration initiale)
     */
    static async syncAllUsers() {
        try {
            const { User } = require('../models/User');
            const users = await User.findAll();
            
            logger.info(`🔄 Synchronisation de ${users.length} utilisateurs vers Neo4j`);
            
            let successCount = 0;
            let errorCount = 0;

            for (const user of users) {
                const success = await this.syncUser(user, 'CREATE');
                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                }
                
                // Petite pause pour éviter de surcharger
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            logger.info(`✅ Synchronisation terminée: ${successCount} succès, ${errorCount} erreurs`);
            return { successCount, errorCount };

        } catch (error) {
            logger.error('Erreur synchronisation tous utilisateurs:', error);
            throw error;
        }
    }

    /**
     * Vérifie le statut de synchronisation d'un utilisateur
     */
    static async getSyncStatus(userId) {
        try {
            const redis = getRedisClient();
            const cacheKey = `user:${userId}`;
            const cachedData = await redis.get(cacheKey);
            
            if (cachedData) {
                return {
                    synced: true,
                    lastSync: JSON.parse(cachedData).lastSync,
                    cached: true
                };
            }

            // Vérifier dans Neo4j via Graph Service
            const response = await axios.get(`${this.GRAPH_SERVICE_URL}/users/${userId}/status`);
            
            return {
                synced: response.status === 200,
                lastSync: response.data?.lastSync,
                cached: false
            };

        } catch (error) {
            return {
                synced: false,
                error: error.message
            };
        }
    }

    // ========================================
    // MÉTHODES DE SYNCHRONISATION DES MARQUES
    // ========================================

    /**
     * Synchronise une marque vers Neo4j
     */
    static async syncBrand(brand, action = 'CREATE') {
        try {
            logger.info(`🔄 Synchronisation ${action} marque ${brand.id} vers Neo4j`);

            // Préparer les données marque pour Neo4j
            const brandData = this.prepareBrandDataForNeo4j(brand, action);

            // Tentative de synchronisation temps réel
            const success = await this.syncBrandToGraphService(brandData);

            if (success) {
                // Mettre en cache pour optimiser les futures requêtes
                await this.cacheBrandData(brand);
                logger.info(`✅ Marque ${brand.id} synchronisée avec succès`);
                return true;
            } else {
                // En cas d'échec, ajouter à la queue de retry
                await this.addBrandToRetryQueue(brandData);
                logger.warn(`⚠️ Synchronisation marque échouée, ajoutée à la queue de retry`);
                return false;
            }

        } catch (error) {
            logger.error(`❌ Erreur synchronisation marque ${brand.id}:`, error);
            
            // En cas d'erreur, ajouter à la queue de retry
            const brandData = this.prepareBrandDataForNeo4j(brand, action);
            await this.addBrandToRetryQueue(brandData);
            
            return false;
        }
    }

    /**
     * Synchronise directement une marque avec le Graph Service
     */
    static async syncBrandToGraphService(brandData) {
        try {
            const response = await axios.post(
                `${this.GRAPH_SERVICE_URL}/sync/brand`,
                brandData,
                {
                    timeout: 10000, // 10 secondes timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.status === 200;

        } catch (error) {
            logger.error('Erreur appel Graph Service pour marque:', error.message);
            return false;
        }
    }

    /**
     * Prépare les données marque pour Neo4j
     */
    static prepareBrandDataForNeo4j(brand, action) {
        return {
            action: action, // CREATE, UPDATE, DELETE
            brandId: brand.id,
            brandData: {
                id: brand.id,
                nameAr: brand.nameAr,
                nameFr: brand.nameFr,
                descriptionAr: brand.descriptionAr,
                descriptionFr: brand.descriptionFr,
                logo: brand.logo,
                categoryId: brand.categoryId,
                isActive: brand.isActive,
                createdAt: brand.createdAt,
                updatedAt: brand.updatedAt
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Met en cache les données marque dans Redis
     */
    static async cacheBrandData(brand) {
        try {
            const redis = getRedisClient();
            const cacheKey = `brand:${brand.id}`;
            const brandData = {
                id: brand.id,
                nameAr: brand.nameAr,
                nameFr: brand.nameFr,
                descriptionAr: brand.descriptionAr,
                descriptionFr: brand.descriptionFr,
                logo: brand.logo,
                categoryId: brand.categoryId,
                isActive: brand.isActive,
                lastSync: new Date().toISOString()
            };

            // Cache pour 2 heures (marques changent moins souvent)
            await redis.setEx(cacheKey, 7200, JSON.stringify(brandData));
            logger.debug(`📦 Données marque ${brand.id} mises en cache`);

        } catch (error) {
            logger.error('Erreur mise en cache marque:', error);
        }
    }

    /**
     * Ajoute une marque à la queue de retry
     */
    static async addBrandToRetryQueue(brandData) {
        try {
            const redis = getRedisClient();
            const retryData = {
                ...brandData,
                retryCount: 0,
                nextRetry: Date.now() + this.RETRY_DELAY,
                type: 'brand' // Marquer comme marque
            };

            await redis.lPush(this.SYNC_RETRY_KEY, JSON.stringify(retryData));
            logger.info(`🔄 Marque ${brandData.brandId} ajoutée à la queue de retry`);

        } catch (error) {
            logger.error('Erreur ajout queue retry marque:', error);
        }
    }

    /**
     * Synchronise toutes les marques (pour migration initiale)
     */
    static async syncAllBrands() {
        try {
            const { Brand } = require('../models/Brand');
            const brands = await Brand.findAll();
            
            logger.info(`🔄 Synchronisation de ${brands.length} marques vers Neo4j`);
            
            let successCount = 0;
            let errorCount = 0;

            for (const brand of brands) {
                const success = await this.syncBrand(brand, 'CREATE');
                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                }
                
                // Petite pause pour éviter de surcharger
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            logger.info(`✅ Synchronisation marques terminée: ${successCount} succès, ${errorCount} erreurs`);
            return { successCount, errorCount };

        } catch (error) {
            logger.error('Erreur synchronisation toutes marques:', error);
            throw error;
        }
    }

    // ========================================
    // MÉTHODES DE SYNCHRONISATION DES CATÉGORIES
    // ========================================

    /**
     * Synchronise une catégorie vers Neo4j
     */
    static async syncCategory(category, action = 'CREATE') {
        try {
            logger.info(`🔄 Synchronisation ${action} catégorie ${category.id} vers Neo4j`);

            // Préparer les données catégorie pour Neo4j
            const categoryData = this.prepareCategoryDataForNeo4j(category, action);

            // Tentative de synchronisation temps réel
            const success = await this.syncCategoryToGraphService(categoryData);

            if (success) {
                // Mettre en cache pour optimiser les futures requêtes
                await this.cacheCategoryData(category);
                logger.info(`✅ Catégorie ${category.id} synchronisée avec succès`);
                return true;
            } else {
                // En cas d'échec, ajouter à la queue de retry
                await this.addCategoryToRetryQueue(categoryData);
                logger.warn(`⚠️ Synchronisation catégorie échouée, ajoutée à la queue de retry`);
                return false;
            }

        } catch (error) {
            logger.error(`❌ Erreur synchronisation catégorie ${category.id}:`, error);
            
            // En cas d'erreur, ajouter à la queue de retry
            const categoryData = this.prepareCategoryDataForNeo4j(category, action);
            await this.addCategoryToRetryQueue(categoryData);
            
            return false;
        }
    }

    /**
     * Synchronise directement une catégorie avec le Graph Service
     */
    static async syncCategoryToGraphService(categoryData) {
        try {
            const response = await axios.post(
                `${this.GRAPH_SERVICE_URL}/sync/category`,
                categoryData,
                {
                    timeout: 10000, // 10 secondes timeout
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.status === 200;

        } catch (error) {
            logger.error('Erreur appel Graph Service pour catégorie:', error.message);
            return false;
        }
    }

    /**
     * Prépare les données catégorie pour Neo4j
     */
    static prepareCategoryDataForNeo4j(category, action) {
        return {
            action: action, // CREATE, UPDATE, DELETE
            categoryId: category.id,
            categoryData: {
                id: category.id,
                parentId: category.parentId,
                nameAr: category.nameAr,
                nameFr: category.nameFr,
                descriptionAr: category.descriptionAr,
                descriptionFr: category.descriptionFr,
                image: category.image,
                icon: category.icon,
                gender: category.gender,
                ageMin: category.ageMin,
                ageMax: category.ageMax,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Met en cache les données catégorie dans Redis
     */
    static async cacheCategoryData(category) {
        try {
            const redis = getRedisClient();
            const cacheKey = `category:${category.id}`;
            const categoryData = {
                id: category.id,
                parentId: category.parentId,
                nameAr: category.nameAr,
                nameFr: category.nameFr,
                gender: category.gender,
                ageMin: category.ageMin,
                ageMax: category.ageMax,
                lastSync: new Date().toISOString()
            };

            // Cache pour 2 heures (catégories changent moins souvent)
            await redis.setEx(cacheKey, 7200, JSON.stringify(categoryData));
            logger.debug(`📦 Données catégorie ${category.id} mises en cache`);

        } catch (error) {
            logger.error('Erreur mise en cache catégorie:', error);
        }
    }

    /**
     * Ajoute une catégorie à la queue de retry
     */
    static async addCategoryToRetryQueue(categoryData) {
        try {
            const redis = getRedisClient();
            const retryData = {
                ...categoryData,
                retryCount: 0,
                nextRetry: Date.now() + this.RETRY_DELAY,
                type: 'category' // Marquer comme catégorie
            };

            await redis.lPush(this.SYNC_RETRY_KEY, JSON.stringify(retryData));
            logger.info(`🔄 Catégorie ${categoryData.categoryId} ajoutée à la queue de retry`);

        } catch (error) {
            logger.error('Erreur ajout queue retry catégorie:', error);
        }
    }

    /**
     * Synchronise toutes les catégories (pour migration initiale)
     */
    static async syncAllCategories() {
        try {
            const { Category } = require('../models/Category');
            const categories = await Category.findAll();
            
            logger.info(`🔄 Synchronisation de ${categories.length} catégories vers Neo4j`);
            
            let successCount = 0;
            let errorCount = 0;

            for (const category of categories) {
                const success = await this.syncCategory(category, 'CREATE');
                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                }
                
                // Petite pause pour éviter de surcharger
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            logger.info(`✅ Synchronisation catégories terminée: ${successCount} succès, ${errorCount} erreurs`);
            return { successCount, errorCount };

        } catch (error) {
            logger.error('Erreur synchronisation toutes catégories:', error);
            throw error;
        }
    }

    /**
     * Synchronise une catégorie existante (pour migration)
     */
    static async syncExistingCategory(categoryId) {
        try {
            const { Category } = require('../models/Category');
            const category = await Category.findByPk(categoryId);
            
            if (!category) {
                throw new Error(`Catégorie ${categoryId} non trouvée`);
            }

            return await this.syncCategory(category, 'CREATE');

        } catch (error) {
            logger.error(`Erreur synchronisation catégorie existante ${categoryId}:`, error);
            return false;
        }
    }

    /**
     * Vérifie le statut de synchronisation d'une catégorie
     */
    static async getCategorySyncStatus(categoryId) {
        try {
            const redis = getRedisClient();
            const cacheKey = `category:${categoryId}`;
            const cachedData = await redis.get(cacheKey);
            
            if (cachedData) {
                return {
                    synced: true,
                    lastSync: JSON.parse(cachedData).lastSync,
                    cached: true
                };
            }

            // Vérifier dans Neo4j via Graph Service
            const response = await axios.get(`${this.GRAPH_SERVICE_URL}/categories/${categoryId}/status`);
            
            return {
                synced: response.status === 200,
                lastSync: response.data?.lastSync,
                cached: false
            };

        } catch (error) {
            return {
                synced: false,
                error: error.message
            };
        }
    }

    /**
     * Synchronise une offre vers Neo4j (temps réel)
     */
    static async syncOffer(offerId, offerData, action = 'CREATE') {
        try {
            logger.info(`🔄 Synchronisation ${action} offre ${offerId} vers Neo4j`);

            // Préparer les données d'offre pour Neo4j
            const syncData = this.prepareOfferDataForNeo4j(offerId, offerData, action);

            // Tentative de synchronisation temps réel
            const success = await this.syncToGraphService(syncData);

            if (success) {
                logger.info(`✅ Offre ${offerId} synchronisée avec succès`);
                return true;
            } else {
                // En cas d'échec, ajouter à la queue de retry
                await this.addToRetryQueue(syncData);
                logger.warn(`⚠️ Synchronisation échouée, ajouté à la queue de retry`);
                return false;
            }

        } catch (error) {
            logger.error(`❌ Erreur synchronisation offre ${offerId}:`, error);
            
            // En cas d'erreur, ajouter à la queue de retry
            const syncData = this.prepareOfferDataForNeo4j(offerId, offerData, action);
            await this.addToRetryQueue(syncData);
            
            return false;
        }
    }

    /**
     * Prépare les données d'offre pour Neo4j
     */
    static prepareOfferDataForNeo4j(offerId, offerData, action) {
        return {
            type: 'OFFER',
            action: action,
            data: {
                offerId: offerId,
                offerData: {
                    title: offerData.title,
                    description: offerData.description,
                    price: offerData.price,
                    status: offerData.status,
                    productCondition: offerData.productCondition,
                    listingType: offerData.listingType,
                    sellerId: offerData.sellerId,
                    categoryId: offerData.categoryId,
                    brandId: offerData.brandId,
                    subjectId: offerData.subjectId,
                    addressId: offerData.addressId,
                    images: offerData.images,
                    specificData: offerData.specificData,
                    isDeleted: offerData.isDeleted,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Synchronise une relation offre-catégorie vers Neo4j (temps réel)
     */
    static async syncOfferCategoryRelation(offerId, categoryId, action = 'CREATE') {
        try {
            logger.info(`🔄 Synchronisation ${action} relation offre-catégorie ${offerId}-${categoryId} vers Neo4j`);

            // Préparer les données de relation pour Neo4j
            const relationData = this.prepareOfferCategoryRelationDataForNeo4j(offerId, categoryId, action);

            // Tentative de synchronisation temps réel
            const success = await this.syncToGraphService(relationData);

            if (success) {
                logger.info(`✅ Relation offre-catégorie ${offerId}-${categoryId} synchronisée avec succès`);
                return true;
            } else {
                // En cas d'échec, ajouter à la queue de retry
                await this.addToRetryQueue(relationData);
                logger.warn(`⚠️ Synchronisation échouée, ajouté à la queue de retry`);
                return false;
            }

        } catch (error) {
            logger.error(`❌ Erreur synchronisation relation offre-catégorie ${offerId}-${categoryId}:`, error);
            
            // En cas d'erreur, ajouter à la queue de retry
            const relationData = this.prepareOfferCategoryRelationDataForNeo4j(offerId, categoryId, action);
            await this.addToRetryQueue(relationData);
            
            return false;
        }
    }

    /**
     * Prépare les données de relation offre-catégorie pour Neo4j
     */
    static prepareOfferCategoryRelationDataForNeo4j(offerId, categoryId, action) {
        return {
            type: 'OFFER_CATEGORY_RELATION',
            action: action,
            data: {
                offerId: offerId,
                categoryId: categoryId,
                timestamp: new Date().toISOString()
            }
        };
    }
}

module.exports = Neo4jSyncService;
