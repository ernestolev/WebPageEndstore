import React from 'react';
import styles from '../styles/ImagePreview.module.css';
import { useTheme } from '../context/ThemeContext';

const ImagePreview = ({ images, onRemove }) => {
  if (!images || images.length === 0) return null;
  const { theme } = useTheme();

  return (
    <div className={styles.previewGrid}>
      {images.map((image, index) => (
        <div
          key={index}
          className={`${styles.imagePreview} ${styles[theme]}`}
        >          <img
            src={image}
            alt={`Preview ${index + 1}`}
            className={styles.image}
          />
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => onRemove(index)}
            aria-label="Remove image"
          >
            <i className="fas fa-times"></i>
          </button>
          <div className={styles.imageNumber}>
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImagePreview;