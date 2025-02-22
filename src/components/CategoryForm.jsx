import React, { useState, useEffect } from 'react';
import { db } from '../Firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import styles from '../styles/CategoryForm.module.css';
import ImagePreview from './ImagePreview';
import { compressImage } from '../utils/imageCompressor';

const CategoryForm = ({ isOpen, onClose, editCategory = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        images: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [existingImages, setExistingImages] = useState([]);

    useEffect(() => {
        if (editCategory) {
            setFormData(editCategory);
            setExistingImages(editCategory.images || []);
        } else {
            setFormData({ name: '', description: '', images: [] });
            setExistingImages([]);
        }
    }, [editCategory]);

    useEffect(() => {
        if (!isOpen) {
            setFormData({ name: '', description: '', images: [] });
            setExistingImages([]);
            setError('');
        } else if (editCategory) {
            setFormData(editCategory);
            setExistingImages(editCategory.images || []);
        }
    }, [isOpen, editCategory]);

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (existingImages.length + files.length > 4) {
            setError('No puedes subir más de 4 imágenes');
            return;
        }

        setLoading(true);
        try {
            for (const file of files) {
                const compressedFile = await compressImage(file);
                const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(compressedFile);
                });
                setExistingImages(prev => [...prev, base64]);
            }
            setError('');
        } catch (error) {
            setError('Error al procesar las imágenes');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (existingImages.length < 1 || existingImages.length > 4) {
                throw new Error('Debe haber entre 1 y 4 imágenes');
            }

            const categoryData = {
                ...formData,
                images: existingImages,
                updatedAt: new Date()
            };

            if (editCategory) {
                await updateDoc(doc(db, 'Categorias', editCategory.id), categoryData);
            } else {
                await addDoc(collection(db, 'Categorias'), categoryData);
            }

            onClose();
        } catch (error) {
            console.error('Error saving category:', error);
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

                <h2>{editCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Nombre de la Categoría</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        <label>Imágenes (1-4 imágenes)</label>
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
                                disabled={existingImages.length >= 4}
                            />
                            <small className={styles.imageHelp}>
                                {`${existingImages.length} de 4 imágenes seleccionadas (mínimo 1)`}
                            </small>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : 'Guardar Categoría'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CategoryForm;