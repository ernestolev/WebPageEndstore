import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/OrderSuccess.module.css';

const OrderSuccess = () => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const { orderId } = useParams();
    const [searchParams] = useSearchParams();

    const getTransactionStatus = (state) => {
        const states = {
            '4': { text: 'APROBADO', class: styles.success },
            '6': { text: 'RECHAZADO', class: styles.rejected },
            '7': { text: 'PENDIENTE', class: styles.pending },
            '104': { text: 'ERROR', class: styles.error }
        };
        return states[state] || { text: 'DESCONOCIDO', class: styles.unknown };
    };

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const orderDoc = await getDoc(doc(db, 'PayuTransactions', orderId));
                if (orderDoc.exists()) {
                    const orderData = orderDoc.data();
                    setOrder(orderData);

                    // Actualizar estado si es necesario
                    const transactionState = searchParams.get('transactionState');
                    if (transactionState && orderData.status !== transactionState) {
                        await updateDoc(doc(db, 'PayuTransactions', orderId), {
                            status: transactionState,
                            lastUpdated: new Date()
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchOrder();
        }
    }, [orderId, searchParams]);

    if (loading) {
        return <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Verificando el estado de tu orden...</p>
        </div>;
    }

    const transactionState = searchParams.get('transactionState');
    const status = getTransactionStatus(transactionState);

    return (
        <div className={styles.orderSuccess}>
            <div className={styles.container}>
                <div className={`${styles.content} ${status.class}`}>
                    <h1>Estado de tu Orden</h1>
                    <div className={styles.statusBadge}>
                        {status.text}
                    </div>

                    {order && (
                        <div className={styles.orderDetails}>
                            <h2>Detalles de la orden</h2>
                            <div className={styles.orderInfo}>
                                <p><strong>Número de orden:</strong> {orderId}</p>
                                <p><strong>Monto:</strong> S/ {order.amount}</p>
                                <p><strong>Fecha:</strong> {order.createdAt?.toDate().toLocaleString()}</p>
                            </div>

                            {order.items && (
                                <div className={styles.items}>
                                    <h3>Productos</h3>
                                    {order.items.map(item => (
                                        <div key={item.productId} className={styles.item}>
                                            <img src={item.image} alt={item.name} />
                                            <div>
                                                <p>{item.name}</p>
                                                <p>Cantidad: {item.quantity}</p>
                                                <p>Talla: {item.size}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.actions}>
                        {transactionState === '4' && (
                            <Link to="/profile/orders" className={styles.primaryButton}>
                                Ver mis órdenes
                            </Link>
                        )}
                        {['6', '104'].includes(transactionState) && (
                            <Link to="/checkout" className={styles.retryButton}>
                                Intentar nuevamente
                            </Link>
                        )}
                        <Link to="/" className={styles.secondaryButton}>
                            Volver a la tienda
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;