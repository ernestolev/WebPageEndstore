import React from 'react';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import styles from '../styles/Home.module.css';
import modelimg from '../assets/imgs/img-1.png';
import imgejemplo1 from '../assets/imgs/img-ejemplo1.png';

const Home = () => {
  const featuredProducts = [
    {
      id: 1,
      title: 'Racing Hoodie Black',
      price: 89.99,
      image: imgejemplo1,
      category: 'Hoodies'
    },
    {
      id: 2,
      title: 'F1 Team Cap',
      price: 29.99,
      image: imgejemplo1,
      category: 'Accessories'
    },
    {
      id: 3,
      title: 'Racing Jacket Red',
      price: 149.99,
      image: imgejemplo1,
      category: 'Jackets'
    },
  ];

  return (
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

      <section className={styles.featuredSection}>
        <h2 className={styles.sectionTitle}>Featured Products</h2>
        <div className={styles.productGrid}>
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Home;