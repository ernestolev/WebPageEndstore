import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    setDoc,
    deleteDoc,
    updateDoc,
    increment,
    limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/ProductDetail.module.css';
import LoadingSpinner from '../components/LoadingSpinner';
import AnnouncementBar from '../components/AnnouncementBar';
import ImageMagnifier from '../components/ImageMagnifier';
import { useCart } from '../context/CartContext';
import Comentarios from '../components/Comentarios';
import { useAuth } from '../context/AuthContext';
import LogReg from '../components/LogReg';


const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState(0);
    const [showSizes, setShowSizes] = useState(false);
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false); // Add this state

    const { addToCart } = useCart();

    const handleAddToCart = () => {
        if (product.hasSizes && !selectedSize) {
            setShowSizes(true);
            return;
        }

        addToCart(product, quantity, product.hasSizes ? selectedSize : null);

        // Clear selection after adding to cart
        if (product.hasSizes) {
            setSelectedSize('');
        }
        setQuantity(1);
        setShowSizes(false);
    };

    useEffect(() => {
        // Check if there's a hash in the URL
        if (window.location.hash === '#comentarios') {
            // Wait for the component to render
            setTimeout(() => {
                const comentariosSection = document.getElementById('comentarios');
                if (comentariosSection) {
                    comentariosSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 500);
        }
    }, []);

    useEffect(() => {
        const checkIfLiked = async () => {
            if (user && id) {
                try {
                    const favoriteRef = doc(db, 'favorites', `${user.uid}_${id}`);
                    const docSnap = await getDoc(favoriteRef);
                    setIsLiked(docSnap.exists());
                } catch (error) {
                    console.error('Error checking like status:', error);
                }
            }
        };

        checkIfLiked();
    }, [user, id]);

    const handleLike = async () => {
        if (!user) {
            setShowLoginModal(true); // Show login modal if user is not authenticated
            return;
        }

        

        const favoriteRef = doc(db, 'favorites', `${user.uid}_${id}`);
        const productRef = doc(db, 'Productos', id);

        try {
            if (isLiked) {
                await deleteDoc(favoriteRef);
                await updateDoc(productRef, {
                    likes: increment(-1)
                });
                setLikeCount(prev => Math.max(0, prev - 1)); // <-- Prevent negative values
            } else {
                await setDoc(favoriteRef, {
                    userId: user.uid,
                    productId: id,
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
            }
            setIsLiked(!isLiked);
        } catch (error) {
            console.error('Error updating favorite:', error);
        }
    };

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            if (!product) return;

            try {
                // First, try to get products from the same category
                const categoryQuery = query(
                    collection(db, 'Productos'),
                    where('category', '==', product.category),
                    where('__name__', '!=', id), // Exclude current product
                    firestoreLimit(4) // Use firestoreLimit instead of limit
                );

                let querySnapshot = await getDocs(categoryQuery);
                let relatedProducts = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // If we don't have enough products from the same category
                if (relatedProducts.length < 4) {
                    // Get random products from other categories
                    const otherProductsQuery = query(
                        collection(db, 'Productos'),
                        where('__name__', '!=', id), // Exclude current product
                        firestoreLimit(4 - relatedProducts.length) // Use firestoreLimit
                    );

                    const otherSnapshot = await getDocs(otherProductsQuery);
                    const otherProducts = otherSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    relatedProducts = [...relatedProducts, ...otherProducts];
                }

                // Shuffle the array to randomize the order
                const shuffled = relatedProducts.sort(() => Math.random() - 0.5);

                setRelatedProducts(shuffled.slice(0, 4));
            } catch (error) {
                console.error('Error fetching related products:', error);
                setRelatedProducts([]);
            }
        };

        if (product) {
            fetchRelatedProducts();
        }
    }, [product, id]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const docRef = doc(db, 'Productos', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const productData = docSnap.data();
                    setProduct({
                        id: docSnap.id,
                        ...productData,
                        likes: productData.likes || 0  // <-- Make sure likes has a default value
                    });
                    setLikeCount(productData.likes || 0);  // <-- Set like count here
                    setMainImage(0); // Use setMainImage instead of setCurrentImageIndex
                } else {
                    console.error('Producto no encontrado');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
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
                    <Link to="/catalogo">Catalogo</Link>
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
                        <div className={styles.productHeader}>
                            <h1>{product.name}</h1>
                            <button
                                className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`}
                                onClick={handleLike}
                            >
                                <i className="fas fa-heart"></i>
                                <span className={styles.likeCount}>
                                    {likeCount > 0 ? likeCount : 0} {likeCount === 1 ? 'Me gusta' : 'Me gusta'}
                                </span>
                            </button>
                        </div>
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

                        {product.hasSizes && (
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
                        )}


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
                                            disabled={product.hasSizes && !selectedSize}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value)))}
                                            min="1"
                                            disabled={product.hasSizes && !selectedSize}
                                        />
                                        <button
                                            onClick={() => setQuantity(q => q + 1)}
                                            disabled={product.hasSizes && !selectedSize}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        className={`${styles.addToCartButton} ${product.hasSizes && !selectedSize ? styles.disabled : ''
                                            }`}
                                        onClick={handleAddToCart}
                                        disabled={product.hasSizes && !selectedSize}
                                    >
                                        {product.hasSizes && !selectedSize ? 'Seleccionar Talla' : 'Añadir al Carrito'}
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
                <div id="comentarios" className={styles.reviewsSection}>
                    <Comentarios productId={id} />
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
            {showLoginModal && (
                <LogReg
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                />
            )}
        </>
    );
};

export default ProductDetail;