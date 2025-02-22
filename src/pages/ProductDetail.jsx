import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { collection, query, where, limit } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/ProductDetail.module.css';
import LoadingSpinner from '../components/LoadingSpinner';
import AnnouncementBar from '../components/AnnouncementBar';
import ImageMagnifier from '../components/ImageMagnifier';
import { useCart } from '../context/CartContext';



const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState(0);
    const [showSizes, setShowSizes] = useState(false);
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState([]);

    const { addToCart } = useCart();

    const handleAddToCart = () => {
        if (!selectedSize) {
            setShowSizes(true);
            return;
        }

        addToCart(product, quantity, selectedSize);

        // Clear selection after adding to cart
        setSelectedSize('');
        setQuantity(1);
        setShowSizes(false);
    };

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            if (!product) return;

            try {
                // First try to get products from the same category
                let q = query(
                    collection(db, 'Productos'),
                    where('category', '==', product.category),
                    where('id', '!=', product.id),
                    limit(4)
                );

                let querySnapshot = await getDocs(q);
                let products = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // If we don't have enough products from the same category, get others
                if (products.length < 4) {
                    q = query(
                        collection(db, 'Productos'),
                        where('id', '!=', product.id),
                        limit(4 - products.length)
                    );
                    querySnapshot = await getDocs(q);
                    const otherProducts = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    products = [...products, ...otherProducts];
                }

                setRelatedProducts(products);
            } catch (error) {
                console.error('Error fetching related products:', error);
            }
        };

        fetchRelatedProducts();
    }, [product]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, 'Productos', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) return <LoadingSpinner />;
    if (!product) return <div>Producto no encontrado</div>;

    // Define isOutOfStock here, after we know product exists
    const isOutOfStock = product.stock === 0;
    const discountedPrice = product.discount ? product.price * (1 - product.discount / 100) : product.price;

    return (
        <>
            <AnnouncementBar />
            <div className={styles.searchContainer}>
                {/* Existing search bar component */}
            </div>

            <div className={styles.productDetail}>
                <div className={styles.breadcrumb}>
                    <Link to="/">Inicio</Link>
                    <span>/</span>
                    <span>{product.name}</span>
                </div>

                <div className={styles.productContent}>
                    <div className={`${styles.imageSection} ${isOutOfStock ? styles.outOfStock : ''}`}>
                        <div className={styles.mainImage}>
                            <ImageMagnifier
                                src={product.images[mainImage]}
                                alt={product.name}
                            />
                            {isOutOfStock && (
                                <div className={styles.outOfStockOverlay}>
                                    Sin Stock
                                </div>
                            )}
                        </div>
                        <div className={styles.thumbnails}>
                            {product.images.map((image, index) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt={`${product.name} ${index + 1}`}
                                    className={mainImage === index ? styles.active : ''}
                                    onClick={() => setMainImage(index)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.productInfo}>
                        <span className={styles.category}>{product.category}</span>
                        <h1>{product.name}</h1>
                        <p className={styles.description}>{product.description}</p>
                        <div className={`${styles.stock} ${isOutOfStock ? styles.outOfStock : ''}`}>
                            {isOutOfStock ? (
                                'Sin stock disponible:('
                            ) : (
                                <>¡Excelente! {product.stock} artículo(s) en stock</>
                            )}
                        </div>
                        <div className={styles.priceSection}>
                            {product.discount > 0 ? (
                                <>
                                    <div className={styles.discountBadge}>
                                        -{product.discount}% OFF
                                    </div>
                                    <div className={styles.prices}>
                                        <span className={styles.originalPrice}>
                                            S/. {product.price.toFixed(2)}
                                        </span>
                                        <span className={styles.finalPrice}>
                                            S/. {discountedPrice.toFixed(2)}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.price}>
                                    S/. {product.price.toFixed(2)}
                                </div>
                            )}
                        </div>

                        <div className={styles.sizesSection}>
                            <h3 className={styles.sizesTitle}>
                                Selecciona tu talla
                                <button
                                    className={styles.sizesToggle}
                                    onClick={() => setShowSizes(!showSizes)}
                                >
                                    <i className={`fas fa-chevron-${showSizes ? 'up' : 'down'}`}></i>
                                </button>
                            </h3>

                            <div className={`${styles.sizesGrid} ${showSizes ? styles.show : ''}`}>
                                {Object.entries(product.sizes).map(([size, stock]) => (
                                    <button
                                        key={size}
                                        className={`${styles.sizeButton} ${selectedSize === size ? styles.selected : ''
                                            } ${stock === 0 ? styles.disabled : ''}`}
                                        onClick={() => setSelectedSize(size)}
                                        disabled={stock === 0}
                                    >
                                        <span className={styles.sizeLabel}>{size}</span>
                                        <span className={styles.stockLabel}>
                                            {stock === 0 ? 'Agotado' : `${stock} disponibles`}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.addToCart}>
                            {isOutOfStock ? (
                                <div className={styles.outOfStockMessage}>
                                    Producto temporalmente sin stock
                                </div>
                            ) : (
                                <>
                                    <div className={styles.quantitySelector}>
                                        <button
                                            onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                                            disabled={!selectedSize}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value)))}
                                            min="1"
                                            disabled={!selectedSize}
                                        />
                                        <button
                                            onClick={() => setQuantity(q => q + 1)}
                                            disabled={!selectedSize}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        className={`${styles.addToCartButton} ${!selectedSize ? styles.disabled : ''}`}
                                        onClick={handleAddToCart}
                                        disabled={!selectedSize}
                                    >
                                        {selectedSize ? 'Añadir al Carrito' : 'Seleccionar Talla'}
                                    </button>
                                </>
                            )}
                        </div>

                        <div className={styles.shippingInfo}>
                            <div className={styles.infoItem}>
                                <i className="fas fa-truck"></i>
                                <div>
                                    <h4>Envío Gratis</h4>
                                    <p>Envío gratis a compras mayores a S/.99</p>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <i className="fas fa-exclamation-circle"></i>
                                <div>
                                    <h4>Aviso</h4>
                                    <p>Debido a las fuertes demandas los pedidos pueden tardar entre 2 a 5 dias en ser entregados.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.relatedProducts}>
                    <h2>Productos Relacionados</h2>
                    {relatedProducts.length > 0 ? (
                        <div className={styles.relatedGrid}>
                            {relatedProducts.map(relatedProduct => {
                                const relatedDiscountedPrice = relatedProduct.discount ?
                                    relatedProduct.price * (1 - relatedProduct.discount / 100) :
                                    relatedProduct.price;

                                return (
                                    <Link
                                        to={`/product/${relatedProduct.id}`}
                                        key={relatedProduct.id}
                                        className={styles.relatedCard}
                                    >
                                        <div className={styles.relatedImage}>
                                            <img
                                                src={relatedProduct.images[0]}
                                                alt={relatedProduct.name}
                                            />
                                            {relatedProduct.discount > 0 && (
                                                <span className={styles.relatedDiscountBadge}>
                                                    -{relatedProduct.discount}%
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.relatedInfo}>
                                            <h3>{relatedProduct.name}</h3>
                                            <div className={styles.relatedPriceContainer}>
                                                {relatedProduct.discount > 0 ? (
                                                    <>
                                                        <span className={styles.relatedOriginalPrice}>
                                                            S/. {relatedProduct.price.toFixed(2)}
                                                        </span>
                                                        <span className={styles.relatedFinalPrice}>
                                                            S/. {relatedDiscountedPrice.toFixed(2)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className={styles.relatedPrice}>
                                                        S/. {relatedProduct.price.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <p className={styles.noProducts}>No se han encontrado más productos</p>
                    )}
                </div>
            </div>

        </>
    );
};

export default ProductDetail;