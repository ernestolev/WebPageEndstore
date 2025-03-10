import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.3, // Reduced from 1MB to 0.3MB
    maxWidthOrHeight: 800, // Reduced from 1024 to 800
    useWebWorker: true,
    initialQuality: 0.6, // Reduced from 0.8 to 0.6
    preserveExif: false, // Remove EXIF data to reduce size
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // Double-check the size and compress again if needed
    if (compressedFile.size > 300000) { // If still larger than 300KB
      const extraCompressionOptions = {
        ...options,
        maxSizeMB: 0.2,
        initialQuality: 0.5,
        maxWidthOrHeight: 600
      };
      return await imageCompression(compressedFile, extraCompressionOptions);
    }
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Error al comprimir la imagen');
  }
};