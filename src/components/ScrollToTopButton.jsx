import { useState, useEffect } from 'react';
import styles from '../styles/ScrollToTopButton.module.css';

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled up 300px
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    // Clean up event listener
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      className={`${styles.scrollButton} ${isVisible ? styles.visible : ''}`}
      onClick={scrollToTop}
      aria-label="Volver arriba"
    >
      <i className="fas fa-arrow-up"></i>
    </button>
  );
};

export default ScrollToTopButton;