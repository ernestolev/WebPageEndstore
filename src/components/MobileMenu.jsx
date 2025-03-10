import React from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../Firebase';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/MobileMenu.module.css';
import logo from '../assets/imgs/end-largo2.png';
import logo2 from '../assets/imgs/end-largo.png';

import LogReg from './LogReg';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const MobileMenu = ({ isOpen, onClose }) => {
    const { user, userData } = useAuth();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false); // Add this line
    const { theme, toggleTheme } = useTheme();

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
                    <img
                        src={theme === 'light' ? logo : logo2}
                        alt="EndStore Logo"
                        className={styles.logo}
                    />
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
                        <div className={styles.userInfoContainer}>
                            <button
                                className={`${styles.userInfo} ${isUserDropdownOpen ? styles.active : ''}`}
                                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                            >
                                <span>{user.displayName || user.email}</span>
                                <i className={`fas fa-chevron-down ${isUserDropdownOpen ? styles.rotate : ''}`}></i>
                            </button>

                            <div className={`${styles.userDropdown} ${isUserDropdownOpen ? styles.show : ''}`}>
                                <Link to="/profile" className={styles.dropdownItem} onClick={onClose}>
                                    <i className="fas fa-user-circle"></i> Mi Perfil
                                </Link>
                                <Link to="/orders" className={styles.dropdownItem} onClick={onClose}>
                                    <i className="fas fa-box"></i> Mis Pedidos
                                </Link>
                                <Link to="/favoritos" className={styles.dropdownItem} onClick={onClose}>
                                    <i className="fas fa-heart"></i> Mis Favoritos
                                </Link>
                                {user.email === 'ermarlevh04@gmail.com' && (
                                    <Link to="/admin" className={styles.dropdownItem} onClick={onClose}>
                                        <i className="fas fa-cog"></i> Admin Panel
                                    </Link>
                                )}
                                <button className={styles.dropdownItem} onClick={handleLogout}>
                                    <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    )}

                    <nav className={styles.navigation}>

                        <Link to="/" className={styles.link} onClick={onClose}>
                            Home
                        </Link>
                        <Link to="/catalogo" className={styles.link} onClick={onClose}>
                            Catálogo
                        </Link>
                        <Link
                            to="/#tracking"
                            className={styles.link}
                            onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById('tracking-section');
                                if (element) {
                                    element.scrollIntoView({ behavior: 'smooth' });
                                } else {
                                    window.location.href = '/#tracking';
                                }
                            }}
                        >
                            Tracking
                        </Link>
                        <Link to="/sobre-nosotros" className={styles.link} onClick={onClose}>
                            Sobre Nosotros
                        </Link>


                        <Link to="/contacto" className={styles.link} onClick={onClose}>
                            Contacto
                        </Link>
                    </nav>
                </div>
            </div>
            <LogReg isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

        </>
    );
};

export default MobileMenu;