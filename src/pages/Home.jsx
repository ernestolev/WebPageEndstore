import React, { useState, useEffect } from 'react';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import AnnouncementBar from '../components/AnnouncementBar';
import SlideBar from '../components/SlideBar';
import styles from '../styles/Home.module.css';
import { Link } from 'react-router-dom';
import modelimg from '../assets/imgs/img-wa1.png';
import imgejemplo1 from '../assets/imgs/img-ejemplo1.png';
import TestimonialSlider from '../components/TestimonialSlider';
import LoadingSpinner from '../components/LoadingSpinner';
import { collection, getDocs, query, where } from 'firebase/firestore'; import { db } from '../Firebase';
import sumercol from '../assets/imgs/Summercollect.png';
import racingcol from '../assets/imgs/racingcollection.png';
import streetcol from '../assets/imgs/streetcolect.png';
import TrackingSection from '../components/TrackingSection';
import videoq from '../assets/video/vid-quiality.mov';
import imgq from '../assets/imgs/qualityimg.png';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [products, setProducts] = useState([]); // Add this if you need it
  const [categoryProducts, setCategoryProducts] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [saleProducts, setSaleProducts] = useState([]);
  const MAX_SALE_PRODUCTS = 8; // This will show 2 rows of 4 products

  useEffect(() => {
    const fetchSaleProducts = async () => {
      try {
        const querySnapshot = await getDocs(
          query(
            collection(db, 'Productos'),
            where('discount', '>', 0)
          )
        );
        const products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          images: Array.isArray(doc.data().images) ? doc.data().images : []
        }));

        // Sort by discount percentage and limit to MAX_SALE_PRODUCTS (8)
        const sortedAndLimitedProducts = products
          .sort((a, b) => b.discount - a.discount)
          .slice(0, MAX_SALE_PRODUCTS);

        setSaleProducts(sortedAndLimitedProducts);
      } catch (error) {
        console.error('Error fetching sale products:', error);
      }
    };

    fetchSaleProducts();
  }, []);


  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].name.toLowerCase());
    }
  }, [categories]);




  useEffect(() => {
    if (activeCategory && categories.length > 0) {
      const fetchProductsByCategory = async () => {
        setLoadingProducts(true);
        try {
          // Find the exact category name from categories array
          const categoryObj = categories.find(
            cat => cat.name.toLowerCase() === activeCategory
          );

          if (categoryObj) {
            const querySnapshot = await getDocs(
              query(
                collection(db, 'Productos'),
                where('category', '==', categoryObj.name) // Use exact category name
              )
            );

            const products = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            setCategoryProducts(prev => ({
              ...prev,
              [activeCategory]: products
            }));
          }
        } catch (error) {
          console.error('Error fetching products:', error);
        } finally {
          setLoadingProducts(false);
        }
      };

      if (!categoryProducts[activeCategory]) {
        fetchProductsByCategory();
      }
    }
  }, [activeCategory, categories]);
  useEffect(() => {
    // Loading timer
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'Categorias'));
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();

    // Cleanup function
    return () => clearTimeout(timer);
  }, []); // Single useEffect for initial loading

  if (loading) {
    return <LoadingSpinner />;
  }

  const featuredProducts = [
    {
      id: 1,
      title: 'Racing Hoodie Black',
      price: 89.99,
      oldPrice: 119.99,
      image: imgejemplo1,
      category: 'Hoodies',
      colors: ['#000000', '#FF0000', '#FFFFFF'],
      inStock: true
    },
    {
      id: 2,
      title: 'F1 Team Cap',
      price: 29.99,
      oldPrice: 39.99,
      image: imgejemplo1,
      category: 'Accessories',
      colors: ['#000000', '#FFFFFF', '#0000FF'],
      inStock: true
    },
    {
      id: 3,
      title: 'Racing Jacket Red',
      price: 149.99,
      oldPrice: 189.99,
      image: imgejemplo1,
      category: 'Jackets',
      colors: ['#FF0000', '#000000', '#808080'],
      inStock: false
    },
    {
      id: 4,
      title: 'F1 Sport Polo',
      price: 59.99,
      oldPrice: 79.99,
      image: imgejemplo1,
      category: 'Polos',
      colors: ['#FFFFFF', '#000000', '#FF0000'],
      inStock: true
    },
    {
      id: 5,
      title: 'Racing Team Hoodie',
      price: 94.99,
      oldPrice: 124.99,
      image: imgejemplo1,
      category: 'Hoodies',
      colors: ['#000000', '#FF0000'],
      inStock: true
    },
    {
      id: 6,
      title: 'F1 Limited Jacket',
      price: 199.99,
      oldPrice: 249.99,
      image: imgejemplo1,
      category: 'Jackets',
      colors: ['#000000', '#FF0000'],
      inStock: true
    },
    {
      id: 7,
      title: 'Speed Polo',
      price: 64.99,
      oldPrice: 84.99,
      image: imgejemplo1,
      category: 'Polos',
      colors: ['#FFFFFF', '#000000'],
      inStock: true
    },
    {
      id: 8,
      title: 'Track Day Hoodie',
      price: 89.99,
      oldPrice: 119.99,
      image: imgejemplo1,
      category: 'Hoodies',
      colors: ['#000000', '#808080'],
      inStock: false
    }
  ];


  return (
    <>
      <AnnouncementBar />
      <div className={styles.home}>
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>
              Eleva tu <span className={styles.accentText}>estilo</span>
              <br />con el espiritu racing
            </h1>
            <p className={styles.heroSubtitle}>
              Descubre nuestras exclusivas colecciones basadas en inspiraciones de carros y tematicas F1.
              Hoodies, Jackets, Camisetas y más.
            </p>
            <Link to="/catalogo" className={styles.shopNow}>Explorar</Link>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.imageWrapper}>
              <img src={modelimg} alt="Featured Product" className={styles.heroImage} />
            </div>
          </div>
        </section>
        <SlideBar />
        <section className={styles.categoriesSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Nuestra Top Collection</h2>
            <div className={styles.categoriesGrid}>
              {categories.map(category => (
                <Link
                  to={`/catalogo`}
                  key={category.id}
                  className={styles.categoryCard}
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className={styles.categoryImageContainer}>
                    <img
                      src={category.images[0]}
                      alt={category.name}
                      className={`${styles.categoryImage} ${styles.primaryImage}`}
                    />
                    {category.images[1] && (
                      <img
                        src={category.images[1]}
                        alt={category.name}
                        className={`${styles.categoryImage} ${styles.secondaryImage} ${hoveredCategory === category.id ? styles.show : ''
                          }`}
                      />
                    )}
                  </div>
                  <h3 className={styles.categoryName}>{category.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.gridGallerySection}>
          <div className={styles.container}>
            <div className={styles.gridGallery}>
              <div className={styles.mainImage}>
                <img src={racingcol} alt="Racing Collection" />
                <div className={styles.overlay}>
                  <h3>Racing Collection</h3>
                  <Link to="/catalolgo" className={styles.linkButton}>Ver más</Link>
                </div>
              </div>
              <div className={styles.secondaryImages}>
                <div className={styles.topImage}>
                  <img src={sumercol} alt="Summer Collection" />
                  <div className={styles.overlay}>
                    <h3>Summer Collection</h3>
                    <Link to="/catalolgo" className={styles.linkButton}>Ver más</Link>
                  </div>
                </div>
                <div className={styles.bottomImage}>
                  <img src={streetcol} alt="Street Collection" />
                  <div className={styles.overlay}>
                    <h3>Street Collection</h3>
                    <Link to="/catalolgo" className={styles.linkButton}>Ver más</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="tracking-section" name="tracking">
          <TrackingSection />
        </section>
        <section className={styles.flashSaleSection}>
          <div className={styles.container}>
            <div className={styles.saleHeader}>
              <h2 className={styles.saleTitle}>Ofertas Flash</h2>
              <p className={styles.saleSubtitle}>¡Productos con descuento!</p>
            </div>
            <div className={styles.saleGrid}>
              {saleProducts.length > 0 ? (
                saleProducts.map(product => {
                  const discountedPrice = product.price * (1 - product.discount / 100);
                  return (
                    <div key={product.id} className={styles.saleCard}>
                      <Link to={`/product/${product.id}`} className={styles.saleCard}>
                        <div className={styles.cardTop}>
                          <div className={styles.imageContainer}>
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                onError={(e) => {
                                  console.error('Image load error:', e);
                                  e.target.src = 'fallback-image-url'; // Add a fallback image
                                }}
                              />
                            ) : (
                              <div className={styles.noImage}>
                                <i className="fas fa-image"></i>
                              </div>
                            )}
                            <span className={styles.discountBadge}>
                              -{product.discount}%
                            </span>
                            <span className={`${styles.stockBadge} ${product.stock > 0 ? styles.inStock : styles.outStock
                              }`}>
                              {product.stock > 0 ? 'En stock' : 'Agotado'}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <div className={styles.cardBottom}>
                        <div className={styles.productInfo}>
                          <span className={styles.category}>{product.category}</span>
                          <h3 className={styles.productTitle}>{product.name}</h3>
                          <div className={styles.priceContainer}>
                            <span className={styles.currentPrice}>
                              S/. {discountedPrice.toFixed(2)}
                            </span>
                            <span className={styles.oldPrice}>
                              S/. {product.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <button
                          className={styles.addToCartBtn}
                          disabled={product.stock === 0}
                        >
                          {product.stock > 0 ? 'Añadir al carrito' : 'Agotado'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.noSaleProducts}>
                  No hay productos en oferta en este momento
                </div>
              )}
            </div>
          </div>
        </section>
        <section className={styles.qualitySection}>
          <div className={styles.qualityContainer}>
            <div className={styles.mediaContainer}>
              <button
                className={`${styles.mediaArrow} ${styles.leftArrow}`}
                onClick={() => setShowVideo(!showVideo)}
                aria-label="Previous media"
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              <div className={styles.mediaContent}>
                {showVideo ? (
                  <video
                    src={videoq}
                    className={styles.qualityVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={imgq}
                    alt="Quality"
                    className={styles.qualityImage}
                  />
                )}
              </div>

              <button
                className={`${styles.mediaArrow} ${styles.rightArrow}`}
                onClick={() => setShowVideo(!showVideo)}
                aria-label="Next media"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            <div className={styles.qualityContent}>
              <h2 className={styles.qualityTitle}>Calidad Incomparable</h2>
              <h3 className={styles.qualitySubtitle}>Nuestro Compromiso con la Excelencia</h3>
              <p className={styles.qualityText}>
                Descubre la experiencia única de EndStore. Nuestras prendas cumplen con los más altos
                estándares de calidad, y garantizamos tu satisfacción. Para calidad confiable y estilo
                racing auténtico, elígenos.
              </p>
              <Link to="/catalogo" className={styles.exploreButton}>
                Explorar EndStore
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </section>
        <section className={styles.browseCategorySection}>
          <div className={styles.container}>
            <h2 className={styles.browseTitle}>Comprar por categoría</h2>
            <div className={styles.browseContent}>
              <div className={styles.categoryMenu}>
                <div className={styles.categorieImage}>
                  {categories.length > 0 && activeCategory && (
                    <img
                      src={categories.find(cat =>
                        cat.name.toLowerCase() === activeCategory
                      )?.images[0]}
                      alt="Category Featured"
                    />
                  )}
                </div>
                <div className={styles.categoryLinks}>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`${styles.categoryLink} ${activeCategory === category.name.toLowerCase() ? styles.active : ''
                        }`}
                      onClick={() => setActiveCategory(category.name.toLowerCase())}
                    >
                      {category.name}
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.productsGrid}>
                {loadingProducts ? (
                  <div className={styles.loadingState}>
                    <LoadingSpinner />
                  </div>
                ) : categoryProducts[activeCategory]?.length > 0 ? (
                  categoryProducts[activeCategory].map(product => (
                    <Link
                      to={`/product/${product.id}`}
                      key={product.id}
                      className={styles.productCard}
                    >
                      <div className={styles.productImage}>
                        <img src={product.images[0]} alt={product.name} />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    No se encontraron productos en esta categoría
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        <section className={styles.featuresSection}>
          <div className={styles.container}>
            <div className={styles.featuresGrid}>
              <div className={styles.featureColumn}>
                <div className={styles.featureIcon}>
                  <i className="fas fa-truck"></i>
                </div>
                <h3 className={styles.featureTitle}>Envíos Gratis</h3>
                <p className={styles.featureText}>
                  Disfruta de envío gratuito en todas tus compras mayores a S/99.
                </p>
              </div>

              <div className={styles.featureColumn}>
                <div className={styles.featureIcon}>
                  <i className="fas fa-globe-americas"></i>
                </div>
                <h3 className={styles.featureTitle}>Envíos a todo Perú</h3>
                <p className={styles.featureText}>
                  Llevamos nuestros productos a cada rincón del país, Lima y provincias.
                </p>
              </div>

              <div className={styles.featureColumn}>
                <div className={styles.featureIcon}>
                  <i className="fas fa-shield-alt"></i>
                </div>
                <h3 className={styles.featureTitle}>Satisfacción Garantizada</h3>
                <p className={styles.featureText}>
                  Tu satisfacción es nuestra prioridad - calidad garantizada en cada prenda.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.testimonialSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Lo que dicen nuestros clientes</h2>
            <TestimonialSlider />
          </div>
        </section>
        <section className={styles.supportSection}>
          <div className={styles.container}>
            <div className={styles.supportContent}>
              <div className={styles.supportText}>
                <h2 className={styles.supportTitle}>¡Estamos aquí para ayudarte!</h2>
                <h3 className={styles.supportSubtitle}>Contáctanos</h3>
                <p className={styles.supportDescription}>
                  ¿Tienes preguntas, dudas o simplemente quieres saludar?
                  Nos encantaría escucharte. Comunícate con nuestro equipo de soporte
                  utilizando las siguientes opciones.
                </p>
              </div>
              <div className={styles.supportButtons}>
                <a
                  href="https://wa.me/51981410745?text=Hola,%20necesito%20soporte%20con%20mi%20pedido"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.supportButton}
                >
                  <i className="fab fa-whatsapp"></i>
                  Contactar Soporte
                </a>
              </div>
            </div>
          </div>
        </section>
      </div >
    </>
  );
};

export default Home;