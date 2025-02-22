import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from '../styles/ProductCard.module.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [showSizes, setShowSizes] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleMouseEnter = () => {
    if (product.images.length > 1) {
      setCurrentImageIndex(1);
    }
  };
  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  const discountedPrice = product.discount ?
    product.price * (1 - product.discount / 100) :
    product.price;

  const isOutOfStock = product.stock === 0;

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigation to detail page
    if (!selectedSize) {
      setShowSizes(true);
      return;
    }
    addToCart(product, 1, selectedSize);
    setShowSizes(false);
  };

  return (
    <Link to={`/product/${product.id}`} className={styles.card}>
      <div
        className={styles.imageWrapper}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {product.images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`${product.name} - View ${index + 1}`}
            className={`
        ${styles.productImage} 
        ${isOutOfStock ? styles.outOfStock : ''} 
        ${index === currentImageIndex ? styles.visible : ''}
      `}
          />
        ))}
        {isOutOfStock && (
          <div className={styles.outOfStockOverlay}>
            <span>SIN STOCK</span>
          </div>
        )}
        {product.discount > 0 && !isOutOfStock && (
          <div className={styles.discountBadge}>
            -{product.discount}%
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{product.name}</h3>
        <div className={styles.priceContainer}>
          {product.discount > 0 ? (
            <>
              <span className={styles.originalPrice}>
                S/. {product.price.toFixed(2)}
              </span>
              <span className={styles.discountedPrice}>
                S/. {discountedPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className={styles.price}>S/. {product.price.toFixed(2)}</span>
          )}
        </div>

        {!isOutOfStock && (
          <div className={styles.addToCartSection}>
            {showSizes && (
              <div className={styles.sizesGrid}>
                {Object.entries(product.sizes).map(([size, stock]) => (
                  <button
                    key={size}
                    className={`${styles.sizeButton} ${selectedSize === size ? styles.selected : ''
                      } ${stock === 0 ? styles.disabled : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (stock > 0) setSelectedSize(size);
                    }}
                    disabled={stock === 0}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;