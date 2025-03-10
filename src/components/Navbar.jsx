import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import logo from '../assets/imgs/end-largo2.png';
import logo2 from '../assets/imgs/end-largo.png';
import LogReg from './LogReg';
import { useAuth } from '../context/AuthContext'; // Update this line
import { signOut } from 'firebase/auth';
import { auth } from '../Firebase';
import HamburgerMenu from './HamburgerMenu';
import { useCart } from '../context/CartContext';
import MobileMenu from './MobileMenu';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [currency, setCurrency] = useState('PEN');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, userData } = useAuth();  // Update this line
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cart, setIsCartOpen } = useCart();
  const { theme, toggleTheme } = useTheme();

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  useEffect(() => {
    console.log('User Data:', userData);
  }, [userData]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.leftSection}>
            <Link to="/" className={styles.logo}>
              <img
                src={theme === 'light' ? logo : logo2}
                alt="EndStore Logo"
                className={styles.logoImg}
              />
            </Link>
            <ul className={styles.navLinks}>
              <li>
                <Link to="/" className={styles.navLink}>Home</Link>
              </li>
              <li>
                <Link to="/catalogo" className={styles.navLink}>Catálogo</Link>
              </li>
              <li>
                <Link
                  to="/#tracking"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById('tracking-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.location.href = '/#tracking';
                    }
                  }}
                  className={styles.navLink}
                >
                  Tracking
                </Link>
              </li>
              <li>
                <Link to="/contacto" className={styles.navLink}>Contacto</Link>
              </li>
              <li>
                <Link to="/sobre-nosotros" className={styles.navLink}>Sobre Nosotros</Link>
              </li>
            </ul>
          </div>

          <div className={styles.rightSection}>
            {user ? (
              <>
                <div className={styles.userMenu}>
                  <button
                    className={styles.userButton}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <i className="far fa-user"></i>
                    <span className={styles.userName}>{user.displayName || user.email}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className={styles.userDropdown}>
                      <Link to="/profile" className={styles.dropdownItem}>Mi Perfil</Link>
                      <Link to="/orders" className={styles.dropdownItem}>Mis Pedidos</Link>
                      <Link to="/favoritos" className={styles.dropdownItem}>
                        Mis Favoritos
                      </Link>
                      <button
                        onClick={handleLogout}
                        className={styles.dropdownItem}
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>

                {user.email === 'ermarlevh04@gmail.com' && (
                  <Link to="/admin" className={styles.adminButton}>
                    <i className="fas fa-cog"></i>
                  </Link>
                )}

              </>
            ) : (
              <button
                className={styles.userButton}
                onClick={() => setIsAuthOpen(true)}
              >
                <i className="far fa-user"></i>
              </button>
            )}

            <div className={styles.cartLink} onClick={() => setIsCartOpen(true)}>
              <i className="fas fa-shopping-cart"></i>
              {cartItemCount > 0 && (
                <span className={styles.cartCount}>{cartItemCount}</span>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className={styles.themeToggle}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <i className="fas fa-moon"></i>
              ) : (
                <i className="fas fa-sun"></i>
              )}
            </button>
            <button
              className={styles.hamburgerButton}
              onClick={toggleMobileMenu}
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </nav>
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <LogReg isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );



};

export default Navbar;