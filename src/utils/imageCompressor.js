import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  // Primero analizar el tipo y tamaño original de la imagen
  const imageType = file.type;
  const originalSize = file.size / 1024 / 1024; // en MB
  
  // Estrategia adaptativa basada en el tamaño original y tipo
  let options = {
    maxSizeMB: 0.8, // Aumentado de 0.3MB a 0.8MB
    maxWidthOrHeight: 1200, // Aumentado de 800 a 1200 para mantener más detalle
    useWebWorker: true,
    initialQuality: 0.8, // Aumentado de 0.6 a 0.8
    preserveExif: false,
  };
  
  // Para imágenes PNG, que suelen ser gráficos o imágenes con transparencia
  if (imageType === 'image/png') {
    options = {
      ...options,
      maxSizeMB: 1.0, // Los PNG suelen ser más grandes pero mantienen calidad
      initialQuality: 0.9
    };
  }
  
  // Para imágenes JPEG, tratamos de mantener un buen equilibrio
  if (imageType === 'image/jpeg' || imageType === 'image/jpg') {
    // Para imágenes JPEG muy grandes, necesitamos más compresión
    if (originalSize > 5) {
      options.maxSizeMB = 0.8;
      options.initialQuality = 0.75;
    } else if (originalSize > 2) {
      options.maxSizeMB = 0.7; 
      options.initialQuality = 0.8;
    } else {
      // Para imágenes pequeñas, podemos mantener alta calidad
      options.maxSizeMB = 0.6;
      options.initialQuality = 0.85;
    }
  }
  
  try {
    console.log(`Comprimiendo imagen: ${file.name} (${originalSize.toFixed(2)}MB) con calidad ${options.initialQuality}`);
    const compressedFile = await imageCompression(file, options);
    const compressedSize = compressedFile.size / 1024 / 1024;
    console.log(`Compresión completada: ${compressedSize.toFixed(2)}MB (${(compressedSize/originalSize*100).toFixed(1)}% del original)`);
    
    // Verificar si el resultado cumple con los límites de Firestore
    // Si la imagen es aún mayor de 1MB pero menor que 5MB, usamos compresión progresiva
    if (compressedFile.size > 1000000 && compressedFile.size < 5000000) {
      // El archivo está entre 1MB y 5MB, lo que puede funcionar pero intentemos reducir un poco más
      console.log("La imagen es grande pero aceptable, aplicando compresión adicional conservadora");
      const secondaryOptions = {
        ...options,
        maxSizeMB: options.maxSizeMB * 0.8,
        initialQuality: options.initialQuality * 0.95, // Reducir calidad solo un poco
        maxWidthOrHeight: options.maxWidthOrHeight * 0.9 // Reducir dimensiones solo un poco
      };
      
      const secondCompression = await imageCompression(compressedFile, secondaryOptions);
      const finalSize = secondCompression.size / 1024 / 1024;
      console.log(`Compresión secundaria completada: ${finalSize.toFixed(2)}MB (${(finalSize/originalSize*100).toFixed(1)}% del original)`);
      return secondCompression;
    }
    
    // Si la imagen es muy grande (>5MB), necesitamos compresión más agresiva
    if (compressedFile.size > 5000000) {
      console.log("La imagen es demasiado grande, aplicando compresión agresiva");
      const aggressiveOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1000,
        initialQuality: 0.7,
        useWebWorker: true,
      };
      
      const aggressiveCompression = await imageCompression(compressedFile, aggressiveOptions);
      const finalSize = aggressiveCompression.size / 1024 / 1024;
      console.log(`Compresión agresiva completada: ${finalSize.toFixed(2)}MB (${(finalSize/originalSize*100).toFixed(1)}% del original)`);
      return aggressiveCompression;
    }
    
    return compressedFile;
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    throw new Error('Error al comprimir la imagen');
  }
};