import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../Firebase';
import styles from '../../styles/Users.module.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersQuery = query(
                    collection(db, 'Users'),
                    orderBy('createdAt', 'desc')
                );

                const snapshot = await getDocs(usersQuery);

                // Fetch all paid orders
                const ordersQuery = query(
                    collection(db, 'Orders'),
                    where('status', '==', 'PAID')
                );
                const ordersSnapshot = await getDocs(ordersQuery);

                // Create a map of user IDs to their order count
                const orderCountByUser = {};
                ordersSnapshot.docs.forEach(doc => {
                    const order = doc.data();
                    if (order.userId) {
                        orderCountByUser[order.userId] = (orderCountByUser[order.userId] || 0) + 1;
                    }
                });

                // Map users with their order counts
                const usersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    orderCount: orderCountByUser[doc.id] || 0
                }));

                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
    );

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('es-PE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.usersPage}>
            <div className={styles.filters}>
                <div className={styles.searchBar}>
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.usersTable}>
                <div className={styles.tableHeader}>
                    <div className={styles.column}>Usuario</div>
                    <div className={styles.column}>Contacto</div>
                    <div className={styles.column}>Registro</div>
                    <div className={styles.column}>Último acceso</div>
                    <div className={styles.column}>Pedidos</div>
                    <div className={styles.column}>Estado</div>
                </div>

                {loading ? (
                    <div className={styles.loading}>Cargando usuarios...</div>
                ) : (
                    filteredUsers.map(user => (
                        <div key={user.id} className={styles.userRow}>
                            <div className={styles.column}>
                                <div className={styles.userInfo}>
                                    <div className={styles.userAvatar}>
                                        {user.name ? user.name[0].toUpperCase() : '?'}
                                    </div>
                                    <div className={styles.userDetails}>
                                        <span className={styles.userName}>{user.name || 'Sin nombre'}</span>
                                        <span className={styles.userEmail}>{user.email}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.column}>
                                <div className={styles.contactInfo}>
                                    <span>{user.phone || 'No registrado'}</span>
                                    <span>{user.addresses?.length || 0} direcciones</span>
                                </div>
                            </div>
                            <div className={styles.column}>
                                {formatDate(user.createdAt)}
                            </div>
                            <div className={styles.column}>
                                {formatDate(user.lastLogin)}
                            </div>
                            <div className={styles.column}>
                                <span className={styles.orderCount}>
                                    {user.orderCount || 0}
                                </span>
                            </div>
                            <div className={styles.column}>
                                <span className={`${styles.statusBadge} ${user.isActive ? styles.active : styles.inactive
                                    }`}>
                                    {user.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Users;