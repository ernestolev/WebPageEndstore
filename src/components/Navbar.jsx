import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import logo from '../assets/imgs/end-largo2.png';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <img src={logo} alt="EndStore Logo" className={styles.logoImg} />
        </Link>
        <ul className={styles.navLinks}>
          <li>
            <Link to="/shop" className={styles.navLink}>Comprar</Link>
          </li>
          <li>
            <Link to="/about" className={styles.navLink}>Acerca de</Link>
          </li>
          <li>
            <Link to="/about" className={styles.navLink}>Otras cosas </Link>
          </li>
          <li>
            <Link to="/cart" className={styles.cartLink}>
              <i className="fas fa-shopping-cart"></i>
              <span className={styles.cartCount}>0</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;