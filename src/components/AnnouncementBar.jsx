import React from 'react';
import styles from '../styles/AnnouncementBar.module.css';

const AnnouncementBar = () => {
  return (
    <div className={styles.announcementBar}>
      <div className={styles.slider}>
        <div className={styles.slide}>
          <span className={styles.tag}>#Ofertas:</span> Últimas novedades en F1 Racing Collection
          <span className={styles.divider}>•</span>
          <span className={styles.tag}>#Bienvenido:</span> Explora las nuevas ofertas de cada día
          <span className={styles.divider}>•</span>
          <span className={styles.tag}>#EndStore:</span> Diferentes estilos
          <span className={styles.divider}>•</span>
          <span className={styles.tag}>#Envío:</span> Gratis en compras mayores a S/99
        </div>
        <div className={styles.slide} aria-hidden="true">
          {/* Duplicate for seamless loop */}
          <span className={styles.tag}>#Ofertas:</span> Últimas novedades en F1 Racing Collection
          <span className={styles.divider}>•</span>
          <span className={styles.tag}>#Bienvenido:</span> Explora las nuevas ofertas de cada día
          <span className={styles.divider}>•</span>
          <span className={styles.tag}>#EndStore:</span> Diferentes estilos
          <span className={styles.divider}>•</span>
          <span className={styles.tag}>#Envío:</span> Gratis en compras mayores a S/99
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;