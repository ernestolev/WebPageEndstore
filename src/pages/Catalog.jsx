import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/Catalog.module.css';
import ProductCard from '../components/ProductCard';
import AnnouncementBar from '../components/AnnouncementBar';
import LoadingSpinner from '../components/LoadingSpinner';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: [],
    priceRange: { min: 0, max: 1000 },
    sizes: [],
    searchQuery: ''
  });
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const productsPerPage = 15;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsSnapshot = await getDocs(collection(db, 'Productos'));
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(productsData);

        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, 'Categorias'));
        const categoriesData = categoriesSnapshot.docs.map(doc => doc.data().name);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
    setCurrentPage(1);
  };


  const filteredProducts = products.filter(product => {
    // Category filter
    if (filters.category.length > 0 && !filters.category.includes(product.category)) {
      return false;
    }

    // Price range filter
    if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
      return false;
    }

    // Size filter - Updated logic
    if (filters.sizes.length > 0) {
      // Skip products that don't manage sizes
      if (!product.sizes || product.hasSizes === false) {
        return false;
      }

      // Check if the product has stock in ANY of the selected sizes
      return filters.sizes.some(selectedSize => {
        const sizeStock = product.sizes[selectedSize];
        return typeof sizeStock === 'number' && sizeStock > 0;
      });
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);
    }

    return true;
  });


  const getAvailableSizesCount = (size) => {
    return products.reduce((count, product) => {
      // Check if product has sizes and the specific size exists with stock
      if (
        product.hasSizes !== false && // Product manages sizes
        product.sizes && // Sizes object exists
        typeof product.sizes[size] === 'number' && // Size exists and is a number
        product.sizes[size] > 0 // Size has stock
      ) {
        return count + 1;
      }
      return count;
    }, 0);
  };


  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const currentProducts = sortedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  if (loading) return <LoadingSpinner />;

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

  return (
    <>
      <AnnouncementBar />
      <div className={styles.catalog}>
        <div className={styles.searchContainer}>
          <button
            className={styles.mobileFilterButton}
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <i className="fas fa-filter"></i>
            Filtros
          </button>
          <div className={styles.searchWrapper}>
            <input
              type="search"
              placeholder="Buscar productos..."
              className={styles.searchInput}
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            />
            <button className={styles.searchButton}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
        <div className={styles.breadcrumb}>
          <Link to="/">Inicio</Link>
          <span>/</span>
          <span>Catálogo</span>
        </div>

        <div className={styles.catalogContent}>
          {/* Filters Sidebar */}
          <aside className={styles.filters}>
            <h3>Filtros</h3>

            {/* Category Filter */}
            <div className={styles.filterSection}>
              <h4>Categorías</h4>
              {categories.map(category => (
                <label key={category} className={styles.filterCheckbox}>
                  <input
                    type="checkbox"
                    checked={filters.category.includes(category)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...filters.category, category]
                        : filters.category.filter(c => c !== category);
                      handleFilterChange('category', newCategories);
                    }}
                  />
                  {category}
                </label>
              ))}
            </div>

            {/* Price Range Filter */}
            <div className={styles.filterSection}>
              <h4>Rango de Precio</h4>
              <div className={styles.priceInputs}>
                <input
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    min: Number(e.target.value)
                  })}
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    max: Number(e.target.value)
                  })}
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Size Filter */}
            <div className={styles.filterSection}>
              <h4>Tallas</h4>
              {['S', 'M', 'L', 'XL', 'XXL'].map(size => {
                const count = getAvailableSizesCount(size);
                return (
                  <label key={size} className={`${styles.filterCheckbox} ${count === 0 ? styles.disabled : ''}`}>
                    <input
                      type="checkbox"
                      checked={filters.sizes.includes(size)}
                      onChange={(e) => {
                        const newSizes = e.target.checked
                          ? [...filters.sizes, size]
                          : filters.sizes.filter(s => s !== size);
                        handleFilterChange('sizes', newSizes);
                      }}
                      disabled={count === 0}
                    />
                    <span className={styles.sizeLabel}>
                      {size}
                      <span className={styles.sizeCount}>
                        ({count})
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Clear Filters Button */}
            <button
              className={styles.clearFiltersButton}
              onClick={() => setFilters({
                category: [],
                priceRange: { min: 0, max: 1000 },
                sizes: [],
                searchQuery: ''
              })}
            >
              Limpiar Filtros
            </button>
          </aside>

          {/* Products Section */}
          <main className={styles.productsSection}>
            <div
              className={`${styles.filterOverlay} ${isMobileFiltersOpen ? styles.active : ''}`}
              onClick={() => setIsMobileFiltersOpen(false)}
            />
            <div className={`${styles.mobileFilters} ${isMobileFiltersOpen ? styles.active : ''}`}>
              <div className={styles.mobileFiltersHeader}>
                <h3>Filtros</h3>
                <button
                  className={styles.closeFiltersButton}
                  onClick={() => setIsMobileFiltersOpen(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.filterSection}>
                <h4>Categorías</h4>
                {categories.map(category => (
                  <label key={category} className={styles.filterCheckbox}>
                    <input
                      type="checkbox"
                      checked={filters.category.includes(category)}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...filters.category, category]
                          : filters.category.filter(c => c !== category);
                        handleFilterChange('category', newCategories);
                      }}
                    />
                    {category}
                  </label>
                ))}
              </div>
              <div className={styles.filterSection}>
                <h4>Rango de Precio</h4>
                <div className={styles.priceInputs}>
                  <input
                    type="number"
                    value={filters.priceRange.min}
                    onChange={(e) => handleFilterChange('priceRange', {
                      ...filters.priceRange,
                      min: Number(e.target.value)
                    })}
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={filters.priceRange.max}
                    onChange={(e) => handleFilterChange('priceRange', {
                      ...filters.priceRange,
                      max: Number(e.target.value)
                    })}
                    placeholder="Max"
                  />
                </div>

              </div>

              <div className={styles.filterSection}>
                <h4>Tallas</h4>
                {['S', 'M', 'L', 'XL', 'XXL'].map(size => {
                  const count = getAvailableSizesCount(size);
                  return (
                    <label key={size} className={`${styles.filterCheckbox} ${count === 0 ? styles.disabled : ''}`}>
                      <input
                        type="checkbox"
                        checked={filters.sizes.includes(size)}
                        onChange={(e) => {
                          const newSizes = e.target.checked
                            ? [...filters.sizes, size]
                            : filters.sizes.filter(s => s !== size);
                          handleFilterChange('sizes', newSizes);
                        }}
                        disabled={count === 0}
                      />
                      <span className={styles.sizeLabel}>
                        {size}
                        <span className={styles.sizeCount}>
                          ({count})
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className={styles.productsHeader}>
              <div className={styles.productCount}>
                Total: {products.length} productos
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="featured">Destacados</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
                <option value="newest">Más Nuevos</option>
              </select>
            </div>

            <div className={styles.productsGrid}>
              {currentProducts.length > 0 ? (
                currentProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className={styles.noProducts}>
                  No se encontraron productos con los filtros seleccionados
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={styles.pageButton}
              >
                <i className="fas fa-chevron-left"></i>
              </button>

              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`${styles.pageButton} ${currentPage === index + 1 ? styles.active : ''
                    }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Catalog;