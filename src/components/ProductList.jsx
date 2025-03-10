import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/ProductList.module.css';

const ProductList = ({ onEdit, searchTerm = '', selectedCategory = '', showDiscounted = false, refreshKey }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, 'Productos'));
                const productsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setProducts(productsData);
            } catch (error) {
                console.error('Error fetching products:', error);
                setError('Error al cargar los productos');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [refreshKey]);

    const filteredProducts = products.filter(product => {
        const matchesSearch = 
            product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        const matchesDiscount = !showDiscounted || (product.discount && product.discount > 0);

        return matchesSearch && matchesCategory && matchesDiscount;
    });

    if (loading) return <div className={styles.loading}>Cargando productos...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.productList}>
            {filteredProducts.length > 0 ? (
                <div className={styles.grid}>
                    {filteredProducts.map(product => (
                        <div key={product.id} className={styles.productCard}>
                            <div className={styles.imageWrapper}>
                                <img 
                                    src={product.images[0]} 
                                    alt={product.name} 
                                    className={styles.productImage}
                                />
                                {product.discount > 0 && (
                                    <span className={styles.discountBadge}>
                                        -{product.discount}%
                                    </span>
                                )}
                                {product.stock === 0 && (
                                    <div className={styles.outOfStockOverlay}>
                                        SIN STOCK
                                    </div>
                                )}
                            </div>
                            <div className={styles.productInfo}>
                                <h3>{product.name}</h3>
                                <p className={styles.category}>{product.category}</p>
                                <div className={styles.priceContainer}>
                                    {product.discount > 0 ? (
                                        <>
                                            <span className={styles.originalPrice}>
                                                S/. {product.price.toFixed(2)}
                                            </span>
                                            <span className={styles.discountedPrice}>
                                                S/. {(product.price * (1 - product.discount / 100)).toFixed(2)}
                                            </span>
                                        </>
                                    ) : (
                                        <span className={styles.price}>
                                            S/. {product.price.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <p className={styles.stock}>Stock: {product.stock}</p>
                                <button 
                                    className={styles.editButton}
                                    onClick={() => onEdit(product)}
                                >
                                    <i className="fas fa-edit"></i> Editar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.noResults}>
                    No se encontraron productos con los filtros seleccionados
                </div>
            )}
        </div>
    );
};

export default ProductList;