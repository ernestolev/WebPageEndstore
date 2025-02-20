import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Footer.module.css';
import logo from '../assets/imgs/end-largo2.png';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          {/* Logo and Description Column */}
          <div className={styles.footerBrand}>
            <Link to="/" className={styles.footerLogo}>
              <img src={logo} alt="EndStore Logo" />
            </Link>
            <p className={styles.footerDesc}>
              Tu destino premium para moda inspirada en la F1. Calidad, estilo y pasión por el racing.
            </p>
            <div className={styles.socialLinks}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-tiktok"></i>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>Quick Links</h3>
            <ul className={styles.columnLinks}>
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/about">Sobre Nosotros</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/faqs">FAQs</Link></li>
              <li><Link to="/contact">Contacto</Link></li>
            </ul>
          </div>

          {/* Popular Collections Column */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>Colecciones</h3>
            <ul className={styles.columnLinks}>
              <li><Link to="/collection/jackets">Racing Jackets</Link></li>
              <li><Link to="/collection/hoodies">F1 Hoodies</Link></li>
              <li><Link to="/collection/polos">Sport Polos</Link></li>
              <li><Link to="/collection/new">Nuevos Ingresos</Link></li>
              <li><Link to="/collection/sale">Ofertas</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>Contáctanos</h3>
            <ul className={styles.contactInfo}>
              <li>
                <i className="fas fa-phone"></i>
                <span>+51 999 888 777</span>
              </li>
              <li>
                <i className="fas fa-envelope"></i>
                <span>contacto@endstore.com</span>
              </li>
              <li>
                <i className="fas fa-map-marker-alt"></i>
                <span>Lima, Perú</span>
              </li>
              <li>
                <i className="fas fa-clock"></i>
                <span>Lun - Sáb: 9:00 - 18:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.bottomContent}>
            <div className={styles.bottomLeft}>
              <p className={styles.copyright}>
                © {new Date().getFullYear()} EndStore. Todos los derechos reservados.
              </p>
              <a
                href="https://end-s0luti0ns.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.developerLink}
              >
                Web hecha por End Solutions
                <svg
                  className={styles.arrow}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 17L17 7M17 7H7M17 7V17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
            <div className={styles.legalLinks}>
              <Link to="/privacy">Privacidad</Link>
              <Link to="/terms">Términos</Link>
              <Link to="/cookies">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;