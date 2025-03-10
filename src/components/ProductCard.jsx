import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from '../styles/ProductCard.module.css';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../Firebase';
import { toast } from 'react-toastify';
import LogReg from './LogReg';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [showSizes, setShowSizes] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(product.likes || 0);
  const [showLoginModal, setShowLoginModal] = useState(false); // Add this state
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (product.images.length > 1) {
      setCurrentImageIndex(1);
    }
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
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

  useEffect(() => {
    const checkIfLiked = async () => {
      if (user && product.id) {
        const favoriteRef = doc(db, 'favorites', `${user.uid}_${product.id}`);
        const docSnap = await getDoc(favoriteRef);
        setIsLiked(docSnap.exists());
      }
    };

    checkIfLiked();
  }, [user, product.id]);

  const handleLike = async (e) => {
    e.preventDefault();

    if (!user) {
      setShowLoginModal(true); // Show login modal if user is not authenticated
      return;
    }

    const favoriteRef = doc(db, 'favorites', `${user.uid}_${product.id}`);
    const productRef = doc(db, 'Productos', product.id);

    try {
      if (isLiked) {
        await deleteDoc(favoriteRef);
        await updateDoc(productRef, {
          likes: increment(-1)
        });
        setLikeCount(prev => prev - 1);
        toast.info(`Se ha eliminado ${product.name} de tus favoritos`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: theme === 'dark' ? 'dark' : 'light',
          icon: '💔'
        });
      } else {
        await setDoc(favoriteRef, {
          userId: user.uid,
          productId: product.id,
          createdAt: new Date(),
          productData: {
            name: product.name,
            price: product.price,
            image: product.images[0]
          }
        });
        await updateDoc(productRef, {
          likes: increment(1)
        });
        setLikeCount(prev => prev + 1);
        toast.success(`Se ha añadido ${product.name} a tus favoritos`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: theme === 'dark' ? 'dark' : 'light',
          icon: '❤️',
          style: {
            color: 'white'
          }
        });
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error('Hubo un error al actualizar favoritos', {
        theme: theme === 'dark' ? 'dark' : 'light',
      });
    }
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

        <button
          className={`
            ${styles.likeButton} 
            ${isLiked ? styles.liked : ''} 
            ${isHovered ? styles.visible : styles.hidden}
          `}
          onClick={handleLike}
        >
          <i className="fas fa-heart"></i>
        </button>
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

      {showLoginModal && (
        <LogReg
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}

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