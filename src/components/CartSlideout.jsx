import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/CartSlideout.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const CartSlideout = () => {
    const {
        isCartOpen,
        setIsCartOpen,
        cart,
        removeFromCart,
        updateQuantity,
        addToCart,
        getCartTotal,
        getSubtotal,
        getShippingCost,
        SHIPPING_THRESHOLD,
        SHIPPING_COST
    } = useCart();
    const { theme } = useTheme();
    const [productsData, setProductsData] = useState({});
    const [loading, setLoading] = useState(true);

    // Fetch product data for each cart item
    useEffect(() => {
        const fetchProductsData = async () => {
            if (!cart || cart.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const newProductsData = { ...productsData };

            try {
                for (const item of cart) {
                    // Only fetch if we don't already have this product data
                    if (!newProductsData[item.id]) {
                        const docRef = doc(db, 'Productos', item.id);
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            newProductsData[item.id] = {
                                ...docSnap.data(),
                                id: docSnap.id
                            };
                        }
                    }
                }
                setProductsData(newProductsData);
            } catch (error) {
                console.error('Error fetching product data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isCartOpen) {
            fetchProductsData();
        }
    }, [cart, isCartOpen]);

    // Handle size change
    const handleSizeChange = (item, newSize) => {
        const product = productsData[item.id];
        if (!product || !product.sizes || product.sizes[newSize] <= 0) return;

        // Remove old item
        removeFromCart(item.id, item.size, item.fitType);

        // Add new item with new size
        addToCart(
            { ...product, id: item.id },
            item.quantity,
            newSize,
            item.fitType
        );
    };

    // Handle fit type change
    const handleFitChange = (item, newFitType) => {
        const product = productsData[item.id];
        if (!product) return;

        // Remove old item
        removeFromCart(item.id, item.size, item.fitType);

        // Add new item with new fit type
        addToCart(
            { ...product, id: item.id },
            item.quantity,
            item.size,
            newFitType
        );
    };

    // Animation variants
    const slideoutVariants = {
        hidden: { x: '100%' },
        visible: { x: 0, transition: { type: 'tween', ease: 'easeInOut', duration: 0.3 } },
        exit: { x: '100%', transition: { type: 'tween', ease: 'easeInOut', duration: 0.3 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
    };


    if (!isCartOpen) return null;

    return (
        <>
            <div className={styles.overlay} onClick={() => setIsCartOpen(false)} />
            <AnimatePresence>
                <motion.div
                    className={styles.slideout}
                    variants={slideoutVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <header className={styles.header}>
                        <h2>Tu Carrito</h2>
                        <button
                            className={styles.closeButton}
                            onClick={() => setIsCartOpen(false)}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </header>

                    {cart.length > 0 ? (
                        <>
                            <div className={styles.items}>
                                {loading ? (
                                    <div className={styles.loadingContainer}>
                                        <div className={styles.spinner}></div>
                                        <p>Cargando productos...</p>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {cart.map((item) => {
                                            const product = productsData[item.id];
                                            return (
                                                <motion.div
                                                    key={`${item.id}-${item.size}-${item.fitType}`}
                                                    className={styles.item}
                                                    variants={itemVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="exit"
                                                    layout
                                                >
                                                    <div className={styles.itemImageContainer}>
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className={styles.itemImage}
                                                        />
                                                    </div>
                                                    <div className={styles.itemInfo}>
                                                        <h3>{item.name}</h3>
                                                        <div className={styles.itemAttributes}>
                                                            {/* Display size if available */}
                                                            {item.size && product && product.hasSizes && (
                                                                <div className={styles.attributeWrapper}>
                                                                    <div className={styles.attributeLabel}>
                                                                        Talla
                                                                    </div>
                                                                    <div className={styles.attributeSelector}>
                                                                        {Object.entries(product.sizes || {}).map(([size, stock]) => (
                                                                            <button
                                                                                key={size}
                                                                                className={`${styles.attributeOption} ${item.size === size ? styles.selected : ''
                                                                                    } ${stock === 0 && size !== item.size ? styles.disabled : ''}`}
                                                                                onClick={() => handleSizeChange(item, size)}
                                                                                disabled={stock === 0 && size !== item.size}
                                                                            >
                                                                                {size}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Display fit type if it's a polo */}
                                                            {item.fitType && product && product.category === 'Polo' && (
                                                                <div className={styles.attributeWrapper}>
                                                                    <div className={styles.attributeLabel}>
                                                                        Fit
                                                                    </div>
                                                                    <div className={styles.attributeSelector}>
                                                                        {(product.fitType === 'Ambos' ? ['Normal', 'Oversize'] : [product.fitType]).map(fit => (
                                                                            <button
                                                                                key={fit}
                                                                                className={`${styles.attributeOption} ${item.fitType === fit ? styles.selected : ''
                                                                                    }`}
                                                                                onClick={() => handleFitChange(item, fit)}
                                                                            >
                                                                                {fit}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className={styles.priceRow}>
                                                            <span className={styles.itemPrice}>
                                                                S/. {(item.price * item.quantity).toFixed(2)}
                                                            </span>
                                                            <div className={styles.quantity}>
                                                                <button
                                                                    onClick={() => updateQuantity(
                                                                        item.id,
                                                                        item.size,
                                                                        item.fitType,
                                                                        item.quantity - 1
                                                                    )}
                                                                    disabled={item.quantity <= 1}
                                                                    aria-label="Disminuir cantidad"
                                                                >
                                                                    <i className="fas fa-minus"></i>
                                                                </button>
                                                                <span>{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(
                                                                        item.id,
                                                                        item.size,
                                                                        item.fitType,
                                                                        item.quantity + 1
                                                                    )}
                                                                    aria-label="Aumentar cantidad"
                                                                >
                                                                    <i className="fas fa-plus"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className={styles.removeButton}
                                                        onClick={() => removeFromCart(item.id, item.size, item.fitType)}
                                                        aria-label="Eliminar producto"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                            </div>
                            <footer className={styles.footer}>
                                <div className={styles.summary}>
                                    <div className={styles.summaryRow}>
                                        <span>Subtotal</span>
                                        <span>S/. {getSubtotal().toFixed(2)}</span>
                                    </div>
                                    <div className={styles.summaryRow}>
                                        <span>Envío</span>
                                        {getShippingCost() === 0 ? (
                                            <span className={styles.freeShipping}>Gratis</span>
                                        ) : (
                                            <span>S/. {SHIPPING_COST.toFixed(2)}</span>
                                        )}
                                    </div>
                                    {getShippingCost() > 0 && (
                                        <div className={styles.shippingInfo}>
                                            <div className={styles.shippingProgress}>
                                                <div
                                                    className={styles.progressBar}
                                                    style={{ width: `${Math.min(100, (getSubtotal() / SHIPPING_THRESHOLD) * 100)}%` }}
                                                ></div>
                                            </div>
                                            <p>
                                                Te faltan <strong>S/. {(SHIPPING_THRESHOLD - getSubtotal()).toFixed(2)}</strong> para envío gratis
                                            </p>
                                        </div>
                                    )}
                                    <div className={`${styles.summaryRow} ${styles.total}`}>
                                        <span>Total</span>
                                        <span>S/. {getCartTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                                <Link
                                    to="/checkout"
                                    className={styles.checkoutButton}
                                    onClick={() => setIsCartOpen(false)}
                                >
                                    Proceder al pago <i className="fas fa-arrow-right"></i>
                                </Link>
                            </footer>
                        </>
                    ) : (
                        <div className={styles.emptyCart}>
                            <div className={styles.emptyCartIcon}>
                                <i className="fas fa-shopping-bag"></i>
                            </div>
                            <h3>Tu carrito está vacío</h3>
                            <p>Explora nuestro catálogo y añade productos a tu carrito</p>
                            <button
                                className={styles.continueButton}
                                onClick={() => setIsCartOpen(false)}
                            >
                                Continuar comprando
                            </button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </>
    );
};

export default CartSlideout;