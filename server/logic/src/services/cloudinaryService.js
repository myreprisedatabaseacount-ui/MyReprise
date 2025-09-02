const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFile = async (filePath, folder = "", options = {}) => {
  const defaultOptions = {
    folder,          // permet d'uploader dans un dossier Cloudinary spécifique
    resource_type: "auto", // gère image ou vidéo automatiquement
    ...options
  };
  
  return await cloudinary.uploader.upload(filePath, defaultOptions);
};

const uploadFromBuffer = async (buffer, folder = "", options = {}) => {
  const defaultOptions = {
    folder,
    resource_type: "auto",
    ...options
  };
  
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

module.exports = { uploadFile, uploadFromBuffer };