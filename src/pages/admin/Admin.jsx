import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import styles from '../../styles/Admin.module.css';
import { Link } from 'react-router-dom';
const Admin = () => {
    const [isNavOpen, setIsNavOpen] = useState(false);
    const location = useLocation();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line', path: '/admin/dashboard' },
        { id: 'products', label: 'Productos', icon: 'fas fa-tshirt', path: '/admin/products' },
        { id: 'categorias', label: 'Categorias', icon: 'fas fa-star', path: '/admin/categorias' },
        { id: 'orders', label: 'Pedidos', icon: 'fas fa-shopping-bag', path: '/admin/orders' },
        { id: 'users', label: 'Usuarios', icon: 'fas fa-users', path: '/admin/users' },
        { id: 'codigos', label: 'Códigos Desc.', icon: 'fas fa-ticket-alt', path: '/admin/codigos' }
    ];

    const handleNavLinkClick = () => {
        setIsNavOpen(false);
    };

    return (
        <div className={styles.adminContainer}>
            {/* Mobile Nav Trigger */}
            <button 
                className={styles.navTrigger}
                onClick={() => setIsNavOpen(!isNavOpen)}
                aria-label="Toggle navigation"
            >
                <i className={`fas ${isNavOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>

            {/* Mobile Nav Overlay */}
            {isNavOpen && (
                <div 
                    className={styles.overlay} 
                    onClick={() => setIsNavOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`${styles.sidebar} ${isNavOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h2>EndStore Admin</h2>
                    <Link to="/" className={styles.homeButton}>
                        <i className="fas fa-home"></i>
                        <span>Volver a la Tienda</span>
                    </Link>
                </div>
                <nav className={styles.sidebarNav}>
                    {menuItems.map(item => (
                        <NavLink
                            key={item.id}
                            to={item.path}
                            className={({ isActive }) => 
                                `${styles.navItem} ${isActive ? styles.active : ''}`
                            }
                            onClick={handleNavLinkClick}
                        >
                            <i className={item.icon}></i>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <main className={styles.mainContent}>
                <Outlet />
            </main>
        </div>
    );
};

export default Admin;