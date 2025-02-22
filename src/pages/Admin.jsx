import React, { useState } from 'react';
import styles from '../styles/Admin.module.css';
import ProductForm from '../components/ProductForm';
import ProductList from '../components/ProductList';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
        { id: 'products', label: 'Productos', icon: 'fas fa-tshirt' },
        { id: 'orders', label: 'Pedidos', icon: 'fas fa-shopping-bag' },
        { id: 'users', label: 'Usuarios', icon: 'fas fa-users' },
        { id: 'settings', label: 'Configuración', icon: 'fas fa-cog' }
    ];

    return (
        <div className={styles.adminContainer}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>EndStore Admin</h2>
                </div>
                <nav className={styles.sidebarNav}>
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <header className={styles.contentHeader}>
                    <h1>{menuItems.find(item => item.id === activeTab)?.label}</h1>
                    <div className={styles.headerActions}>
                        {activeTab === 'products' && (
                            <button
                                className={styles.addButton}
                                onClick={() => setIsProductFormOpen(true)}
                            >
                                <i className="fas fa-plus"></i>
                                Nuevo Producto
                            </button>
                        )}
                    </div>
                </header>

                <div className={styles.contentBody}>
                    {activeTab === 'dashboard' && (
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <i className="fas fa-tshirt"></i>
                                <div className={styles.statInfo}>
                                    <h3>Total Productos</h3>
                                    <p>124</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <i className="fas fa-shopping-cart"></i>
                                <div className={styles.statInfo}>
                                    <h3>Pedidos Pendientes</h3>
                                    <p>8</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <i className="fas fa-users"></i>
                                <div className={styles.statInfo}>
                                    <h3>Usuarios Activos</h3>
                                    <p>1,234</p>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <i className="fas fa-dollar-sign"></i>
                                <div className={styles.statInfo}>
                                    <h3>Ventas del Mes</h3>
                                    <p>S/. 12,345</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'products' && <ProductList />}

                </div>
            </main>
            <ProductForm
                isOpen={isProductFormOpen}
                onClose={() => setIsProductFormOpen(false)}
            />
        </div>

    );
};

export default Admin;