import React, { useState } from 'react';
import styles from '../../styles/Orders.module.css';

const Orders = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState('last30');

    // Example orders data
    const orders = [
        {
            id: 'ORD-001234',
            date: '2024-02-22T14:30:00',
            customer: 'Juan Pérez',
            email: 'juan@example.com',
            total: 299.99,
            status: 'paid',
            items: [
                { name: 'Camiseta Roja', size: 'M', quantity: 2, price: 49.99 },
                { name: 'Pantalón Negro', size: 'L', quantity: 1, price: 200.01 }
            ],
            shipping: {
                address: 'Av. La Marina 123',
                city: 'Lima',
                zipCode: '15086'
            }
        },
        // Add more example orders...
    ];

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

                {orders.map(order => (
                    <div key={order.id} className={styles.orderRow}>
                        <div className={styles.column}>{order.id}</div>
                        <div className={styles.column}>{formatDate(order.date)}</div>
                        <div className={styles.column}>
                            <div className={styles.customerInfo}>
                                <span className={styles.customerName}>{order.customer}</span>
                                <span className={styles.customerEmail}>{order.email}</span>
                            </div>
                        </div>
                        <div className={styles.column}>S/. {order.total.toFixed(2)}</div>
                        <div className={styles.column}>
                            <span className={getStatusBadgeClass(order.status)}>
                                {order.status.toUpperCase()}
                            </span>
                        </div>
                        <div className={styles.column}>
                            <button className={styles.actionButton}>
                                <i className="fas fa-eye"></i>
                            </button>
                            <button className={styles.actionButton}>
                                <i className="fas fa-print"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Orders;