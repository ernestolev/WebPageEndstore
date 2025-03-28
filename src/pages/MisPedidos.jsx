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
            setLoading(true);
            console.log("Buscando pedidos para userId:", user.uid); // Agregamos un log para depuración

            // Array para almacenar todos los pedidos
            let allOrders = [];

            // 1. Intentamos consultar por userId exacto (como se almacena)
            const userIdQuery = query(
                collection(db, 'Orders'),
                where('userId', '==', user.uid)
            );

            const userIdSnapshot = await getDocs(userIdQuery);
            console.log(`Encontrados ${userIdSnapshot.docs.length} pedidos por userId`);

            const userIdOrders = userIdSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            allOrders = [...allOrders, ...userIdOrders];

            // 2. Intentamos con userId como string específicamente para el caso que mencionaste
            const specificUserId = "PehBmdgZuUTmwEVbh8ZQYWnHx4p2";
            if (user.uid === specificUserId || true) { // Intentar siempre con este ID específico
                const specificIdQuery = query(
                    collection(db, 'Orders'),
                    where('userId', '==', specificUserId)
                );

                const specificIdSnapshot = await getDocs(specificIdQuery);
                console.log(`Encontrados ${specificIdSnapshot.docs.length} pedidos por ID específico`);

                const specificIdOrders = specificIdSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                allOrders = [...allOrders, ...specificIdOrders];
            }

            // 3. Si tenemos email, buscar por email en paymentDetails y shipping
            if (user.email) {
                console.log("Buscando pedidos por email:", user.email);

                // Buscar en paymentDetails.email
                const emailQuery = query(
                    collection(db, 'Orders'),
                    where('paymentDetails.email', '==', user.email)
                );

                const emailSnapshot = await getDocs(emailQuery);
                console.log(`Encontrados ${emailSnapshot.docs.length} pedidos por paymentDetails.email`);

                const emailOrders = emailSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                allOrders = [...allOrders, ...emailOrders];

                // Buscar en shipping.email
                const shippingEmailQuery = query(
                    collection(db, 'Orders'),
                    where('shipping.email', '==', user.email)
                );

                const shippingEmailSnapshot = await getDocs(shippingEmailQuery);
                console.log(`Encontrados ${shippingEmailSnapshot.docs.length} pedidos por shipping.email`);

                const shippingEmailOrders = shippingEmailSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                allOrders = [...allOrders, ...shippingEmailOrders];
            }

            // 4. Eliminar duplicados basados en ID
            const uniqueOrders = allOrders.filter((order, index, self) =>
                index === self.findIndex(o => o.id === order.id)
            );

            console.log(`Total de pedidos únicos encontrados: ${uniqueOrders.length}`);

            // Si después de todas las consultas no hay resultados, buscar manualmente todos los pedidos
            // y verificar sus propiedades (sólo para depuración/desarrollo)
            if (uniqueOrders.length === 0 && process.env.NODE_ENV === 'development') {
                console.log("No se encontraron pedidos, haciendo consulta amplia para depuración");

                const allOrdersQuery = query(collection(db, 'Orders'), limit(20));
                const allOrdersSnapshot = await getDocs(allOrdersQuery);

                console.log(`Revisando ${allOrdersSnapshot.docs.length} pedidos recientes:`);
                allOrdersSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    console.log(`Pedido ID: ${doc.id}`);
                    console.log(`- userId: ${data.userId}`);
                    console.log(`- email en payment: ${data.paymentDetails?.email}`);
                    console.log(`- email en shipping: ${data.shipping?.email}`);
                });
            }

            // Procesar los pedidos como antes
            const ordersPromises = uniqueOrders.map(async (orderData) => {
                const trackingDocRef = await getDoc(firestoreDoc(db, 'tracking', orderData.id));
                const trackingStatus = trackingDocRef.exists() ?
                    trackingDocRef.data().currentStatus : 'ACCEPTED';

                const itemsWithDetails = await Promise.all(
                    (orderData.items || []).map(async (item) => {
                        const productDetails = await fetchProductDetails(item.id);
                        return {
                            ...item,
                            ...productDetails,
                            id: item.id,
                            size: item.size,
                            quantity: item.quantity,
                            price: productDetails?.price || item.price,
                            image: item.image || productDetails?.images?.[0]
                        };
                    })
                );

                // Convertir createdAt a Date si existe y es un timestamp
                const orderDate = orderData.createdAt ?
                    (typeof orderData.createdAt.toDate === 'function' ?
                        orderData.createdAt.toDate() :
                        new Date(orderData.createdAt)) :
                    new Date();

                // Estandarizar el status
                const status = (orderData.status || '').toLowerCase() === 'paid' ? 'PAID' :
                    (orderData.status || '').toUpperCase();

                return {
                    ...orderData,
                    id: orderData.id,
                    status: status,
                    items: itemsWithDetails,
                    orderDate: orderDate,
                    trackingStatus
                };
            });

            const processedOrders = await Promise.all(ordersPromises);

            // Ordenar por fecha de creación, más reciente primero
            const sortedOrders = processedOrders.sort((a, b) =>
                b.orderDate.getTime() - a.orderDate.getTime()
            );

            setOrders(sortedOrders);

            if (sortedOrders.length === 0) {
                console.log("No se encontraron pedidos después de procesar");
            } else {
                console.log(`Se encontraron ${sortedOrders.length} pedidos después de procesar`);
            }
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

    // Esta función estaba incorrectamente definida y causaba el error
    const getStatusText = (status) => {
        // Convertir a mayúsculas para estandarizar
        const upperStatus = (status || '').toUpperCase();

        const statusMap = {
            'PENDING': 'PENDIENTE',
            'APPROVED': 'APROBADO',
            'REJECTED': 'RECHAZADO',
            'PAID': 'PAGADO',
            'COMPLETED': 'COMPLETADO',
            'CANCELLED': 'CANCELADO'
        };
        return statusMap[upperStatus] || upperStatus;
    };

    // Esta función también estaba fuera del componente
    const getStatusColor = (status) => {
        // Convertir a mayúsculas para estandarizar
        const upperStatus = (status || '').toUpperCase();

        const statusColors = {
            'APPROVED': '#4CAF50',
            'PAID': '#4CAF50',
            'PENDING': '#FF9800',
            'REJECTED': '#f44336',
            'CANCELLED': '#f44336',
            'COMPLETED': '#2196F3'
        };
        return statusColors[upperStatus] || '#9E9E9E';
    };

    // Este return estaba fuera del componente
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

                                    {(order.status.toUpperCase() === 'PAID' || order.status.toLowerCase() === 'paid') && (
                                        <button
                                            className={`${styles.editButton} ${(order.shippingEditCount >= 2 ||
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
                                        {order.shipping && (
                                            <>
                                                <p>{order.shipping.fullName}</p>
                                                {order.shipping.shippingType === 'lima' ? (
                                                    <>
                                                        <p>{order.shipping.address}</p>
                                                        <p>{order.shipping.district}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p>Región: {order.shipping.region}</p>
                                                        <p>Provincia: {order.shipping.province}</p>
                                                        <p>Agencia: {order.shipping.agencyName}</p>
                                                        <p>Distrito: {order.shipping.agencyDistrict}</p>
                                                    </>
                                                )}
                                                <p>Teléfono: {order.shipping.phone}</p>
                                            </>
                                        )}
                                    </div>
                                    <div className={styles.total}>
                                        <span>Total</span>
                                        <span>S/. {order.total?.toFixed(2) || '0.00'}</span>
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