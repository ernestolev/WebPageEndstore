import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase';
import styles from '../../styles/Admin.module.css';
import ProductList from '../../components/ProductList';
import ProductForm from '../../components/ProductForm';

const Products = () => {
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showDiscounted, setShowDiscounted] = useState(false);
    const [categories, setCategories] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0); // Add this line

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'Categorias'));
                const categoriesData = querySnapshot.docs.map(doc => doc.data().name);
                setCategories(categoriesData);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    const handleEdit = (product) => {
        setEditProduct(product);
        setIsProductFormOpen(true);
    };

    return (
        <>
            <header className={styles.contentHeader}>
                <h1>Productos</h1>
                <div className={styles.headerActions}>
                    <button
                        className={styles.addButton}
                        onClick={() => setIsProductFormOpen(true)}
                    >
                        <i className="fas fa-plus"></i>
                        Nuevo Producto
                    </button>
                </div>
            </header>

            <div className={styles.filterSection}>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.filters}>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={styles.categoryFilter}
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map((category, index) => (
                            <option key={index} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <label className={styles.discountFilter}>
                        <input
                            type="checkbox"
                            checked={showDiscounted}
                            onChange={(e) => setShowDiscounted(e.target.checked)}
                        />
                        Solo productos con descuento
                    </label>
                </div>
            </div>

            <ProductList
                onEdit={handleEdit}
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
                showDiscounted={showDiscounted}
                refreshKey={refreshKey} // Add this prop
            />

            <ProductForm
                isOpen={isProductFormOpen}
                onClose={() => {
                    setIsProductFormOpen(false);
                    setEditProduct(null);
                }}
                editProduct={editProduct}
                onRefresh={handleRefresh} // Add this prop
            />
        </>
    );
};

export default Products;