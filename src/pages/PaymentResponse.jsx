import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../Firebase';
import { useCart } from '../context/CartContext'; // Add this import
import styles from '../styles/OrderSuccess.module.css';

const PaymentResponse = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart(); // Add this hook

    useEffect(() => {
        const handlePaymentResponse = async () => {
            const referenceCode = searchParams.get('referenceCode');
            const transactionState = searchParams.get('transactionState');

            if (!referenceCode) return;

            try {
                const payuTransactionRef = doc(db, 'PayuTransactions', referenceCode);
                const payuTransactionDoc = await getDoc(payuTransactionRef);

                if (!payuTransactionDoc.exists()) return;

                const payuData = payuTransactionDoc.data();

                // If payment was successful
                if (transactionState === '4') {
                    // Update stock levels
                    for (const item of payuData.cartItems) {
                        await runTransaction(db, async (transaction) => {
                            const productRef = doc(db, 'Productos', item.id);
                            const productDoc = await transaction.get(productRef);

                            if (!productDoc.exists()) return;

                            const productData = productDoc.data();

                            if (item.hasSizes && item.size) {
                                // Producto con tallas
                                const currentStock = productData.sizes[item.size] || 0;
                                const newStock = Math.max(0, currentStock - item.quantity);

                                // SOLO actualizamos la talla específica
                                transaction.update(productRef, {
                                    [`sizes.${item.size}`]: newStock
                                });
                            } else {
                                // Producto sin tallas
                                const currentStock = productData.stock || 0;
                                const newStock = Math.max(0, currentStock - item.quantity);

                                transaction.update(productRef, {
                                    stock: newStock
                                });
                            }
                        });
                    }

                    // Marcar que el stock ya fue actualizado
                    await updateDoc(payuTransactionRef, {
                        stockUpdated: true
                    });
                }

                // Redirect to order success page
                navigate(`/order-success/${referenceCode}`);

            } catch (error) {
                console.error('Error processing payment:', error);
            }
        };

        handlePaymentResponse();
    }, [searchParams, navigate, clearCart]); // Add clearCart to dependencies

    return (
        <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Procesando tu pago...</p>
        </div>
    );
};

export default PaymentResponse;