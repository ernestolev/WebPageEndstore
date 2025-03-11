import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../Firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [discountCode, setDiscountCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Define constants
    const SHIPPING_THRESHOLD = 99;
    const SHIPPING_COST = 12;

    // Load cart from Firestore when user changes
    useEffect(() => {
        const loadCart = async () => {
            try {
                setLoading(true);
                if (user) {
                    const cartRef = doc(db, 'Carts', user.uid);
                    const cartSnap = await getDoc(cartRef);
                    
                    if (cartSnap.exists()) {
                        console.log("Carrito encontrado en Firestore:", cartSnap.data());
                        const cartData = cartSnap.data();
                        setCart(cartData.items || []);
                        setDiscountCode(cartData.discountCode || null);
                    } else {
                        console.log("No se encontró carrito, creando uno nuevo.");
                        // Initialize empty cart in Firestore
                        await setDoc(cartRef, {
                            items: [],
                            discountCode: null,
                            updatedAt: new Date()
                        });
                        setCart([]);
                        setDiscountCode(null);
                    }
                } else {
                    console.log("No hay usuario autenticado, carrito vacío");
                    setCart([]);
                    setDiscountCode(null);
                }
            } catch (error) {
                console.error("Error cargando carrito desde Firestore:", error);
                setCart([]);
                setDiscountCode(null);
            } finally {
                setLoading(false);
            }
        };

        loadCart();
    }, [user]);

    // Update cart in Firestore whenever cart changes
    useEffect(() => {
        const saveCart = async () => {
            if (user && !loading) {
                try {
                    console.log("Guardando carrito en Firestore:", cart);
                    const cartRef = doc(db, 'Carts', user.uid);
                    await updateDoc(cartRef, {
                        items: cart,
                        discountCode: discountCode,
                        updatedAt: new Date()
                    }).catch(error => {
                        // If document doesn't exist yet, create it
                        if (error.code === 'not-found') {
                            return setDoc(cartRef, {
                                items: cart,
                                discountCode: discountCode,
                                updatedAt: new Date()
                            });
                        }
                        throw error;
                    });
                } catch (error) {
                    console.error("Error guardando carrito en Firestore:", error);
                }
            }
        };

        // Only save cart if we're not in the initial loading phase
        if (!loading) {
            saveCart();
        }
    }, [cart, discountCode, user, loading]);

    const addToCart = (product, quantity = 1, size = null, fitType = null) => {
        if (!user) {
            alert('Por favor, inicia sesión para agregar productos al carrito');
            return;
        }

        setCart(prevCart => {
            // Check if this exact item is already in the cart
            const existingItem = prevCart.find(item =>
                item.id === product.id &&
                item.size === size &&
                item.fitType === fitType
            );

            if (existingItem) {
                // Update existing item quantity
                return prevCart.map(item =>
                    item.id === product.id &&
                    item.size === size &&
                    item.fitType === fitType
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                return [...prevCart, {
                    id: product.id,
                    name: product.name,
                    price: product.discount ? product.price * (1 - product.discount / 100) : product.price,
                    image: product.images && product.images.length > 0 ? product.images[0] : '',
                    quantity,
                    size,
                    fitType
                }];
            }
        });

        setIsCartOpen(true);
    };

    // Rest of the methods remain the same
    const removeFromCart = (productId, size = null, fitType = null) => {
        setCart(prevCart => prevCart.filter(item =>
            !(item.id === productId && item.size === size && item.fitType === fitType)
        ));
    };

    const updateQuantity = (productId, size = null, fitType = null, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId, size, fitType);
            return;
        }

        setCart(prevCart => prevCart.map(item =>
            item.id === productId &&
            item.size === size &&
            item.fitType === fitType
                ? { ...item, quantity: newQuantity }
                : item
        ));
    };

    const clearCart = async () => {
        try {
            setCart([]);
            setDiscountCode(null);
            if (user) {
                const cartRef = doc(db, 'Carts', user.uid);
                await setDoc(cartRef, { 
                    items: [],
                    discountCode: null,
                    updatedAt: new Date()
                });
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };

    // Discount code functions
    const applyDiscountCode = async (code) => {
        setDiscountCode(code);
        if (user) {
            try {
                const cartRef = doc(db, 'Carts', user.uid);
                await updateDoc(cartRef, { 
                    discountCode: code,
                    updatedAt: new Date()
                }).catch(error => {
                    // If document doesn't exist yet, create it
                    if (error.code === 'not-found') {
                        return setDoc(cartRef, {
                            items: cart,
                            discountCode: code,
                            updatedAt: new Date()
                        });
                    }
                    throw error;
                });
            } catch (error) {
                console.error('Error saving discount code:', error);
            }
        }
    };

    const removeDiscountCode = async () => {
        setDiscountCode(null);
        if (user) {
            try {
                const cartRef = doc(db, 'Carts', user.uid);
                await updateDoc(cartRef, { 
                    discountCode: null,
                    updatedAt: new Date()
                }).catch(error => {
                    // If document doesn't exist yet, create it
                    if (error.code === 'not-found') {
                        return setDoc(cartRef, {
                            items: cart,
                            discountCode: null,
                            updatedAt: new Date()
                        });
                    }
                    throw error;
                });
            } catch (error) {
                console.error('Error removing discount code:', error);
            }
        }
    };

    const getDiscountAmount = () => {
        if (!discountCode) return 0;
        const subtotal = getSubtotal();
        return (subtotal * discountCode.discount) / 100;
    };

    const getSubtotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getShippingCost = () => {
        const subtotal = getSubtotal();
        return subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    };

    const getCartTotal = () => {
        const subtotal = getSubtotal();
        const shipping = getShippingCost();
        const discount = getDiscountAmount();
        
        return subtotal + shipping - discount;
    };

    return (
        <CartContext.Provider value={{
            cart,
            isCartOpen,
            setIsCartOpen,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getSubtotal,
            getShippingCost,
            SHIPPING_THRESHOLD,
            SHIPPING_COST,
            loading,
            discountCode,
            applyDiscountCode,
            removeDiscountCode,
            discountAmount: getDiscountAmount()
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);