import React, { useState, useEffect } from 'react';
import { db } from '../Firebase';
import { collection, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import styles from '../styles/ProductForm.module.css';
import ImagePreview from './ImagePreview';
import { compressImage } from '../utils/imageCompressor'; // Update this import path

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

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            setLoading(true);
            setError('');

            // Check total images limit
            if (existingImages.length + files.length > 5) {
                throw new Error('No puedes subir más de 5 imágenes en total');
            }

            const processFiles = files.map(async (file) => {
                try {
                    // Always compress images, regardless of type
                    const compressedFile = await compressImage(file);

                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = () => reject(new Error('Error al leer el archivo'));
                        reader.readAsDataURL(compressedFile);
                    });
                } catch (error) {
                    console.error('Error processing file:', error);
                    throw new Error(`Error al procesar ${file.name}`);
                }
            });

            const base64Results = await Promise.all(processFiles);
            setExistingImages(prev => [...prev, ...base64Results]);

        } catch (error) {
            setError(error.message);
            console.error('Error handling images:', error);
        } finally {
            setLoading(false);
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
            // Validate images
            if (existingImages.length < 2) {
                throw new Error('Debes incluir al menos 2 imágenes');
            }
            if (existingImages.length > 5) {
                throw new Error('No puedes tener más de 5 imágenes');
            }

            const productData = {
                ...formData,
                images: existingImages, // Use existing images directly
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                sizes: hasSizes ? sizesStock : null,
                hasSizes,
                updatedAt: new Date()
            };

            if (editProduct) {
                await updateDoc(doc(db, 'Productos', editProduct.id), productData);
            } else {
                await addDoc(collection(db, 'Productos'), productData);
            }

            onRefresh?.();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error saving product:', error);
            setError(error.message);
        } finally {
            setLoading(false);
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