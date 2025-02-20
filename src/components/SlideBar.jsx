import React from 'react';
import styles from '../styles/SlideBar.module.css';

const SlideBar = () => {
  return (
    <div className={styles.slideBar}>
      <div className={styles.slider}>
        <div className={styles.slide}>
          <span>Delivery a todo Perú - Lima y Provincias</span>
          <span className={styles.divider}>•</span>
          <span>Usa el código "END05" para un 5% de descuento</span>
          <span className={styles.divider}>•</span>
          <span>La mejor calidad en polos y hoodies!</span>
          <span className={styles.divider}>•</span>
        </div>
        <div className={styles.slide} aria-hidden="true">
          <span>Delivery a todo Perú - Lima y Provincias</span>
          <span className={styles.divider}>•</span>
          <span>Usa el código "END05" para un 5% de descuento</span>
          <span className={styles.divider}>•</span>
          <span>La mejor calidad en polos y hoodies!</span>
          <span className={styles.divider}>•</span>
        </div>
      </div>
    </div>
  );
};

export default SlideBar;