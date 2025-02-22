import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import logo from '../assets/imgs/end-largo2.png';
import LogReg from './LogReg';
import { useAuth } from '../context/AuthContext'; // Update this line
import { signOut } from 'firebase/auth';
import { auth } from '../Firebase';
import HamburgerMenu from './HamburgerMenu';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const [currency, setCurrency] = useState('PEN');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, userData } = useAuth();  // Update this line
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cart, setIsCartOpen } = useCart();

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              <img src={logo} alt="EndStore Logo" className={styles.logoImg} />
            </Link>
            <ul className={styles.navLinks}>
              <li>
                <Link to="/" className={styles.navLink}>Home</Link>
              </li>
              <li>
                <Link to="/catalogo" className={styles.navLink}>Catálogo</Link>
              </li>
              <li>
                <Link to="/ofertas" className={styles.navLink}>Ofertas</Link>
              </li>
              <li className={styles.dropdown}>
                <span className={styles.navLink}>Categorías <i className="fas fa-chevron-down"></i></span>
                <div className={styles.dropdownContent}>
                  <Link to="/category/jackets">Jackets</Link>
                  <Link to="/category/hoodies">Hoodies</Link>
                  <Link to="/category/polos">Polos</Link>
                </div>
              </li>
              <li>
                <Link to="/recursos" className={styles.navLink}>Recursos</Link>
              </li>
            </ul>
          </div>

          <div className={styles.rightSection}>
            {user ? (
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
                    {(userData?.admin === true || userData?.admin === "true") && (
                      <Link to="/admin" className={styles.dropdownItem}>
                        Panel Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className={styles.dropdownItem}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
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
          </div>
        </div>
      </nav>
      <LogReg isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );



};

export default Navbar;