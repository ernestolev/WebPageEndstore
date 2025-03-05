import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase';
import styles from '../../styles/Orders.module.css';
import AdminTrackingModal from '../../components/AdminTrackingModal';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState('last30');
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // Base query
                let ordersQuery = query(
                    collection(db, 'Orders'),
                    where('status', '==', 'PAID'),
                    orderBy('orderDate', 'desc')
                );

                const snapshot = await getDocs(ordersQuery);
                const ordersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    orderDate: doc.data().orderDate?.toDate()
                }));

                setOrders(ordersData);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.shipping.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.shipping.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

        // Date range filter
        const orderDate = new Date(order.orderDate);
        const now = new Date();
        const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);

        const matchesDate =
            (dateRange === 'today' && daysDiff < 1) ||
            (dateRange === 'last7' && daysDiff <= 7) ||
            (dateRange === 'last30' && daysDiff <= 30) ||
            (dateRange === 'last90' && daysDiff <= 90);

        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'paid': styles.statusPaid,
            'pending': styles.statusPending,
            'shipped': styles.statusShipped,
            'cancelled': styles.statusCancelled
        };
        return `${styles.statusBadge} ${statusClasses[status] || ''}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-PE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.ordersPage}>
            <header className={styles.header}>
                <h1>Pedidos</h1>
                <div className={styles.headerActions}>
                    <button className={styles.exportButton}>
                        <i className="fas fa-download"></i>
                        Exportar
                    </button>
                </div>
            </header>

            <div className={styles.filters}>
                <div className={styles.searchBar}>
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Buscar por ID de pedido o cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="paid">Pagado</option>
                        <option value="pending">Pendiente</option>
                        <option value="shipped">Enviado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>

                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="today">Hoy</option>
                        <option value="last7">Últimos 7 días</option>
                        <option value="last30">Últimos 30 días</option>
                        <option value="last90">Últimos 90 días</option>
                    </select>
                </div>
            </div>

            <div className={styles.ordersTable}>
                <div className={styles.tableHeader}>
                    <div className={styles.column}>Pedido</div>
                    <div className={styles.column}>Fecha</div>
                    <div className={styles.column}>Cliente</div>
                    <div className={styles.column}>Total</div>
                    <div className={styles.column}>Estado</div>
                    <div className={styles.column}>Acciones</div>
                </div>

                {filteredOrders.map(order => (
                    <div key={order.id} className={styles.orderRow}>
                        <div className={styles.column}>{order.id}</div>
                        <div className={styles.column}>{formatDate(order.orderDate)}</div>
                        <div className={styles.column}>
                            <div className={styles.customerInfo}>
                                <span className={styles.customerName}>{order.shipping.fullName}</span>
                                <span className={styles.customerEmail}>{order.shipping.email}</span>
                            </div>
                        </div>
                        <div className={styles.column}>S/. {order.total.toFixed(2)}</div>
                        <div className={styles.column}>
                            <span className={getStatusBadgeClass(order.status)}>
                                {order.status.toUpperCase()}
                            </span>
                        </div>
                        <div className={styles.column}>
                            <button
                                className={styles.actionButton}
                                onClick={() => setSelectedOrderId(order.id)}
                            >
                                <i className="fas fa-truck"></i>
                            </button>
                            <button className={styles.actionButton}>
                                <i className="fas fa-eye"></i>
                            </button>
                            <button className={styles.actionButton}>
                                <i className="fas fa-print"></i>
                            </button>
                        </div>
                        {selectedOrderId && (
                            <AdminTrackingModal
                                orderId={selectedOrderId}
                                onClose={() => setSelectedOrderId(null)}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Orders;