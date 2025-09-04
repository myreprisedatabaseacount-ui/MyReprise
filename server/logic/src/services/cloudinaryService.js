const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");
dotenv.config();

// Configuration Cloudinary avec gestion d'erreur
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || 'demo',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
  });
  console.log('✅ Configuration Cloudinary initialisée');
} catch (configError) {
  console.error('❌ Erreur configuration Cloudinary:', configError);
}

const uploadFile = async (filePath, folder = "", options = {}) => {
  try {
    console.log('🔄 Upload fichier vers Cloudinary:', filePath);
    
    const defaultOptions = {
      folder,          // permet d'uploader dans un dossier Cloudinary spécifique
      resource_type: "auto", // gère image ou vidéo automatiquement
      ...options
    };
    
    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    console.log('✅ Fichier uploadé avec succès:', result.secure_url);
    return result;
  } catch (error) {
    console.error('❌ Erreur upload fichier:', error);
    throw new Error(`Erreur upload Cloudinary: ${error.message}`);
  }
};

const uploadFromBuffer = async (buffer, folder = "", options = {}) => {
  try {
    console.log('🔄 Upload buffer vers Cloudinary, taille:', buffer.length);
    
    const defaultOptions = {
      folder,
      resource_type: "auto",
      ...options
    };
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        defaultOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Erreur upload stream:', error);
            reject(new Error(`Erreur upload Cloudinary: ${error.message}`));
          } else {
            console.log('✅ Buffer uploadé avec succès:', result.secure_url);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(buffer);
    });
  } catch (error) {
    console.error('❌ Erreur upload buffer:', error);
    throw new Error(`Erreur upload Cloudinary: ${error.message}`);
  }
};

const deleteFile = async (publicId) => {
  try {
    console.log('🔄 Suppression fichier Cloudinary:', publicId);
    
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('✅ Fichier supprimé avec succès:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression fichier:', error);
    throw new Error(`Erreur suppression Cloudinary: ${error.message}`);
  }
};

const deleteMultipleFiles = async (publicIds) => {
  try {
    console.log('🔄 Suppression multiple fichiers Cloudinary:', publicIds);
    
    const result = await cloudinary.api.delete_resources(publicIds);
    console.log('✅ Fichiers supprimés avec succès:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur suppression multiple fichiers:', error);
    throw new Error(`Erreur suppression multiple Cloudinary: ${error.message}`);
  }
};

module.exports = { uploadFile, uploadFromBuffer, deleteFile, deleteMultipleFiles };