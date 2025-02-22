import React from 'react';
import styles from '../styles/LoadingSpinner.module.css';
import logo from '../assets/imgs/end-logo2.png';

const LoadingSpinner = () => (
  <div className={styles.spinnerOverlay}>
    <div className={styles.spinnerContainer}>
      <img src={logo} alt="END Store" className={styles.logo} />
      <div className={styles.progressBar}>
        <div className={styles.progress}></div>
      </div>
    </div>
  </div>
);

export default LoadingSpinner;