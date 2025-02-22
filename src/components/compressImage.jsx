import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.3, // Reduced max size
    maxWidthOrHeight: 800, // Reduced dimensions
    useWebWorker: true,
    fileType: 'image/jpeg',
    quality: 0.7 // Reduced quality
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};