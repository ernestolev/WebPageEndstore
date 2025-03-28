import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/OrderSuccess.module.css';
import AnnouncementBar from '../components/AnnouncementBar';
import Confetti from 'react-confetti';

const OrderSuccess = () => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const { orderId } = useParams();
    const [searchParams] = useSearchParams();
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('es-PE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };



    const getTransactionStatus = (state) => {
        const states = {
            '4': { text: 'APROBADO', class: styles.success },
            '6': { text: 'RECHAZADO', class: styles.rejected },
            '7': { text: 'PENDIENTE', class: styles.pending },
            '104': { text: 'ERROR', class: styles.error },
            'paid': { text: 'APROBADO', class: styles.success }
        };
        return states[state] || { text: 'DESCONOCIDO', class: styles.unknown };
    };

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const updateStockFromOrder = async (order) => {
        // Si ya está marcada como stock actualizado, no hacer nada
        if (order.stockUpdated) {
            console.log("Stock ya actualizado para esta orden");
            return;
        }

        try {
            const batch = writeBatch(db);
            const orderItems = order.items || [];

            if (orderItems.length === 0) {
                console.log("No hay items para actualizar stock");
                return;
            }

            for (const item of orderItems) {
                const productRef = doc(db, 'Productos', item.id);
                const productDoc = await getDoc(productRef);

                if (!productDoc.exists()) {
                    console.error(`Producto ${item.id} no encontrado para actualizar stock`);
                    continue;
                }

                const productData = productDoc.data();

                if (item.size && productData.hasSizes) {
                    // Para productos con tallas:
                    const currentSizeStock = productData.sizes?.[item.size] || 0;
                    const adjustedQuantity = Math.min(item.quantity, currentSizeStock);

                    if (adjustedQuantity > 0) {
                        // Actualizar talla específica Y stock general
                        const updates = {};
                        updates[`sizes.${item.size}`] = Math.max(0, currentSizeStock - adjustedQuantity);
                        updates.stock = Math.max(0, (productData.stock || 0) - adjustedQuantity);

                        batch.update(productRef, updates);

                        console.log(`Actualizado talla ${item.size} de ${currentSizeStock} a ${Math.max(0, currentSizeStock - adjustedQuantity)}`);
                    }
                } else {
                    // Para productos sin tallas: solo actualizar stock general
                    const currentStock = productData.stock || 0;
                    const adjustedQuantity = Math.min(item.quantity, currentStock);

                    if (adjustedQuantity > 0) {
                        batch.update(productRef, {
                            stock: Math.max(0, currentStock - adjustedQuantity)
                        });

                        console.log(`Actualizado stock general de ${currentStock} a ${Math.max(0, currentStock - adjustedQuantity)}`);
                    }
                }
            }

            // Marcar la orden como stock actualizado
            const orderRef = doc(db, 'Orders', order.id || order.orderId);
            batch.update(orderRef, { stockUpdated: true });

            await batch.commit();
            console.log("Stock actualizado desde orden exitosa");
            return true;
        } catch (error) {
            console.error("Error actualizando stock desde orden:", error);
            return false;
        }
    };

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // First, try to get from Orders collection (Culqi, Google Pay)
                const orderDoc = await getDoc(doc(db, 'Orders', orderId));

                if (orderDoc.exists()) {
                    const orderData = { ...orderDoc.data(), id: orderId };
                    setOrder(orderData);
                    setPaymentMethod(orderData.paymentMethod || 'culqi');

                    // Si el estado es pagado y no se ha actualizado el stock todavía
                    if (orderData.status === 'paid' && !orderData.stockUpdated) {
                        await updateStockFromOrder(orderData);

                        // NO NECESITAMOS MENCIONAR NADA SOBRE NOTIFICATIONS AQUÍ
                        // Eliminar esta línea completamente:
                        // console.log("Estado de notificación:", orderData.notificationSent ? "Ya notificado" : "No notificado");
                    }

                    // Mostrar confetti para pagos exitosos
                    if (orderData.status === 'paid') {
                        setTimeout(() => setShowConfetti(true), 500);
                        // Ocultar confetti después de 5 segundos
                        setTimeout(() => setShowConfetti(false), 5000);
                    }
                } else {
                    // Si no se encuentra en Orders, intentar con PayuTransactions
                    const payuOrderDoc = await getDoc(doc(db, 'PayuTransactions', orderId));

                    if (payuOrderDoc.exists()) {
                        const orderData = { ...payuOrderDoc.data(), id: orderId };
                        setOrder(orderData);
                        setPaymentMethod('payu');

                        // Actualizar estado si es necesario
                        const transactionState = searchParams.get('transactionState');
                        if (transactionState && orderData.status !== transactionState) {
                            await updateDoc(doc(db, 'PayuTransactions', orderId), {
                                status: transactionState,
                                lastUpdated: new Date()
                            });

                            // Si el pago acaba de convertirse en exitoso (estado 4), actualizar el stock
                            if (transactionState === '4' && orderData.status !== '4' && !orderData.stockUpdated) {
                                await updateStockFromOrder(orderData);
                                await updateDoc(doc(db, 'PayuTransactions', orderId), {
                                    stockUpdated: true
                                });

                                // ELIMINAR TAMBIÉN ESTA LÍNEA
                                // console.log("Estado de notificación (PayU):", orderData.notificationSent ? "Ya notificado" : "No notificado");
                            }
                        }

                        // Mostrar confetti para pagos aprobados
                        if (transactionState === '4') {
                            setTimeout(() => setShowConfetti(true), 500);
                            // Ocultar confetti después de 5 segundos
                            setTimeout(() => setShowConfetti(false), 5000);
                        }
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

    const updateStockFromPayuOrder = async (orderData) => {
        try {
            const batch = writeBatch(db);

            // Si no hay items, no podemos actualizar el stock
            if (!orderData.items || !Array.isArray(orderData.items)) {
                console.log("No hay items en la orden de PayU para actualizar stock");
                return;
            }

            for (const item of orderData.items) {
                const productRef = doc(db, 'Productos', item.id);
                const productDoc = await getDoc(productRef);

                if (!productDoc.exists()) {
                    console.error(`Producto ${item.id} no encontrado para actualizar stock`);
                    continue;
                }

                const productData = productDoc.data();

                if (productData.hasSizes && item.size) {
                    // Producto con tallas - Solo actualizar talla específica
                    const currentSizeStock = productData.sizes?.[item.size] || 0;
                    const newSizeStock = Math.max(0, currentSizeStock - item.quantity);

                    // Crear actualización solo para la talla específica
                    const sizeUpdate = {};
                    sizeUpdate[`sizes.${item.size}`] = newSizeStock;

                    // IMPORTANTE: No actualizar también el stock general
                    batch.update(productRef, sizeUpdate);

                    console.log(`Actualizando solo stock de talla ${item.size} para producto ${item.id}: ${currentSizeStock} -> ${newSizeStock}`);
                } else {
                    // Producto sin tallas - actualizar solo stock general
                    batch.update(productRef, {
                        stock: increment(-item.quantity)
                    });

                    console.log(`Actualizando stock general para producto ${item.id}: ${productData.stock} -> ${Math.max(0, productData.stock - item.quantity)}`);
                }
            }

            await batch.commit();
            console.log("Stock actualizado correctamente para la orden de PayU");
        } catch (error) {
            console.error("Error actualizando stock desde orden de PayU:", error);
        }
    };

    // Obtener el estado de la transacción
    const getStatus = () => {
        if (paymentMethod === 'payu') {
            return getTransactionStatus(searchParams.get('transactionState'));
        } else if (order?.status) {
            return getTransactionStatus(order.status);
        }
        return getTransactionStatus('paid'); // Default para pedidos no-payu
    };

    const status = getStatus();

    if (loading) {
        return (
            <>
                <AnnouncementBar />
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Verificando el estado de tu pedido...</p>
                </div>
            </>
        );
    }

    if (!order) {
        return (
            <>
                <AnnouncementBar />
                <div className={styles.orderSuccess}>
                    <div className={styles.container}>
                        <div className={`${styles.content} ${styles.error}`}>
                            <div className={styles.successHeader}>
                                <div className={styles.headerContent}>
                                    <div className={styles.successIcon}>
                                        <i className="fas fa-exclamation-circle"></i>
                                    </div>
                                    <h1>Orden no encontrada</h1>
                                    <p>Lo sentimos, no pudimos encontrar información sobre esta orden.</p>
                                </div>
                            </div>
                            <div className={styles.mainContent}>
                                <div className={styles.actionsBar}>
                                    <Link to="/" className={styles.primaryButton}>
                                        <i className="fas fa-store"></i> Volver a la tienda
                                    </Link>
                                    <Link to="/profile/orders" className={styles.secondaryButton}>
                                        <i className="fas fa-box"></i> Mis pedidos
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Mensaje personalizado según el estado
    const getStatusMessage = () => {
        switch (status.text) {
            case 'APROBADO':
                return '¡Tu pedido ha sido confirmado! Estamos preparándolo para ti.';
            case 'PENDIENTE':
                return 'Tu pedido está pendiente de confirmación. Te notificaremos cuando se complete.';
            case 'RECHAZADO':
                return 'Lo sentimos, tu pago ha sido rechazado. Por favor intenta con otro método de pago.';
            case 'ERROR':
                return 'Ha ocurrido un error con tu pedido. Por favor contacta a nuestro equipo de soporte.';
            default:
                return 'Gracias por tu pedido.';
        }
    };

    // Formatear el método de pago para mostrar
    const getFormattedPaymentMethod = () => {
        switch (paymentMethod) {
            case 'culqi':
                return {
                    name: 'Tarjeta de crédito/débito',
                    icon: 'fa-credit-card'
                };
            case 'yape':
                return {
                    name: 'Yape',
                    icon: 'fa-mobile-alt'
                };
            case 'payu':
                return {
                    name: 'PayU',
                    icon: 'fa-credit-card'
                };
            default:
                return {
                    name: 'Pago en línea',
                    icon: 'fa-money-bill'
                };
        }
    };

    const paymentMethodDisplay = getFormattedPaymentMethod();

    return (
        <>
            <AnnouncementBar />
            {showConfetti && status.text === 'APROBADO' && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={200}
                    gravity={0.15}
                />
            )}
            <div className={styles.orderSuccess}>
                <div className={styles.container}>
                    <div className={`${styles.content} ${status.class}`}>
                        <div className={styles.successHeader}>
                            <div className={styles.headerContent}>
                                <div className={styles.successIcon}>
                                    <i className={`fas ${status.text === 'APROBADO' ? 'fa-check-circle' :
                                        status.text === 'PENDIENTE' ? 'fa-clock' :
                                            'fa-exclamation-circle'}`}></i>
                                </div>
                                <h1>{status.text === 'APROBADO' ? '¡Pedido Confirmado!' : `Pedido ${status.text}`}</h1>
                                <p>{getStatusMessage()}</p>
                            </div>
                            <div className={styles.statusBadge}>
                                {status.text}
                            </div>
                        </div>

                        <div className={styles.mainContent}>
                            <div className={styles.orderNumber}>
                                <i className="fas fa-receipt"></i>
                                <span>Número de orden: <strong>{orderId}</strong></span>
                            </div>

                            <div className={styles.orderGrid}>
                                {/* Detalles del Pedido */}
                                <div className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <i className="fas fa-file-invoice"></i>
                                        <h3>Resumen del Pedido</h3>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <div className={styles.orderSummary}>
                                            <div className={styles.summaryRow}>
                                                <span className={styles.summaryLabel}>Fecha</span>
                                                <span className={styles.summaryValue}>
                                                    {formatDate(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt)}
                                                </span>
                                            </div>
                                            <div className={styles.summaryRow}>
                                                <span className={styles.summaryLabel}>Método de pago</span>
                                                <span className={styles.summaryValue}>
                                                    <span className={styles.paymentMethodBadge}>
                                                        <i className={`fas ${paymentMethodDisplay.icon}`}></i>
                                                        {paymentMethodDisplay.name}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className={styles.summaryRow}>
                                                <span className={styles.summaryLabel}>Subtotal</span>
                                                <span className={styles.summaryValue}>
                                                    S/ {paymentMethod === 'payu' ? order.amount : order.subtotal?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                            {(order.discountAmount && order.discountAmount > 0) && (
                                                <div className={styles.summaryRow}>
                                                    <span className={styles.summaryLabel}>Descuento</span>
                                                    <span className={styles.summaryValue}>
                                                        - S/ {order.discountAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            {(order.shipping?.cost || order.shippingCost) && (
                                                <div className={styles.summaryRow}>
                                                    <span className={styles.summaryLabel}>Envío</span>
                                                    <span className={styles.summaryValue}>
                                                        S/ {(order.shipping?.cost || order.shippingCost).toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                                                <span className={styles.summaryLabel}>Total</span>
                                                <span className={styles.summaryValue}>
                                                    S/ {paymentMethod === 'payu' ? order.amount : order.total.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Información de Envío */}
                                <div className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <i className="fas fa-shipping-fast"></i>
                                        <h3>Información de Envío</h3>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <div className={styles.shippingInfo}>
                                            <div className={styles.infoRow}>
                                                <i className={`fas fa-user ${styles.infoIcon}`}></i>
                                                <div className={styles.infoContent}>
                                                    <div className={styles.infoLabel}>Destinatario</div>
                                                    <div className={styles.infoValue}>
                                                        {paymentMethod === 'payu' ?
                                                            order.buyerFullName || 'No especificado' :
                                                            order.shipping?.fullName || 'No especificado'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.infoRow}>
                                                <i className={`fas fa-map-marker-alt ${styles.infoIcon}`}></i>
                                                <div className={styles.infoContent}>
                                                    <div className={styles.infoLabel}>Tipo de envío</div>
                                                    <div className={styles.infoValue}>
                                                        {(order.shipping?.shippingType === 'lima' || order.shippingType === 'lima') ?
                                                            'Lima Metropolitana' : 'Provincias'}
                                                    </div>
                                                </div>
                                            </div>

                                            {(order.shipping?.shippingType === 'lima' || order.shippingType === 'lima') ? (
                                                <>
                                                    <div className={styles.infoRow}>
                                                        <i className={`fas fa-home ${styles.infoIcon}`}></i>
                                                        <div className={styles.infoContent}>
                                                            <div className={styles.infoLabel}>Dirección</div>
                                                            <div className={styles.infoValue}>
                                                                {(order.shipping?.address || order.address) || 'No especificada'},&nbsp;
                                                                {(order.shipping?.district || order.district) || 'No especificado'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className={styles.infoRow}>
                                                        <i className={`fas fa-building ${styles.infoIcon}`}></i>
                                                        <div className={styles.infoContent}>
                                                            <div className={styles.infoLabel}>Ubicación</div>
                                                            <div className={styles.infoValue}>
                                                                {(order.shipping?.region || order.region) || 'No especificada'}, {(order.shipping?.province || order.province) || 'No especificada'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={styles.infoRow}>
                                                        <i className={`fas fa-truck ${styles.infoIcon}`}></i>
                                                        <div className={styles.infoContent}>
                                                            <div className={styles.infoLabel}>Agencia</div>
                                                            <div className={styles.infoValue}>
                                                                {(order.shipping?.agencyName || order.agencyName) || 'No especificada'}, {(order.shipping?.agencyDistrict || order.agencyDistrict) || 'No especificado'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <div className={styles.infoRow}>
                                                <i className={`fas fa-phone ${styles.infoIcon}`}></i>
                                                <div className={styles.infoContent}>
                                                    <div className={styles.infoLabel}>Teléfono</div>
                                                    <div className={styles.infoValue}>
                                                        {(order.shipping?.phone || order.phone) || 'No especificado'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.trackingInfo}>
                                                <i className="fas fa-truck"></i>
                                                <p>Podrás ver el estado de tu pedido en <strong>Mi Cuenta &gt; Mis Pedidos</strong></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Productos */}
                            <div className={styles.card} style={{ marginTop: '2rem' }}>
                                <div className={styles.cardHeader}>
                                    <i className="fas fa-box-open"></i>
                                    <h3>Productos en tu pedido</h3>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.items}>
                                        {paymentMethod === 'payu' && order.items && order.items.map((item, index) => (
                                            <div key={index} className={styles.item}>
                                                <div className={styles.itemImage}>
                                                    <img src={item.image} alt={item.name} />
                                                </div>
                                                <div className={styles.itemDetails}>
                                                    <div className={styles.itemName}>{item.name}</div>
                                                    <div className={styles.itemMeta}>
                                                        <span><i className="fas fa-layer-group"></i> Talla: {item.size}</span>
                                                        <span><i className="fas fa-tshirt"></i> Fit: {item.fitType || 'Regular'}</span>
                                                        <span><i className="fas fa-cubes"></i> Cantidad: {item.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {(paymentMethod === 'culqi' || paymentMethod === 'yape') && order.items && order.items.map((item, index) => (
                                            <div key={index} className={styles.item}>
                                                <div className={styles.itemImage}>
                                                    <img src={item.image} alt={item.name} />
                                                </div>
                                                <div className={styles.itemDetails}>
                                                    <div className={styles.itemName}>{item.name}</div>
                                                    <div className={styles.itemMeta}>
                                                        <span><i className="fas fa-layer-group"></i> Talla: {item.size}</span>
                                                        <span><i className="fas fa-tshirt"></i> Fit: {item.fitType || 'Regular'}</span>
                                                        <span><i className="fas fa-cubes"></i> Cantidad: {item.quantity}</span>
                                                    </div>
                                                    <div className={styles.itemPrice}>S/ {(item.price * item.quantity).toFixed(2)}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className={styles.actionsBar}>
                                {(status.text === 'APROBADO') && (
                                    <Link to="/profile/orders" className={styles.primaryButton}>
                                        <i className="fas fa-box"></i> Ver mis pedidos
                                    </Link>
                                )}

                                {['RECHAZADO', 'ERROR'].includes(status.text) && (
                                    <Link to="/checkout" className={styles.primaryButton}>
                                        <i className="fas fa-redo"></i> Intentar nuevamente
                                    </Link>
                                )}

                                <Link to="/" className={styles.secondaryButton}>
                                    <i className="fas fa-store"></i> Seguir comprando
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderSuccess;