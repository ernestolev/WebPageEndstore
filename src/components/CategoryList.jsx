import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/CategoryList.module.css';
import ConfirmationModal from './ConfirmationModal';

const CategoryList = ({ onEdit }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, categoryId: null });

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'Categorias'),
            (snapshot) => {
                const categoriesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCategories(categoriesData);
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching categories:', error);
                setError('Error al cargar las categorías');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleDeleteClick = (categoryId) => {
        setDeleteModal({ show: true, categoryId });
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteDoc(doc(db, 'Categorias', deleteModal.categoryId));
            setDeleteModal({ show: false, categoryId: null });
        } catch (error) {
            console.error('Error deleting category:', error);
            setError('Error al eliminar la categoría');
        }
    };

    if (loading) return <div>Cargando categorías...</div>;
    if (error) return <div>{error}</div>;

    return (
        <>
            <div className={styles.categoryGrid}>
                {categories.map(category => (
                    <div key={category.id} className={styles.categoryCard}>
                        <div className={styles.imageContainer}>
                            <img src={category.images[0]} alt={category.name} />
                        </div>
                        <div className={styles.categoryInfo}>
                            <h3>{category.name}</h3>
                            <p>{category.description}</p>
                        </div>
                        <div className={styles.actions}>
                            <button
                                className={styles.editButton}
                                onClick={() => onEdit(category)}
                            >
                                <i className="fas fa-edit"></i>
                            </button>
                            <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteClick(category.id)}
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmationModal
                isOpen={deleteModal.show}
                onClose={() => setDeleteModal({ show: false, categoryId: null })}
                onConfirm={handleDeleteConfirm}
                title="Eliminar Categoría"
                message="¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer."
            />
        </>
    );
};

export default CategoryList;