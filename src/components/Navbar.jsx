import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import logo from '../assets/imgs/end-largo2.png';

const Navbar = () => {
  const [currency, setCurrency] = useState('PEN');

  return (
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
          <div className={styles.currencySelector}>
            <button className={styles.currencyButton}>
              {currency === 'PEN' ? '🇵🇪 PEN' : '🇺🇸 USD'}
              <i className="fas fa-chevron-down"></i>
            </button>
            <div className={styles.currencyDropdown}>
              <button onClick={() => setCurrency('PEN')}>🇵🇪 PEN</button>
              <button onClick={() => setCurrency('USD')}>🇺🇸 USD</button>
            </div>
          </div>
          <Link to="/cart" className={styles.cartLink}>
            <i className="fas fa-shopping-cart"></i>
            <span className={styles.cartCount}>0</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;