import React from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../Firebase';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/MobileMenu.module.css';
import imglogo from '../assets/imgs/end-largo2.png';
import LogReg from './LogReg';
import { useState } from 'react';

const MobileMenu = ({ isOpen, onClose }) => {
    const { user, userData } = useAuth();
    const [isAuthOpen, setIsAuthOpen] = useState(false); // Add this line

    const handleLogout = async () => {
        try {
            await signOut(auth);
            onClose();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <>
            <div
                className={`${styles.overlay} ${isOpen ? styles.active : ''}`}
                onClick={onClose}
            />
            <div className={`${styles.mobileMenu} ${isOpen ? styles.active : ''}`}>
                <div className={styles.header}>
                    <img src={imglogo} alt="End Store Logo" className={styles.logo} />
                    <button className={styles.closeButton} onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>


                <div className={styles.content}>
                    {!user && (
                        <button
                            className={styles.loginButton}
                            onClick={() => {
                                onClose();
                                setIsAuthOpen(true);
                            }}
                        >
                            Iniciar Sesión / Registrarse
                        </button>
                    )}

                    {user && (
                        <div className={styles.userInfo}>
                            <span>{user.displayName || user.email}</span>
                        </div>
                    )}


                    <nav className={styles.navigation}>

                        {user && (
                            <>
                                <button className={styles.logoutButton} onClick={handleLogout}>
                                    <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                                </button>
                                <Link to="/profile" className={styles.link} onClick={onClose}>
                                    <i className="fas fa-user-circle"></i> Mi Perfil
                                </Link>
                                <Link to="/orders" className={styles.link} onClick={onClose}>
                                    <i className="fas fa-box"></i> Mis Pedidos
                                </Link>
                                {user.email === 'ermarlevh04@gmail.com' && (
                                    <Link to="/admin" className={styles.link} onClick={onClose}>
                                        <i className="fas fa-cog"></i> Admin Panel
                                    </Link>
                                )}

                            </>
                        )}

                        <Link to="/" className={styles.link} onClick={onClose}>
                            Home
                        </Link>
                        <Link to="/catalogo" className={styles.link} onClick={onClose}>
                            Catálogo
                        </Link>
                        <Link to="/ofertas" className={styles.link} onClick={onClose}>
                            Ofertas
                        </Link>

                        <div className={styles.categorySection}>
                            <h3>Categorías</h3>
                            <Link to="/category/jackets" className={styles.categoryLink} onClick={onClose}>
                                Jackets
                            </Link>
                            <Link to="/category/hoodies" className={styles.categoryLink} onClick={onClose}>
                                Hoodies
                            </Link>
                            <Link to="/category/polos" className={styles.categoryLink} onClick={onClose}>
                                Polos
                            </Link>
                        </div>

                        <Link to="/recursos" className={styles.link} onClick={onClose}>
                            Recursos
                        </Link>
                    </nav>
                </div>
            </div>
            <LogReg isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

        </>
    );
};

export default MobileMenu;