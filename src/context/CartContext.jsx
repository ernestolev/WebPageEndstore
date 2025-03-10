import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../Firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { user } = useAuth(); // Add this line to get user from AuthContext

    // Define constants
    const SHIPPING_THRESHOLD = 99;
    const SHIPPING_COST = 12;

    // Load cart from Firestore when user logs in
    useEffect(() => {
        const loadCart = async () => {
            if (user) {
                const cartRef = doc(db, 'Carts', user.uid);
                const cartSnap = await getDoc(cartRef);
                if (cartSnap.exists()) {
                    setCart(cartSnap.data().items || []);
                }
            } else {
                setCart([]);
            }
        };

        loadCart();
    }, [user]);

    // Save cart to Firestore whenever it changes
    useEffect(() => {
        const saveCart = async () => {
            if (user) {
                const cartRef = doc(db, 'Carts', user.uid);
                await setDoc(cartRef, { items: cart }, { merge: true });
            }
        };

        if (cart.length > 0) {
            saveCart();
        }
    }, [cart, user]);

    const addToCart = (product, quantity = 1, size = null, fitType = null) => {
        if (!user) {
            alert('Por favor, inicia sesión para agregar productos al carrito');
            return;
        }

        setCart(prevCart => {
            // Create a unique identifier for the cart item that includes both size and fitType
            const cartItemId = `${product.id}${size ? `-${size}` : ''}${fitType ? `-${fitType}` : ''}`;

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
                // Add new item with all properties
                return [...prevCart, {
                    id: product.id,
                    name: product.name,
                    price: product.discount ? product.price * (1 - product.discount / 100) : product.price,
                    image: product.images[0],
                    quantity,
                    size,
                    fitType,
                    cartItemId
                }];
            }
        });

        setIsCartOpen(true);
    };

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
            if (user) {
                const cartRef = doc(db, 'Carts', user.uid);
                await setDoc(cartRef, { items: [] });
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };



    const getSubtotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getShippingCost = () => {
        const subtotal = getSubtotal();
        return subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    };

    const getCartTotal = () => {
        return getSubtotal() + getShippingCost();
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
            SHIPPING_COST // Add this line
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);