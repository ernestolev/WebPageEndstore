import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/ProductCard.module.css';

const ProductCard = ({ product }) => {
  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <span className={styles.category}>{product.category}</span>
        <img src={product.image} alt={product.title} className={styles.image} />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{product.title}</h3>
        <span className={styles.price}>${product.price}</span>
        <button className={styles.addToCart}>
          Agregar al carrito
        </button>
      </div>
    </div>
  );
};

export default ProductCard;