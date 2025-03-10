import React from 'react';
import styles from '../styles/LoadingSpinner.module.css';
import logo from '../assets/imgs/end-logo2.png';
import logo2 from '../assets/imgs/end-logo.png';
import { useTheme } from '../context/ThemeContext';

const LoadingSpinner = () => {
  const { theme } = useTheme();  // Add this line to get current theme
  
  return (
    <div className={`${styles.spinnerOverlay} ${styles[theme]}`}>
      <div className={styles.spinnerContainer}>
        <img
          src={theme === 'light' ? logo : logo2}
          alt="EndStore Logo"
          className={styles.logo}
        />
        <div className={styles.progressBar}>
          <div className={styles.progress}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;