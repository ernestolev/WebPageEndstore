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

    const addToCart = (product, quantity, size) => {
        if (!user) {
            alert('Por favor, inicia sesión para agregar productos al carrito');
            return;
        }

        setCart(currentCart => {
            const existingItem = currentCart.find(
                item => item.productId === product.id && item.size === size
            );

            if (existingItem) {
                return currentCart.map(item =>
                    item.productId === product.id && item.size === size
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            return [...currentCart, {
                productId: product.id,
                name: product.name,
                price: product.discount ?
                    product.price * (1 - product.discount / 100) :
                    product.price,
                image: product.images[0],
                quantity,
                size,
                originalPrice: product.price,
                discount: product.discount || 0
            }];
        });

        setIsCartOpen(true);
    };

    const removeFromCart = async (productId, size) => {
        try {
            const newCart = cart.filter(item =>
                !(item.productId === productId && item.size === size)
            );

            setCart(newCart);

            // Update Firestore
            if (user) {
                const cartRef = doc(db, 'Carts', user.uid);
                if (newCart.length === 0) {
                    // If cart is empty, delete the document
                    await setDoc(cartRef, { items: [] });
                } else {
                    // Update with new cart items
                    await setDoc(cartRef, { items: newCart }, { merge: true });
                }
            }
        } catch (error) {
            console.error('Error removing item from cart:', error);
        }
    };

    const updateQuantity = (productId, size, newQuantity) => {
        setCart(currentCart =>
            currentCart.map(item =>
                item.productId === productId && item.size === size
                    ? { ...item, quantity: Math.max(1, newQuantity) }
                    : item
            )
        );
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