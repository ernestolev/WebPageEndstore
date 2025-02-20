import React from 'react';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import AnnouncementBar from '../components/AnnouncementBar';
import SlideBar from '../components/SlideBar';
import styles from '../styles/Home.module.css';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import modelimg from '../assets/imgs/img-1.png';
import imgejemplo1 from '../assets/imgs/img-ejemplo1.png';
import TestimonialSlider from '../components/TestimonialSlider';

const Home = () => {

  const [activeCategory, setActiveCategory] = useState('jackets');

  const categoryProducts = {
    jackets: [
      { id: 1, name: 'Racing Jacket Black', image: imgejemplo1 },
      { id: 2, name: 'F1 Team Jacket', image: imgejemplo1 },
      { id: 3, name: 'Speed Master Jacket', image: imgejemplo1 },
      { id: 4, name: 'Pro Racing Jacket', image: imgejemplo1 },
      { id: 5, name: 'Track Day Jacket', image: imgejemplo1 },
      { id: 6, name: 'Circuit Jacket', image: imgejemplo1 },
    ],
    hoodies: [
      { id: 1, name: 'Racing Hoodie', image: imgejemplo1 },
      { id: 2, name: 'F1 Team Hoodie', image: imgejemplo1 },
      { id: 3, name: 'Speed Hoodie', image: imgejemplo1 },
      // Add more hoodies...
    ],
    polos: [
      { id: 1, name: 'Racing Polo', image: imgejemplo1 },
      { id: 2, name: 'F1 Team Polo', image: imgejemplo1 },
      { id: 3, name: 'Speed Polo', image: imgejemplo1 },
      // Add more polos...
    ]
  };


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

  const categories = [
    {
      id: 1,
      name: 'Jackets',
      image: imgejemplo1,
      link: '/shop/jackets'
    },
    {
      id: 2,
      name: 'Hoodies',
      image: imgejemplo1,
      link: '/shop/hoodies'
    },
    {
      id: 3,
      name: 'Polos',
      image: imgejemplo1,
      link: '/shop/polos'
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
            <button className={styles.shopNow}>Explorar</button>
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
                <Link to={category.link} key={category.id} className={styles.categoryCard}>
                  <div className={styles.categoryImageContainer}>
                    <img src={category.image} alt={category.name} className={styles.categoryImage} />
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
                <img src={imgejemplo1} alt="Racing Collection" />
                <div className={styles.overlay}>
                  <h3>Racing Collection</h3>
                  <Link to="/shop/racing" className={styles.linkButton}>Ver más</Link>
                </div>
              </div>
              <div className={styles.secondaryImages}>
                <div className={styles.topImage}>
                  <img src={imgejemplo1} alt="Summer Collection" />
                  <div className={styles.overlay}>
                    <h3>Summer Collection</h3>
                    <Link to="/shop/summer" className={styles.linkButton}>Ver más</Link>
                  </div>
                </div>
                <div className={styles.bottomImage}>
                  <img src={imgejemplo1} alt="Street Collection" />
                  <div className={styles.overlay}>
                    <h3>Street Collection</h3>
                    <Link to="/shop/street" className={styles.linkButton}>Ver más</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className={styles.flashSaleSection}>
          <div className={styles.container}>
            <div className={styles.saleHeader}>
              <h2 className={styles.saleTitle}>Ofertas Flash</h2>
              <p className={styles.saleSubtitle}>20% en todos estos productos hoy!</p>
            </div>
            <div className={styles.saleGrid}>
              {featuredProducts.map(product => (
                <div key={product.id} className={styles.saleCard}>
                  <div className={styles.cardTop}>
                    <div className={styles.imageContainer}>
                      <img src={product.image} alt={product.title} />
                      {product.inStock ? (
                        <span className={styles.stockBadge}>En stock</span>
                      ) : (
                        <span className={styles.stockBadge}>Agotado</span>
                      )}
                    </div>
                    <div className={styles.colorOptions}>
                      {product.colors.map((color, index) => (
                        <button
                          key={index}
                          className={styles.colorCircle}
                          style={{ backgroundColor: color }}
                          aria-label={`Color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={styles.cardBottom}>
                    <div className={styles.productInfo}>
                      <span className={styles.category}>{product.category}</span>
                      <h3 className={styles.productTitle}>{product.title}</h3>
                      <div className={styles.priceContainer}>
                        <span className={styles.currentPrice}>S/.{product.price}</span>
                        <span className={styles.oldPrice}>S/.{product.oldPrice}</span>
                      </div>
                    </div>
                    <button className={styles.addToCartBtn}>
                      Añadir al carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.qualitySection}>
          <div className={styles.qualityContainer}>
            <div className={styles.mediaContainer}>
              <div className={styles.mediaSlider}>
                <img
                  src={imgejemplo1}
                  className={styles.mediaElement}
                />
                <div className={styles.sliderArrows}>
                  <button className={styles.arrowButton}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button className={styles.arrowButton}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.qualityContent}>
              <h2 className={styles.qualityTitle}>Calidad Incomparable</h2>
              <h3 className={styles.qualitySubtitle}>Nuestro Compromiso con la Excelencia</h3>
              <p className={styles.qualityText}>
                Descubre la experiencia única de EndStore. Nuestras prendas cumplen con los más altos
                estándares de calidad, y garantizamos tu satisfacción. Para calidad confiable y estilo
                racing auténtico, elígenos.
              </p>
              <button className={styles.exploreButton}>
                Explorar EndStore
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </section>
        <section className={styles.browseCategorySection}>
          <div className={styles.container}>
            <h2 className={styles.browseTitle}>Comprar por categoría</h2>
            <div className={styles.browseContent}>
              <div className={styles.categoryMenu}>
                <div className={styles.categoryImage}>
                  <img src={imgejemplo1} alt="Category Featured" />
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
                {categoryProducts[activeCategory].map(product => (
                  <Link to={`/product/${product.id}`} key={product.id} className={styles.productCard}>
                    <div className={styles.productImage}>
                      <img src={product.image} alt={product.name} />
                    </div>
                  </Link>
                ))}
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
                <Link to="/ayuda" className={styles.supportButton}>
                  <i className="fas fa-book"></i>
                  Centro de Ayuda
                </Link>
                <Link to="/contacto" className={styles.supportButton}>
                  <i className="fas fa-headset"></i>
                  Contactar Soporte
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </>
  );
};

export default Home;