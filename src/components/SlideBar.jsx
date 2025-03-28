import React from 'react';
import styles from '../styles/SlideBar.module.css';

const SlideBar = () => {
  return (
    <div className={styles.slideBar}>
      <div className={styles.slider}>
        <div className={styles.slide}>
          <span>DELIVERY A TODO PERÚ</span>
          <span className={styles.divider}>•</span>
          <span>USA "END005" PARA UN 5% DE DSCT.</span>
          <span className={styles.divider}>•</span>
          <span>SIGUE TUS PEDIDOS CON NUESTRO SISTEMA DE TRACKING</span>
          <span className={styles.divider}>•</span>
        </div>
        <div className={styles.slide} aria-hidden="true">
          <span>DELIVERY A TODO PERÚ</span>
          <span className={styles.divider}>•</span>
          <span>USA "END005" PARA UN 5% DE DSCT.</span>
          <span className={styles.divider}>•</span>
          <span>SIGUE TUS PEDIDOS CON NUESTRO SISTEMA DE TRACKING</span>
          <span className={styles.divider}>•</span>
        </div>
      </div>
    </div>
  );
};  

export default SlideBar;