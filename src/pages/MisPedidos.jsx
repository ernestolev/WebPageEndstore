import React, { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc as firestoreDoc,
    getDoc
} from 'firebase/firestore';
import { db } from '../Firebase';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/MisPedidos.module.css';
import AnnouncementBar from '../components/AnnouncementBar';
import TrackingModal from '../components/TrackingModal';
import EditShippingModal from '../components/EditShippingModal';
import ComentariosModal from '../components/ComentariosModal';
import { Link } from 'react-router-dom';

const MisPedidos = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [editingOrderId, setEditingOrderId] = useState(null);
    const [reviewingItem, setReviewingItem] = useState(null);
    const [userComments, setUserComments] = useState({});

    const fetchProductDetails = async (productId) => {
        try {
            const productDocRef = await getDoc(firestoreDoc(db, 'Productos', productId));
            if (productDocRef.exists()) {
                return productDocRef.data();
            }
            return null;
        } catch (error) {
            console.error('Error fetching product:', productId, error);
            return null;
        }
    };

    const fetchUserComments = async () => {
        try {
            const commentsQuery = query(
                collection(db, 'comentarios'),
                where('userId', '==', user.uid)
            );
            const snapshot = await getDocs(commentsQuery);
            const comments = {};
            snapshot.forEach(doc => {
                const data = doc.data();
                comments[`${data.orderId}-${data.productId}`] = true;
            });
            setUserComments(comments);
        } catch (error) {
            console.error('Error fetching user comments:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            const ordersQuery = query(
                collection(db, 'Orders'),
                where('userId', '==', user.uid),
                where('status', '==', 'PAID'),
                orderBy('orderDate', 'desc')
            );

            const ordersSnapshot = await getDocs(ordersQuery);
            const ordersPromises = ordersSnapshot.docs.map(async (docSnapshot) => {
                const orderData = docSnapshot.data();
                const trackingDocRef = await getDoc(firestoreDoc(db, 'tracking', docSnapshot.id));
                const trackingStatus = trackingDocRef.exists() ?
                    trackingDocRef.data().currentStatus : 'ACCEPTED';

                const itemsWithDetails = await Promise.all(
                    (orderData.items || []).map(async (item) => {
                        const productDetails = await fetchProductDetails(item.id);
                        return {
                            ...productDetails,
                            id: item.id,
                            size: item.size,
                            quantity: item.quantity,
                            price: productDetails?.price || item.price,
                            image: productDetails?.images?.[0]
                        };
                    })
                );

                return {
                    id: docSnapshot.id,
                    ...orderData,
                    items: itemsWithDetails,
                    orderDate: orderData.orderDate?.toDate(),
                    trackingStatus
                };
            });

            const processedOrders = await Promise.all(ordersPromises);
            setOrders(processedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOrders();
            fetchUserComments();
        }
    }, [user]);

    const getStatusText = (status) => {
        const statusMap = {
            'PENDING': 'PENDIENTE',
            'APPROVED': 'APROBADO',
            'REJECTED': 'RECHAZADO',
            'PAID': 'PAGADO',
            'COMPLETED': 'COMPLETADO',
            'CANCELLED': 'CANCELADO'
        };
        return statusMap[status] || status;
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'APPROVED': '#4CAF50',
            'PAID': '#4CAF50',
            'PENDING': '#FF9800',
            'REJECTED': '#f44336',
            'CANCELLED': '#f44336',
            'COMPLETED': '#2196F3'
        };
        return statusColors[status] || '#9E9E9E';
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando tus pedidos...</p>
            </div>
        );
    }

    return (
        <>
            <AnnouncementBar />
            <div className={styles.misPedidos}>
                <h1>Mis Pedidos</h1>

                {orders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <i className="fas fa-shopping-bag"></i>
                        <h2>No tienes pedidos aún</h2>
                        <p>¡Explora nuestro catálogo y realiza tu primera compra!</p>
                        <Link to="/" className={styles.exploreButton}>
                            Ver Catálogo
                        </Link>
                    </div>
                ) : (
                    <div className={styles.ordersList}>
                        {orders.map((order) => (
                            <div key={order.id} className={styles.orderCard}>
                                <div className={styles.orderHeader}>
                                    <div>
                                        <h3>Pedido #{order.id}</h3>
                                        <p className={styles.date}>
                                            {order.orderDate?.toLocaleDateString('es-PE', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <span
                                        className={styles.status}
                                        style={{ backgroundColor: getStatusColor(order.status) }}
                                    >
                                        {getStatusText(order.status)}
                                    </span>
                                </div>

                                <div className={styles.orderItems}>
                                    {(order.items || []).map((item) => (
                                        <div key={`${item.id}-${item.size}`} className={styles.item}>
                                            <img
                                                src={item.image || '/placeholder.png'}
                                                alt={item.name}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/placeholder.png';
                                                }}
                                                className={styles.itemImage}
                                            />
                                            <div className={styles.itemDetails}>
                                                <h4>{item.name}</h4>
                                                <p>Talla: {item.size}</p>
                                                <p>Cantidad: {item.quantity}</p>
                                                <p className={styles.price}>S/. {item.price?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.orderActions}>
                                    <button
                                        className={styles.trackingButton}
                                        onClick={() => setSelectedOrderId(order.id)}
                                    >
                                        <i className="fas fa-truck"></i> Ver Seguimiento
                                    </button>
                                    
                                    {order.status === 'PAID' && (
                                        <button
                                            className={`${styles.editButton} ${
                                                (order.shippingEditCount >= 2 ||
                                                ['PACKING', 'COURIER', 'SHIPPING', 'DELIVERED'].includes(order.trackingStatus))
                                                ? styles.disabled
                                                : ''
                                            }`}
                                            onClick={() => setEditingOrderId(order.id)}
                                            disabled={
                                                order.shippingEditCount >= 2 ||
                                                ['PACKING', 'COURIER', 'SHIPPING', 'DELIVERED'].includes(order.trackingStatus)
                                            }
                                        >
                                            <i className="fas fa-edit"></i> Editar Envío
                                        </button>
                                    )}

                                    {order.trackingStatus === 'DELIVERED' && order.items.map(item => {
                                        const hasCommented = userComments[`${order.id}-${item.id}`];
                                        
                                        return hasCommented ? (
                                            <Link
                                                key={`review-${item.id}`}
                                                to={`/product/${item.id}#comentarios`}
                                                className={`${styles.reviewButton} ${styles.viewComment}`}
                                            >
                                                <i className="fas fa-comment"></i> Ver mi comentario
                                            </Link>
                                        ) : (
                                            <button
                                                key={`review-${item.id}`}
                                                className={styles.reviewButton}
                                                onClick={() => setReviewingItem({
                                                    orderId: order.id,
                                                    productId: item.id,
                                                    productName: item.name
                                                })}
                                            >
                                                <i className="fas fa-star"></i> Calificar Producto
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className={styles.orderFooter}>
                                    <div className={styles.shipping}>
                                        <h4>Dirección de envío:</h4>
                                        <p>{order.shipping.fullName}</p>
                                        <p>{order.shipping.address}</p>
                                        <p>{order.shipping.city}, {order.shipping.zipCode}</p>
                                    </div>
                                    <div className={styles.total}>
                                        <span>Total</span>
                                        <span>S/. {order.amount || order.total || 0}.00</span>
                                    </div>
                                </div>

                                {order.isPayu && order.payuResponse && (
                                    <div className={styles.paymentInfo}>
                                        <h4>Información del pago:</h4>
                                        <p>Método: {order.payuResponse.lapPaymentMethod}</p>
                                        <p>Transacción: {order.payuResponse.transactionId}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {reviewingItem && (
                    <ComentariosModal
                        orderId={reviewingItem.orderId}
                        productId={reviewingItem.productId}
                        productName={reviewingItem.productName}
                        onClose={() => {
                            setReviewingItem(null);
                            fetchUserComments(); // Refresh comments after closing modal
                        }}
                    />
                )}

                {selectedOrderId && (
                    <TrackingModal
                        orderId={selectedOrderId}
                        onClose={() => setSelectedOrderId(null)}
                    />
                )}

                {editingOrderId && (
                    <EditShippingModal
                        orderId={editingOrderId}
                        currentShipping={orders.find(o => o.id === editingOrderId)?.shipping}
                        onClose={() => setEditingOrderId(null)}
                    />
                )}
            </div>
        </>
    );
};

export default MisPedidos;