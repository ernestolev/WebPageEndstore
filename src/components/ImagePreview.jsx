import React from 'react';
import styles from '../styles/ImagePreview.module.css';
import { useTheme } from '../context/ThemeContext';

const ImagePreview = ({ images, onRemove }) => {
  return (
    <div className={styles.previewContainer}>
      {images.map((image, index) => (
        <div key={index} className={styles.imagePreview}>
          <img 
            src={image} 
            alt={`Preview ${index + 1}`} 
            className={styles.previewImage} 
          />
          <button 
            type="button" 
            className={styles.removeButton} 
            onClick={() => onRemove(index)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ImagePreview;