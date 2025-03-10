import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Footer.module.css';
import logo from '../assets/imgs/end-largo2.png';
import logo2 from '../assets/imgs/end-largo.png';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {

  const { theme, toggleTheme } = useTheme();
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          {/* Logo and Description Column */}
          <div className={styles.footerBrand}>
            <Link to="/" className={styles.footerLogo}>
              <img
                src={theme === 'light' ? logo : logo2}
                alt="EndStore Logo"
                className={styles.logoImg}
              />
            </Link>
            <p className={styles.footerDesc}>
              Tu destino premium para moda inspirada en la F1. Calidad, estilo y pasión por el racing.
            </p>
            <div className={styles.socialLinks}>
              <a href="https://www.instagram.com/end.store.pe?igsh=MWFuaTNnZGE1bGt0bw%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://wa.me/51981410745" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-whatsapp"></i>
              </a>
              <a href="https://www.tiktok.com/@end.store.pe?_t=ZM-8uRByss2Uyd&_r=1" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-tiktok"></i>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>Quick Links</h3>
            <ul className={styles.columnLinks}>
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/sobre-nosotros">Sobre Nosotros</Link></li>
              <li><Link to="/faqs">FAQs</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </div>

          {/* Popular Collections Column */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>Colecciones</h3>
            <ul className={styles.columnLinks}>
              <li><Link to="/catalogo">Racing Jackets</Link></li>
              <li><Link to="/catalogo">F1 Hoodies</Link></li>
              <li><Link to="/catalogo">Sport Polos</Link></li>
              <li><Link to="/catalogo">Nuevos Ingresos</Link></li>
              <li><Link to="/catalogo">Ofertas</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className={styles.footerColumn}>
            <h3 className={styles.columnTitle}>Contáctanos</h3>
            <ul className={styles.contactInfo}>
              <li>
                <i className="fas fa-phone"></i>
                <span>+51 981 410 745</span>
              </li>
              <li>
                <i className="fas fa-envelope"></i>
                <span>ermarlevh04@gmail.com</span>
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
              <Link to="/politicas-cambios">Cambios y Devoluciones</Link>
              <Link to="/libro-reclamaciones" className={styles.reclamacionesLink}>
                <i className="fas fa-book"></i>
                Libro de Reclamaciones
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;