import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/CartSlideout.module.css';

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
        SHIPPING_COST  // Add this line
    } = useCart();

    const [productsData, setProductsData] = useState({});

    // Fetch product data for each cart item
    useEffect(() => {
        const fetchProductsData = async () => {
            const newProductsData = {};
            for (const item of cart) {
                if (!productsData[item.productId]) {
                    try {
                        const docRef = doc(db, 'Productos', item.productId);
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            newProductsData[item.productId] = docSnap.data();
                        }
                    } catch (error) {
                        console.error('Error fetching product:', error);
                    }
                }
            }
            setProductsData(prev => ({ ...prev, ...newProductsData }));
        };

        fetchProductsData();
    }, [cart]);

    const handleSizeChange = async (productId, currentSize, newSize) => {
        const product = productsData[productId];
        if (!product) return;

        // Check if new size has stock
        if (product.sizes[newSize] > 0) {
            removeFromCart(productId, currentSize);
            const item = cart.find(i => i.productId === productId && i.size === currentSize);
            if (item) {
                const productWithId = { ...product, id: productId };
                addToCart(productWithId, item.quantity, newSize);
            }
        }
    };

    if (!isCartOpen) return null;

    return (
        <>
            <div className={styles.overlay} onClick={() => setIsCartOpen(false)} />
            <div className={styles.slideout}>
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
                            {cart.map((item) => {
                                const product = productsData[item.productId];
                                return (
                                    <div key={`${item.productId}-${item.size}`} className={styles.item}>
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className={styles.itemImage}
                                        />
                                        <div className={styles.itemInfo}>
                                            <h3>{item.name}</h3>
                                            {product && (
                                                <div className={styles.sizeSelector}>
                                                    <select
                                                        value={item.size}
                                                        onChange={(e) => handleSizeChange(
                                                            item.productId,
                                                            item.size,
                                                            e.target.value
                                                        )}
                                                        className={styles.sizeSelect}
                                                    >
                                                        {Object.entries(product.sizes).map(([size, stock]) => (
                                                            <option
                                                                key={size}
                                                                value={size}
                                                                disabled={stock === 0}
                                                            >
                                                                {size} {stock === 0 ? '(Agotado)' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            <div className={styles.priceRow}>
                                                {item.discount > 0 ? (
                                                    <>
                                                        <span className={styles.originalPrice}>
                                                            S/. {item.originalPrice.toFixed(2)}
                                                        </span>
                                                        <span className={styles.price}>
                                                            S/. {item.price.toFixed(2)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className={styles.price}>
                                                        S/. {item.price.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.itemActions}>
                                            <div className={styles.quantity}>
                                                <button
                                                    onClick={() => updateQuantity(
                                                        item.productId,
                                                        item.size,
                                                        item.quantity - 1
                                                    )}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(
                                                        item.productId,
                                                        item.size,
                                                        item.quantity + 1
                                                    )}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                className={styles.removeButton}
                                                onClick={() => removeFromCart(item.productId, item.size)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
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
                                        Te faltan S/. {(SHIPPING_THRESHOLD - getSubtotal()).toFixed(2)} para envío gratis
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
                                Proceder al pago
                            </Link>
                        </footer>
                    </>
                ) : (
                    <div className={styles.emptyCart}>
                        <i className="fas fa-shopping-cart"></i>
                        <p>Tu carrito está vacío</p>
                        <button
                            className={styles.continueButton}
                            onClick={() => setIsCartOpen(false)}
                        >
                            Continuar comprando
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartSlideout;