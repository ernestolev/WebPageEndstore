import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <h2 className={styles.footerLogo}>
              <span className={styles.endText}>END</span>
              <span className={styles.storeText}>STORE</span>
            </h2>
            <p className={styles.footerDesc}>Your premier destination for F1 inspired fashion</p>
          </div>
          
          <div className={styles.footerLinks}>
            <div className={styles.linkColumn}>
              <h3>Quick Links</h3>
              <Link to="/">Home</Link>
              <Link to="/shop">Shop</Link>
              <Link to="/about">About</Link>
            </div>
            
            <div className={styles.linkColumn}>
              <h3>Customer Service</h3>
              <Link to="/contact">Contact Us</Link>
              <Link to="/shipping">Shipping Info</Link>
              <Link to="/returns">Returns</Link>
            </div>

            <div className={styles.linkColumn}>
              <h3>Connect</h3>
              <div className={styles.socialLinks}>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} EndStore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;