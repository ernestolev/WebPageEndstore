import React, { useState, useEffect } from 'react';
import { db, storage } from '../Firebase';
import { collection, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import styles from '../styles/ProductForm.module.css';
import ImagePreview from './ImagePreview';
import { compressImage } from '../utils/imageCompressor';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const FIT_TYPES = ['Normal', 'Oversize', 'Ambos'];

const ProductForm = ({ isOpen, onClose, editProduct = null, onRefresh }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        stock: 0,
        description: '',
        price: 0,
        discount: 0,
        sizes: {},
        images: [],
        // Add fitType field
        fitType: 'Normal'
    });
    const [hasSizes, setHasSizes] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [sizesStock, setSizesStock] = useState({
        S: 0, M: 0, L: 0, XL: 0, XXL: 0
    });
    const [existingImages, setExistingImages] = useState([]);
    const [categories, setCategories] = useState([]);

    const [uploadProgress, setUploadProgress] = useState(0);

    const handleSizeChange = (size, value) => {
        const newValue = parseInt(value) || 0;
        const newSizesStock = { ...sizesStock, [size]: newValue };
        setSizesStock(newSizesStock);

        // Validate total stock
        const totalSizeStock = Object.values(newSizesStock).reduce((a, b) => a + b, 0);
        if (totalSizeStock > formData.stock) {
            setError('La suma de tallas excede el stock total');
        } else {
            setError('');
            setFormData(prev => ({
                ...prev,
                sizes: newSizesStock
            }));
        }
    };

    const uploadImageToStorage = async (base64Image, index) => {
        try {
            // Convertir base64 a Blob
            const base64Data = base64Image.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);

            for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/jpeg' });

            // Crear una referencia única con timestamp y número aleatorio para evitar colisiones
            const fileName = `products/${Date.now()}_${Math.floor(Math.random() * 10000)}_${index}.jpg`;

            // No intentar obtener el nombre del bucket, simplemente usar la referencia de storage
            console.log(`Subiendo imagen ${index} a Firebase Storage`);

            // Intenta usar el bucket correcto
            const storageRef = ref(storage, fileName);

            // Configurar metadata
            const metadata = {
                contentType: 'image/jpeg',
                cacheControl: 'public, max-age=31536000'
            };

            // Intenta subir usando el método normal
            try {
                const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

                return new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log(`Progreso de subida ${index}: ${progress.toFixed(2)}%`);
                        },
                        (error) => {
                            console.error(`Error en método normal para imagen ${index}:`, error);
                            reject(error);
                        },
                        async () => {
                            try {
                                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                console.log(`Imagen ${index} subida con éxito: ${downloadURL.substring(0, 50)}...`);
                                resolve(downloadURL);
                            } catch (urlError) {
                                console.error(`Error obteniendo URL de imagen ${index}:`, urlError);
                                reject(urlError);
                            }
                        }
                    );
                });
            } catch (primaryError) {
                console.error("Error en método primario de subida:", primaryError);
                throw primaryError;
            }
        } catch (error) {
            console.error(`Error general en uploadImageToStorage para imagen ${index}:`, error);
            throw error;
        }
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'Categorias'));
                const categoriesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setCategories(categoriesData);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    // Reemplaza la función handleImageChange en ProductForm.jsx
    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            setLoading(true);
            setError('');
            setUploadProgress(10); // Iniciar progreso

            // Check total images limit
            if (existingImages.length + files.length > 5) {
                throw new Error('No puedes subir más de 5 imágenes en total');
            }

            // Validar tamaño antes de comprimir
            for (const file of files) {
                const sizeMB = file.size / 1024 / 1024;
                if (sizeMB > 20) {
                    throw new Error(`La imagen ${file.name} es demasiado grande (${sizeMB.toFixed(1)}MB). Máximo 20MB por imagen.`);
                }
            }

            setUploadProgress(20); // Actualizar progreso

            const processFiles = files.map(async (file, index) => {
                try {
                    // Mostrar información de la imagen original
                    console.log(`Procesando imagen ${index + 1}/${files.length}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

                    // Actualizar progreso por cada imagen
                    setUploadProgress(20 + Math.floor((index / files.length) * 60));

                    // Comprimir la imagen
                    const compressedFile = await compressImage(file);

                    // Verificar si la imagen comprimida es menor de 1MB
                    if (compressedFile.size > 1024 * 1024) {
                        console.warn(`La imagen comprimida sigue siendo grande: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

                        // Importamos browser-image-compression dinámicamente
                        const imageCompression = await import('browser-image-compression').then(module => module.default);

                        // Comprimir más agresivamente
                        const moreCompressed = await imageCompression(compressedFile, {
                            maxSizeMB: 0.5,
                            maxWidthOrHeight: 1000,
                            useWebWorker: true,
                            initialQuality: 0.7
                        });

                        console.log(`Imagen re-comprimida a: ${(moreCompressed.size / 1024 / 1024).toFixed(2)}MB`);
                        return moreCompressed;
                    }

                    return compressedFile;
                } catch (error) {
                    console.error(`Error procesando imagen ${file.name}:`, error);
                    throw new Error(`Error al procesar ${file.name}: ${error.message}`);
                }
            });

            const compressedFiles = await Promise.all(processFiles);

            // Convertir a base64
            const base64Results = await Promise.all(compressedFiles.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error(`Error al leer ${file.name || 'archivo'}`));
                    reader.readAsDataURL(file);
                });
            }));

            setExistingImages(prev => [...prev, ...base64Results]);
            setUploadProgress(100); // Completado

            // Mensaje de éxito
            setError(`${files.length} imagen(es) procesada(s) exitosamente`);
            setTimeout(() => setError(''), 3000); // Limpiar mensaje después de 3 segundos

        } catch (error) {
            setError(error.message);
            console.error('Error handling images:', error);
        } finally {
            setLoading(false);
            setTimeout(() => setUploadProgress(0), 1000); // Resetear progreso
        }
    };

    const convertImagesToBase64 = async (files) => {
        const base64Promises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(file);
            });
        });

        return Promise.all(base64Promises);
    };

    const uploadImages = async () => {
        const uploadPromises = imageFiles.map(async (file) => {
            const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        // Progress function
                    },
                    (error) => reject(error),
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    }
                );
            });
        });

        return Promise.all(uploadPromises);
    };

    useEffect(() => {
        if (editProduct) {
            setFormData({
                ...editProduct,
                // Ensure fitType has a default value if it doesn't exist
                fitType: editProduct.fitType || 'Normal'
            });
            setSizesStock(editProduct.sizes || {});
            setExistingImages(editProduct.images || []);
            setHasSizes(editProduct.hasSizes ?? true);
        } else {
            resetForm();
        }
    }, [editProduct, isOpen]);

    const handleRemoveImage = (index) => {
        setExistingImages(prev => {
            const newImages = [...prev];
            newImages.splice(index, 1);
            return newImages;
        });
        setError(''); // Clear any existing errors
    };

    // Update resetForm function
    const resetForm = () => {
        setFormData({
            name: '',
            category: '',
            stock: 0,
            description: '',
            price: 0,
            discount: 0,
            sizes: {},
            images: [],
            hasSizes: true,
            fitType: 'Normal'  // Add default value
        });
        setSizesStock({
            S: 0, M: 0, L: 0, XL: 0, XXL: 0
        });
        setExistingImages([]);
        setHasSizes(true);
        setImageFiles([]);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validaciones básicas
            if (!formData.name || !formData.description || !formData.price) {
                throw new Error('Todos los campos obligatorios deben estar completos');
            }

            if (existingImages.length === 0) {
                throw new Error('Debes incluir al menos una imagen');
            }

            let finalImages = [];

            // Procesar imágenes existentes (URLs)
            const existingUrls = existingImages.filter(img => img.startsWith('http'));
            finalImages = [...existingUrls];

            // Procesar imágenes nuevas (base64)
            const newImages = existingImages.filter(img => img.startsWith('data:'));

            if (newImages.length > 0) {
                setUploadProgress(10);
                console.log(`Procesando ${newImages.length} imágenes nuevas...`);

                // Subir cada imagen secuencialmente para mejor control de errores
                for (let i = 0; i < newImages.length; i++) {
                    const image = newImages[i];
                    setUploadProgress(10 + Math.floor((i / newImages.length) * 80));

                    try {
                        console.log(`Intentando subir imagen ${i + 1} de ${newImages.length}...`);
                        const imageUrl = await uploadImageToStorage(image, i);
                        finalImages.push(imageUrl);
                        console.log(`Imagen ${i + 1} procesada correctamente`);
                    } catch (imgError) {
                        console.error(`Error subiendo imagen ${i + 1}:`, imgError);

                        // Si falla la subida a Storage, intentamos comprimir más la imagen para usar base64
                        console.warn(`Intentando comprimir imagen ${i + 1} para uso directo...`);
                        try {
                            // Intentamos comprimir la imagen significativamente más para que quepa en Firestore
                            const response = await fetch(image);
                            const blob = await response.blob();

                            // Importar dinámicamente para evitar problemas
                            const imageCompression = await import('browser-image-compression').then(module => module.default);

                            // Comprimir con opciones muy agresivas
                            const compressedFile = await imageCompression(blob, {
                                maxSizeMB: 0.2,  // 200KB máximo
                                maxWidthOrHeight: 800,
                                useWebWorker: true,
                                initialQuality: 0.5
                            });

                            // Convertir a base64
                            const reader = new FileReader();
                            const base64Small = await new Promise((resolve) => {
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(compressedFile);
                            });

                            // Verificar el tamaño del string base64
                            if (base64Small.length > 900000) { // Cerca del límite de Firestore
                                console.error(`La imagen ${i + 1} sigue siendo demasiado grande después de la compresión`);
                                throw new Error(`La imagen ${i + 1} es demasiado grande para ser almacenada`);
                            }

                            console.log(`Imagen ${i + 1} comprimida exitosamente como fallback`);
                            finalImages.push(base64Small);
                        } catch (fallbackError) {
                            console.error(`Error en el fallback para la imagen ${i + 1}:`, fallbackError);
                            throw new Error(`No se pudo procesar la imagen ${i + 1}. Por favor, intenta con una imagen más pequeña.`);
                        }
                    }
                }

                setUploadProgress(90);
                console.log(`Todas las imágenes procesadas. Total: ${finalImages.length}`);
            }

            // Limitar a 5 imágenes máximo
            if (finalImages.length > 5) {
                console.log(`Limitando de ${finalImages.length} a 5 imágenes`);
                finalImages = finalImages.slice(0, 5);
            }

            if (finalImages.length === 0) {
                throw new Error('No se pudo procesar ninguna imagen. Por favor, intenta con imágenes más pequeñas.');
            }

            // Preparar datos del producto
            const productData = {
                ...formData,
                images: finalImages,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                sizes: hasSizes ? sizesStock : null,
                hasSizes,
                updatedAt: new Date()
            };

            console.log('Guardando producto en Firestore...');

            // Guardar en Firestore
            if (editProduct) {
                await updateDoc(doc(db, 'Productos', editProduct.id), productData);
                console.log(`Producto actualizado con ID: ${editProduct.id}`);
            } else {
                const docRef = await addDoc(collection(db, 'Productos'), productData);
                console.log(`Nuevo producto creado con ID: ${docRef.id}`);
            }

            setUploadProgress(100);

            // Mostrar mensaje de éxito durante 1 segundo antes de cerrar
            setError('¡Producto guardado exitosamente!');
            setTimeout(() => {
                onRefresh?.();
                onClose();
                resetForm();
            }, 1000);

        } catch (error) {
            console.error('Error saving product:', error);
            setError(error.message || 'Ha ocurrido un error al guardar el producto');
        } finally {
            // No reseteamos el progreso inmediatamente para mostrar la barra completa
            setTimeout(() => {
                setLoading(false);
                setUploadProgress(0);
            }, 1000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>

                <h2>Nuevo Producto</h2>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formoverf}>
                        <div className={styles.formGroup}>
                            <label>Nombre del Producto</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Categoría</label>
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Seleccionar categoría</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {formData.category === 'Polo' && (
                            <div className={styles.formGroup}>
                                <label>Tipo de Fit</label>
                                <select
                                    value={formData.fitType}
                                    onChange={(e) => setFormData({ ...formData, fitType: e.target.value })}
                                    required
                                >
                                    {FIT_TYPES.map(type => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label>Stock Total</label>
                            <input
                                type="number"
                                required
                                min="0" // Changed from min="1" to min="0"
                                value={formData.stock}
                                onChange={(e) => {
                                    const newStock = parseInt(e.target.value) || 0;
                                    setFormData({ ...formData, stock: newStock });
                                    // If stock is 0, reset all sizes to 0
                                    if (newStock === 0) {
                                        const resetSizes = Object.keys(sizesStock).reduce((acc, size) => {
                                            acc[size] = 0;
                                            return acc;
                                        }, {});
                                        setSizesStock(resetSizes);
                                    }
                                }}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={hasSizes}
                                    onChange={(e) => {
                                        setHasSizes(e.target.checked);
                                        if (!e.target.checked) {
                                            setSizesStock({
                                                S: 0, M: 0, L: 0, XL: 0, XXL: 0
                                            });
                                        }
                                    }}
                                />
                                Producto con tallas
                            </label>
                        </div>
                        {hasSizes && (
                            <div className={styles.sizesGrid}>
                                <h3>Distribución por Tallas</h3>
                                {SIZES.map(size => (
                                    <div key={size} className={styles.sizeInput}>
                                        <label>{size}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={sizesStock[size]}
                                            onChange={(e) => handleSizeChange(size, e.target.value)}
                                            disabled={formData.stock === 0} // Disable if stock is 0
                                            className={formData.stock === 0 ? styles.inputDisabled : ''}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}



                        <div className={styles.formGroup}>
                            <label>Precio (S/.)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Descuento (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.discount || 0}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    discount: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Descripción</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Imágenes (2-5 imágenes)</label>
                            <ImagePreview
                                images={existingImages}
                                onRemove={handleRemoveImage}
                            />
                            <div className={styles.imageUploadContainer}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className={styles.imageInput}
                                    disabled={existingImages.length >= 5}
                                />
                                <small className={styles.imageHelp}>
                                    {`${existingImages.length} de 5 imágenes seleccionadas (mínimo 2)`}
                                </small>
                                {loading && (
                                    <div className={styles.uploadProgress}>
                                        Procesando imagen...
                                    </div>
                                )}
                            </div>
                            {(loading || uploadProgress > 0) && (
                                <div className={styles.progressContainer}>
                                    <div
                                        className={styles.progressBar}
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                    <span className={styles.progressText}>
                                        {loading ?
                                            (uploadProgress > 0 ?
                                                `Subiendo imágenes: ${Math.round(uploadProgress)}%` :
                                                "Procesando...") :
                                            "Completado"}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar Producto'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProductForm;