import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/PayuButton.module.css';

const PayuButton = ({ amount, orderId, shipping, onSuccess, onError, cartItems, disabled }) => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const handlePayment = async () => {
        try {
            setLoading(true);

            if (!user) {
                throw new Error('Usuario no autenticado');
            }

            // Optimize cart items to save only necessary data
            const optimizedCartItems = cartItems.map(item => ({
                id: item.productId, // ID del producto
                size: item.size,
                quantity: item.quantity,
                price: item.price
            }));

            const idToken = await user.getIdToken(true);

            const response = await fetch(`${BACKEND_URL}/api/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    orderId,
                    amount: Number(amount),
                    shipping,
                    userId: user.uid,
                    cartItems: optimizedCartItems
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en el servidor');
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error procesando el pago');
            }

            // Create and submit PayU form
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = data.checkoutUrl;

            Object.entries(data.formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = String(value);
                    form.appendChild(input);
                }
            });

            document.body.appendChild(form);
            form.submit();

        } catch (error) {
            console.error('Error detallado:', error);
            onError?.(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={disabled || loading}
            className={`${styles.payuButton} ${disabled ? styles.disabled : ''}`}
        >
            {loading ? (
                <>
                    <span className={styles.spinner}></span>
                    Procesando...
                </>
            ) : (
                <>
                    <i className="fas fa-lock"></i>
                    Pagar S/. {amount.toFixed(2)}
                </>
            )}
        </button>
    );
};

export default PayuButton;