import React from 'react';
import styles from '../styles/HamburgerMenu.module.css';

const HamburgerMenu = ({ isOpen, toggleMenu }) => {
  return (
    <button 
      className={`${styles.hamburger} ${isOpen ? styles.active : ''}`}
      onClick={toggleMenu}
    >
      <span className={styles.line}></span>
      <span className={styles.line}></span>
      <span className={styles.line}></span>
    </button>
  );
};

export default HamburgerMenu;