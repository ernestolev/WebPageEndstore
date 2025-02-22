import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/jpeg',
    quality: 0.7
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};