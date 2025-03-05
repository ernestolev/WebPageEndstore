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
                            const currentStock = productData.sizes[item.size] || 0;
                            const newStock = Math.max(0, currentStock - item.quantity);
                            
                            transaction.update(productRef, {
                                [`sizes.${item.size}`]: newStock
                            });
                        });
                    }

                    // Clear the cart after successful payment
                    clearCart();

                    // Update PayU transaction status
                    await updateDoc(payuTransactionRef, {
                        status: 'APPROVED',
                        lastUpdated: new Date(),
                        payuResponse: Object.fromEntries(searchParams.entries())
                    });

                    // Create tracking document
                    await setDoc(doc(db, 'tracking', referenceCode), {
                        orderId: referenceCode,
                        currentStatus: 'ACCEPTED',
                        updates: {
                            ACCEPTED: new Date().toISOString()
                        },
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
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