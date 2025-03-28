// Corregir la definición del CartContext
import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../Firebase';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [discountCode, setDiscountCode] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Define constants
    const SHIPPING_THRESHOLD = 99;
    const SHIPPING_COST = 12;

    // Synchronize cart with localStorage
    useEffect(() => {
        // Load cart from localStorage on component mount
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error parsing cart from localStorage:', error);
                setCart([]);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // Save cart to localStorage whenever it changes
        if (!loading) {
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }, [cart, loading]);

    // Update discount amount when discount code or cart changes
    useEffect(() => {
        if (discountCode) {
            const subtotal = getSubtotal();
            setDiscountAmount((subtotal * discountCode.discount) / 100);
        } else {
            setDiscountAmount(0);
        }
    }, [discountCode, cart]);

    const addToCart = (product) => {
        if (!user) {
            toast.error('Por favor, inicia sesión para agregar productos al carrito');
            return;
        }

        // Verificar que el producto tiene todos los datos necesarios
        if (!product.id || !product.name || !product.price) {
            console.error("Producto inválido para añadir al carrito:", product);
            return;
        }

        // Asegúrate de que quantity sea un número
        const quantity = parseInt(product.quantity) || 1;

        // Información para debug
        console.log("addToCart recibiendo:", {
            id: product.id,
            size: product.size,
            fitType: product.fitType,
            quantity: quantity
        });

        setCart(prevCart => {
            // Check if this exact item is already in the cart
            const existingItem = prevCart.find(item =>
                item.id === product.id &&
                item.size === product.size &&
                item.fitType === product.fitType
            );

            console.log("¿Item existente?", existingItem);

            if (existingItem) {
                // Update existing item quantity
                return prevCart.map(item =>
                    item.id === product.id &&
                        item.size === product.size &&
                        item.fitType === product.fitType
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item with all properties preserved
                return [...prevCart, {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: quantity,
                    size: product.size || null, // Preservar la talla, null si no hay
                    fitType: product.fitType || null, // Preservar el fit, null si no hay
                    hasSizes: product.hasSizes || false,
                    stock: product.stock || 0
                }];
            }
        });

        // Info para debug
        console.log("Carrito actualizado!");
    };

    const removeFromCart = (id, size = null, fitType = null) => {
        setCart(prevCart =>
            prevCart.filter(item =>
                !(item.id === id &&
                    item.size === size &&
                    item.fitType === fitType)
            )
        );
    };

    const updateQuantity = (id, size = null, fitType = null, newQuantity) => {
        if (newQuantity < 1) return;

        setCart(prevCart =>
            prevCart.map(item =>
                (item.id === id &&
                    item.size === size &&
                    item.fitType === fitType)
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
        setDiscountCode(null);
        setDiscountAmount(0);
    };

    const getSubtotal = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };

    const getShippingCost = () => {
        // Si hay un código de descuento con envío gratis, retornar 0
        if (discountCode && discountCode.freeShipping) {
            return 0;
        }

        // Lógica original
        const subtotal = getSubtotal();
        return subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    };

    const getCartTotal = () => {
        const subtotal = getSubtotal();
        const shippingCost = getShippingCost();
        return subtotal + shippingCost - discountAmount;
    };

    const applyDiscountCode = (code) => {
        setDiscountCode(code);
        // Discount amount will be updated via useEffect
    };

    const removeDiscountCode = () => {
        setDiscountCode(null);
        setDiscountAmount(0);
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity, // Renamed this to match what you use in CartSlideout
                clearCart,
                getCartTotal,
                isCartOpen,
                setIsCartOpen,
                getSubtotal,
                getShippingCost,
                SHIPPING_THRESHOLD,
                SHIPPING_COST,
                applyDiscountCode,
                discountCode,
                discountAmount,
                removeDiscountCode,
                loading
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);