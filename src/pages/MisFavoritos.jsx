import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../Firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AnnouncementBar from '../components/AnnouncementBar';
import styles from '../styles/MisFavoritos.module.css';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

const MisFavoritos = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { theme } = useTheme();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const favoritesQuery = query(
          collection(db, 'favorites'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(favoritesQuery);
        const favoritesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setFavorites(favoritesData);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast.error('No se pudieron cargar tus favoritos', {
          theme: theme === 'dark' ? 'dark' : 'light',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [user, theme]);

  const handleRemoveFavorite = async (favorite) => {
    try {
      // Remove from favorites collection
      await deleteDoc(doc(db, 'favorites', favorite.id));
      
      // Decrement like counter on product
      await updateDoc(doc(db, 'Productos', favorite.productId), {
        likes: increment(-1)
      });
      
      // Update local state
      setFavorites(favorites.filter(item => item.id !== favorite.id));
      
      toast.info(`Se ha eliminado ${favorite.productData.name} de tus favoritos`, {
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
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Hubo un error al eliminar de favoritos', {
        theme: theme === 'dark' ? 'dark' : 'light',
      });
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.productId,
      name: product.productData.name,
      price: product.productData.price,
      image: product.productData.image,
      quantity: 1
    });
    
    toast.success(`${product.productData.name} añadido al carrito`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: theme === 'dark' ? 'dark' : 'light',
      icon: '🛒',
      style: {
        background: 'linear-gradient(135deg, #e10600, #ff4d4d)',
        color: 'white',
      }
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <>
        <AnnouncementBar />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando tus favoritos...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AnnouncementBar />
      <div className={styles.favoritosContainer}>
        <h1>Mis Favoritos</h1>
        
        {favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <i className="fas fa-heart-broken"></i>
            </div>
            <h2>No tienes favoritos aún</h2>
            <p>Explora nuestro catálogo y añade productos a tus favoritos</p>
            <Link to="/" className={styles.exploreButton}>
              Ver Catálogo
            </Link>
          </div>
        ) : (
          <motion.div 
            className={styles.favoritesGrid}
            variants={container}
            initial="hidden"
            animate="show"
          >
            {favorites.map(favorite => (
              <motion.div 
                key={favorite.id} 
                className={styles.favoriteCard}
                variants={item}
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
              >
                <div className={styles.favoriteImage}>
                  <Link to={`/producto/${favorite.productId}`}>
                    <img 
                      src={favorite.productData.image} 
                      alt={favorite.productData.name} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder.png';
                      }}
                    />
                  </Link>
                  <button 
                    className={styles.removeButton}
                    onClick={() => handleRemoveFavorite(favorite)}
                  >
                    <i className="fas fa-heart-broken"></i>
                  </button>
                </div>
                
                <div className={styles.favoriteInfo}>
                  <Link to={`/producto/${favorite.productId}`}>
                    <h3>{favorite.productData.name}</h3>
                  </Link>
                  <div className={styles.priceSection}>
                    <p className={styles.price}>
                      S/. {favorite.productData.price?.toFixed(2)}
                    </p>
                  </div>
                  <span className={styles.favoriteDate}>
                    Añadido el {new Date(favorite.createdAt.toDate()).toLocaleDateString('es-PE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
};

export default MisFavoritos;