import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/CartSlideout.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext'; // Add this import

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
        SHIPPING_COST,
        discountCode,
        applyDiscountCode,
        removeDiscountCode,
        discountAmount,
        loading: cartLoading
    } = useCart();
    const { theme } = useTheme();
    const { user } = useAuth(); // Add this line to get the user
    const [productsData, setProductsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [codeInput, setCodeInput] = useState('');
    const [codeStatus, setCodeStatus] = useState({ loading: false, message: '', type: '' });

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

    useEffect(() => {
        if (discountCode) {
            setCodeInput(discountCode.code);
        } else {
            setCodeInput('');
        }
    }, [discountCode]);


    useEffect(() => {
        if (cart.length > 0) {
            console.log("Estado del carrito:", cart.map(item => ({
                id: item.id,
                name: item.name,
                size: item.size,
                fitType: item.fitType,
                quantity: item.quantity
            })));
        }
    }, [cart]);


    const handleDiscountCode = async () => {
        if (!user) {
            setCodeStatus({ loading: false, message: 'Inicia sesión para usar códigos', type: 'error' });
            return;
        }

        // Reset status
        setCodeStatus({ loading: true, message: '', type: '' });

        // If empty, clear discount
        if (!codeInput.trim()) {
            removeDiscountCode();
            setCodeStatus({ loading: false, message: '', type: '' });
            return;
        }

        // If already applied this code, do nothing
        if (discountCode && discountCode.code === codeInput.trim()) {
            setCodeStatus({ loading: false, message: 'Código ya aplicado', type: 'info' });
            return;
        }

        // Format code (uppercase)
        const formattedCode = codeInput.trim().toUpperCase();

        try {
            // Query for the code
            const codesRef = collection(db, 'Codigos');
            const q = query(codesRef, where('code', '==', formattedCode));
            const querySnapshot = await getDocs(q);

            // Code not found
            if (querySnapshot.empty) {
                setCodeStatus({
                    loading: false,
                    message: 'Código no válido',
                    type: 'error'
                });
                return;
            }

            // Get code data
            const codeData = querySnapshot.docs[0].data();
            const codeId = querySnapshot.docs[0].id;

            // Check if code is active
            if (!codeData.isActive) {
                setCodeStatus({
                    loading: false,
                    message: 'Código inactivo',
                    type: 'error'
                });
                return;
            }

            // Check if code is expired
            if (codeData.validUntil) {
                const validUntil = codeData.validUntil.toDate ? codeData.validUntil.toDate() : new Date(codeData.validUntil);
                if (validUntil < new Date()) {
                    setCodeStatus({
                        loading: false,
                        message: 'Código expirado',
                        type: 'error'
                    });
                    return;
                }
            }

            // Apply discount
            applyDiscountCode({
                id: codeId,
                code: codeData.code,
                discount: codeData.discount,
                freeShipping: codeData.freeShipping || false // Asegurarse de incluir freeShipping
            });

            // Mensaje específico según si tiene envío gratis o no
            if (codeData.freeShipping) {
                setCodeStatus({
                    loading: false,
                    message: `¡${codeData.discount}% de descuento y envío gratis aplicado!`,
                    type: 'success'
                });
            } else {
                setCodeStatus({
                    loading: false,
                    message: `¡${codeData.discount}% de descuento aplicado!`,
                    type: 'success'
                });
            }
        } catch (error) {
            console.error('Error validating discount code:', error);
            setCodeStatus({
                loading: false,
                message: 'Error al validar el código',
                type: 'error'
            });
        }
    };

    const handleClearDiscountCode = () => {
        removeDiscountCode();
        setCodeInput('');
        setCodeStatus({ loading: false, message: '', type: '' });
    };

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

    const isItemOutOfStock = (item) => {
        // Para productos con tallas, verificar según la talla seleccionada
        if (item.hasSizes && item.size) {
            return (productsData[item.id]?.sizes?.[item.size] || 0) <= 0;
        }
        // Para productos sin tallas, verificar stock general
        return (productsData[item.id]?.stock || 0) <= 0;
    };

    const getStockText = (item) => {
        // Determinar stock real según tipo de producto
        const stock = item.hasSizes && item.size
            ? productsData[item.id]?.sizes?.[item.size] || 0
            : productsData[item.id]?.stock || 0;

        if (stock <= 0) {
            return "Producto agotado";
        }
        if (stock < item.quantity) {
            return `Solo hay ${stock} unidades disponibles`;
        }
        if (stock <= 5) {
            return `¡Quedan solo ${stock} unidades!`;
        }
        return null;
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
                                {cartLoading || loading ? (
                                    <div className={styles.loadingContainer}>
                                        <div className={styles.spinner}></div>
                                        <p>Cargando tu carrito...</p>
                                    </div>
                                ) : cart.length === 0 ? (
                                    <div className={styles.emptyCart}>
                                        <p>No tienes productos en tu carrito</p>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {cart.map((item) => {
                                            // Determinar stock real según tipo de producto
                                            const itemStock = item.hasSizes && item.size
                                                ? productsData[item.id]?.sizes?.[item.size] || 0
                                                : productsData[item.id]?.stock || 0;

                                            // Actualizar propiedades necesarias para verificación
                                            const itemWithStock = {
                                                ...item,
                                                stock: itemStock
                                            };

                                            const stockText = getStockText(itemWithStock);
                                            const isOutOfStock = isItemOutOfStock(itemWithStock);

                                            return (
                                                <div key={`${item.id}-${item.size}`} className={styles.cartItem}>
                                                    <div className={styles.cartItemImage}>
                                                        <img src={item.image} alt={item.name} />
                                                    </div>
                                                    <div className={styles.cartItemDetails}>
                                                        <h4>{item.name}</h4>
                                                        <div className={styles.cartItemMeta}>
                                                            {item.size && (
                                                                <span className={styles.attributeTag}>
                                                                    <i className="fas fa-ruler"></i> Talla: {item.size}
                                                                </span>
                                                            )}
                                                            {item.fitType && item.fitType !== 'Regular' && (
                                                                <span className={styles.attributeTag}>
                                                                    <i className="fas fa-tshirt"></i> Fit: {item.fitType}
                                                                </span>
                                                            )}
                                                            <span className={styles.priceTag}>
                                                                <i className="fas fa-tag"></i> S/. {item.price.toFixed(2)}
                                                            </span>
                                                        </div>
                                                        {productsData[item.id]?.hasSizes && (
                                                            <div className={styles.itemOptions}>
                                                                <div className={styles.optionsRow}>
                                                                    <span className={styles.optionsLabel}>Talla:</span>
                                                                    <div className={styles.optionsButtons}>
                                                                        {Object.entries(productsData[item.id]?.sizes || {}).map(([size, stock]) => (
                                                                            <button
                                                                                key={size}
                                                                                className={`${styles.sizeOption} ${item.size === size ? styles.selectedOption : ''
                                                                                    } ${stock <= 0 ? styles.disabledOption : ''}`}
                                                                                onClick={() => handleSizeChange(item, size)}
                                                                                disabled={stock <= 0}
                                                                                title={stock <= 0 ? 'Agotado' : `${stock} disponibles`}
                                                                            >
                                                                                {size}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {productsData[item.id]?.fitOptions && (
                                                                    <div className={styles.optionsRow}>
                                                                        <span className={styles.optionsLabel}>Fit:</span>
                                                                        <div className={styles.optionsButtons}>
                                                                            {productsData[item.id]?.fitOptions.map(fit => (
                                                                                <button
                                                                                    key={fit}
                                                                                    className={`${styles.fitOption} ${item.fitType === fit ? styles.selectedOption : ''
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
                                                        )}
                                                        <div className={styles.quantityControls}>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.size, item.fitType, Math.max(1, item.quantity - 1))}
                                                                disabled={item.quantity <= 1}
                                                            >
                                                                <i className="fas fa-minus"></i>
                                                            </button>
                                                            <span>{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.size, item.fitType, item.quantity + 1)}
                                                                disabled={isOutOfStock || item.quantity >= itemStock}
                                                            >
                                                                <i className="fas fa-plus"></i>
                                                            </button>
                                                        </div>
                                                        {stockText && (
                                                            <div className={`${styles.stockWarning} ${isOutOfStock ? styles.stockError :
                                                                (itemStock <= 5 ? styles.stockLow : '')
                                                                }`}>
                                                                {stockText}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={styles.cartItemPrice}>
                                                        S/. {(item.price * item.quantity).toFixed(2)}
                                                    </div>
                                                    <button className={styles.removeButton} onClick={() => removeFromCart(item.id, item.size, item.fitType)}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
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
                                        <span>
                                            Envío
                                            {discountCode && discountCode.freeShipping && (
                                                <span className={styles.freeShippingBadge}>
                                                    <i className="fas fa-gift"></i> Gratis con código
                                                </span>
                                            )}
                                        </span>
                                        {getShippingCost() === 0 ? (
                                            <span className={styles.freeShipping}>Gratis</span>
                                        ) : (
                                            <span>S/. {SHIPPING_COST.toFixed(2)}</span>
                                        )}
                                    </div>

                                    {getShippingCost() > 0 && !discountCode?.freeShipping && (
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

                                    {/* Add discount code section */}
                                    <div className={styles.discountSection}>
                                        <div className={styles.discountForm}>
                                            <input
                                                type="text"
                                                className={styles.discountInput}
                                                placeholder={discountCode ? "Cambiar código" : "Código de descuento"}
                                                value={codeInput}
                                                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                                                maxLength={10}
                                                disabled={codeStatus.loading}
                                            />
                                            {discountCode ? (
                                                <button
                                                    className={`${styles.discountButton} ${styles.removeButton}`}
                                                    onClick={handleClearDiscountCode}
                                                    disabled={codeStatus.loading}
                                                    aria-label="Eliminar código"
                                                    title="Eliminar código"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            ) : (
                                                <button
                                                    className={styles.discountButton}
                                                    onClick={handleDiscountCode}
                                                    disabled={codeStatus.loading || !codeInput.trim()}
                                                    aria-label="Aplicar código"
                                                    title="Aplicar código"
                                                >
                                                    {codeStatus.loading ? (
                                                        <div className={styles.miniSpinner}></div>
                                                    ) : (
                                                        <i className="fas fa-check"></i>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {codeStatus.message && (
                                            <div className={`${styles.codeMessage} ${styles[codeStatus.type]}`}>
                                                {codeStatus.type === 'success' && <i className="fas fa-check-circle"></i>}
                                                {codeStatus.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                                                {codeStatus.type === 'info' && <i className="fas fa-info-circle"></i>}
                                                {codeStatus.message}
                                            </div>
                                        )}

                                        {discountCode && (
                                            <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                                                <span>
                                                    Descuento {discountCode.discount}%
                                                    <span className={styles.discountCode}>{discountCode.code}</span>
                                                </span>
                                                <span className={styles.discountAmount}>
                                                    -S/. {discountAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

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