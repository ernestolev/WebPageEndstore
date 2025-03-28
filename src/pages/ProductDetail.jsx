import React, { useState, useEffect, useRef } from 'react'; // Añadir useRef
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
import { ref, getDownloadURL } from 'firebase/storage'; // Añadir importaciones de Storage
import { db, storage } from '../Firebase'; // Añadir storage
import styles from '../styles/ProductDetail.module.css';
import LoadingSpinner from '../components/LoadingSpinner';
import AnnouncementBar from '../components/AnnouncementBar';
import ImageMagnifier from '../components/ImageMagnifier';
import { useCart } from '../context/CartContext';
import Comentarios from '../components/Comentarios';
import { useAuth } from '../context/AuthContext';
import LogReg from '../components/LogReg';
import GuiaTallas from '../components/GuiaTallas';
import { toast } from 'react-toastify';
import { onSnapshot } from 'firebase/firestore';


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
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [selectedFitType, setSelectedFitType] = useState('');
    const [showFitTypes, setShowFitTypes] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);
    const [productImages, setProductImages] = useState([]); // Nuevo estado para las imágenes cargadas desde Storage
    const [relatedProductImagesMap, setRelatedProductImagesMap] = useState({}); // Mapa para las imágenes de productos relacionados
    const { addToCart, setIsCartOpen } = useCart();


    // Función para cargar imágenes desde Storage o usar URLs de Firestore
    const loadImagesFromStorage = async (imageRefs) => {
        try {
            // Si no hay referencias o son URLs completas, devolverlas directamente
            if (!imageRefs || imageRefs.length === 0) {
                return [];
            }

            // Si la primera imagen ya es una URL completa, asumimos que todas lo son
            if (typeof imageRefs[0] === 'string' && imageRefs[0].startsWith('http')) {
                return imageRefs;
            }

            // Si son referencias a Storage, cargarlas
            const loadedImages = await Promise.all(
                imageRefs.map(async (imagePath, index) => {
                    try {
                        // Si es una URL completa, devolverla directamente
                        if (typeof imagePath === 'string' && imagePath.startsWith('http')) {
                            return imagePath;
                        }

                        // Si es base64, devolverlo directamente
                        if (typeof imagePath === 'string' && imagePath.startsWith('data:')) {
                            return imagePath;
                        }

                        // Construir la referencia a Storage
                        const storageRef = ref(storage, imagePath);

                        // Obtener la URL
                        const url = await getDownloadURL(storageRef);
                        return url;
                    } catch (error) {
                        console.error(`Error cargando imagen ${index}:`, error);
                        // Fallback: si falla, usar la referencia original
                        return imagePath;
                    }
                })
            );

            return loadedImages;
        } catch (error) {
            console.error('Error cargando imágenes desde Storage:', error);
            return imageRefs; // Fallback: devolver las referencias originales
        }
    };

    const [selectedSizeError, setSelectedSizeError] = useState(false);
    const sizesRef = useRef(null);

    // Añadir esta función para abrir el carrito
    const toggleMiniCart = () => setIsCartOpen(true);


    const handleAddToCart = () => {
        if (!selectedSize && product.hasSizes) {
            setSelectedSizeError(true);
            // Scroll to size selection
            if (sizesRef.current) {
                sizesRef.current.scrollIntoView({ behavior: 'smooth' });
            }
            return;
        }

        // Verificar stock antes de añadir al carrito
        if (product.hasSizes && selectedSize) {
            const sizeStock = product.sizes?.[selectedSize] || 0;
            if (sizeStock < quantity) {
                toast.error(`Solo hay ${sizeStock} unidades disponibles en talla ${selectedSize}`);
                return;
            }
        } else if (!product.hasSizes && product.stock < quantity) {
            toast.error(`Solo hay ${product.stock} unidades disponibles`);
            return;
        }

        // Determinar el fit type final
        const finalFitType = selectedFitType || product.fitType || 'Regular';

        console.log("Añadiendo al carrito con:", {
            talla: selectedSize,
            fit: finalFitType,
            cantidad: quantity
        });

        // Crear el ítem del carrito con todos los datos correctos
        const item = {
            id: product.id,
            name: product.name,
            price: product.discount ? product.price * (1 - product.discount / 100) : product.price,
            image: productImages[0] || product.images[0],
            quantity: quantity,
            size: selectedSize, // Asegurar que la talla se pase correctamente
            hasSizes: product.hasSizes || false,
            fitType: finalFitType, // Asegurar que el fit se pase correctamente
            stock: product.hasSizes ? (product.sizes?.[selectedSize] || 0) : product.stock,
        };

        // Añadir al carrito con todos los datos
        addToCart(item);

        // Mostrar toast de éxito con los detalles correctos
        const sizeInfo = selectedSize ? ` talla ${selectedSize}` : '';
        const fitInfo = finalFitType && finalFitType !== 'Regular' ? ` (${finalFitType})` : '';

        toast.success(`¡${quantity} ${quantity > 1 ? 'unidades' : 'unidad'} añadidas al carrito${sizeInfo}${fitInfo}!`, {
            position: "bottom-right",
            autoClose: 3000
        });

        // Abrir el mini carrito
        setIsCartOpen(true);
    };



    // Funciones auxiliares
    const isItemOutOfStock = (item) => {
        return item.stock <= 0;
    };

    const getStockText = (item) => {
        if (item.stock <= 0) {
            return "Producto agotado";
        }
        if (item.stock < item.quantity) {
            return `Solo hay ${item.stock} unidades disponibles`;
        }
        if (item.stock <= 5) {
            return `¡Quedan solo ${item.stock} unidades!`;
        }
        return null;
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

    useEffect(() => {
        // Suscribirse a cambios en tiempo real en el producto seleccionado
        if (id) {
            const productRef = doc(db, 'Productos', id);
            const unsubscribe = onSnapshot(productRef, (docSnap) => {
                if (docSnap.exists()) {
                    const productData = docSnap.data();

                    // Actualizar datos del producto, manteniendo las imágenes ya cargadas
                    setProduct(prev => ({
                        id: docSnap.id,
                        ...productData,
                        likes: productData.likes || 0
                    }));

                    setLikeCount(productData.likes || 0);

                    // Verificar si la talla seleccionada todavía tiene stock
                    if (selectedSize && productData.hasSizes) {
                        const sizeStock = productData.sizes?.[selectedSize] || 0;
                        if (sizeStock <= 0) {
                            // La talla seleccionada ya no tiene stock, mostrar alerta
                            toast.warning(`La talla ${selectedSize} se ha agotado mientras estabas en esta página`);
                            setSelectedSize(''); // Desseleccionar la talla
                        } else if (sizeStock < quantity) {
                            // Si había seleccionado más unidades que el stock disponible
                            toast.warning(`Solo quedan ${sizeStock} unidades en talla ${selectedSize}`);
                            setQuantity(sizeStock); // Ajustar la cantidad al máximo disponible
                        }
                    }
                }
            }, (error) => {
                console.error("Error en tiempo real:", error);
            });

            // Limpiar suscripción cuando el componente se desmonte
            return () => unsubscribe();
        }
    }, [id, selectedSize, quantity]);

    const handleLike = async () => {
        if (!user) {
            setShowLoginModal(true);
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
                setLikeCount(prev => Math.max(0, prev - 1));
            } else {
                // Usar la imagen ya cargada de Storage
                await setDoc(favoriteRef, {
                    userId: user.uid,
                    productId: id,
                    createdAt: new Date(),
                    productData: {
                        name: product.name,
                        price: product.price,
                        image: productImages[0] || product.images[0] // Usar imagen cargada o fallback
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

    // Cargar imágenes para productos relacionados
    useEffect(() => {
        const loadRelatedProductImages = async () => {
            const imagesMap = {};

            await Promise.all(
                relatedProducts.map(async (product) => {
                    try {
                        // Cargar solo la primera imagen de cada producto relacionado
                        const images = await loadImagesFromStorage([product.images[0]]);
                        imagesMap[product.id] = images[0];
                    } catch (error) {
                        console.error(`Error loading image for related product ${product.id}:`, error);
                        imagesMap[product.id] = product.images[0]; // Fallback
                    }
                })
            );

            setRelatedProductImagesMap(imagesMap);
        };

        if (relatedProducts.length > 0) {
            loadRelatedProductImages();
        }
    }, [relatedProducts]);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            if (!product) return;

            try {
                // First, try to get products from the same category
                const categoryQuery = query(
                    collection(db, 'Productos'),
                    where('category', '==', product.category),
                    where('__name__', '!=', id),
                    firestoreLimit(4)
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
                        where('__name__', '!=', id),
                        firestoreLimit(4 - relatedProducts.length)
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

                    // Guardar producto en estado
                    setProduct({
                        id: docSnap.id,
                        ...productData,
                        likes: productData.likes || 0
                    });

                    setLikeCount(productData.likes || 0);
                    setMainImage(0);

                    // Cargar imágenes desde Storage
                    try {
                        const loadedImages = await loadImagesFromStorage(productData.images);
                        setProductImages(loadedImages);
                    } catch (imageError) {
                        console.error('Error cargando imágenes:', imageError);
                        setProductImages(productData.images); // Usar las referencias originales como fallback
                    }

                    // Initialize fit type if product has one
                    if (productData.fitType && productData.fitType !== 'Ambos') {
                        setSelectedFitType(productData.fitType);
                    } else if (productData.fitType === 'Ambos') {
                        setSelectedFitType('Normal');
                        setShowFitTypes(true);
                    }
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
                                src={productImages[mainImage] || '/assets/placeholder.jpg'}
                                alt={product.name}
                            />
                            {isOutOfStock && (
                                <div className={styles.outOfStockOverlay}>
                                    Sin Stock
                                </div>
                            )}
                        </div>
                        <div className={styles.thumbnails}>
                            {productImages.map((image, index) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt={`${product.name} ${index + 1}`}
                                    className={mainImage === index ? styles.active : ''}
                                    onClick={() => {
                                        // Primero reseteamos la imagen para forzar el cambio completo
                                        setMainImage(null);
                                        // Después de un pequeño delay establecemos la nueva imagen
                                        setTimeout(() => {
                                            setMainImage(index);
                                        }, 50);
                                    }}
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

                        <GuiaTallas
                            isOpen={showSizeGuide}
                            onClose={() => setShowSizeGuide(false)}
                        />

                        {product.hasSizes && (
                            <div className={styles.sizesSection} ref={sizesRef}>
                                <div className={styles.sizesSectionHeader}>
                                    <h3 className={styles.sizesTitle}>
                                        Selecciona tu talla
                                        <button
                                            className={styles.sizesToggle}
                                            onClick={() => setShowSizes(!showSizes)}
                                        >
                                            <i className={`fas fa-chevron-${showSizes ? 'up' : 'down'}`}></i>
                                        </button>
                                    </h3>
                                </div>

                                <div className={`${styles.sizesGrid} ${showSizes ? styles.show : ''}`}>
                                    {Object.entries(product.sizes).map(([size, stock]) => (
                                        <button
                                            key={size}
                                            className={`${styles.sizeButton} 
                        ${selectedSize === size ? styles.selected : ''} 
                        ${stock === 0 ? styles.disabled : ''}
                        ${selectedSizeError && !selectedSize ? styles.error : ''}`}
                                            onClick={() => {
                                                setSelectedSize(size);
                                                setSelectedSizeError(false);
                                            }}
                                            disabled={stock === 0}
                                        >
                                            <span className={styles.sizeLabel}>{size}</span>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className={styles.sizeGuideButton}
                                    onClick={() => setShowSizeGuide(true)}
                                >
                                    <i className="fas fa-ruler"></i> Ver guía de tallas
                                </button>
                            </div>
                        )}
                        {product.category === 'Polo' && (
                            <div className={styles.fitTypeSection}>
                                <h3 className={styles.fitTypeTitle}>
                                    {product.fitType === 'Ambos' ? 'Selecciona el fit' : 'Tipo de Fit'}
                                    {product.fitType === 'Ambos' && (
                                        <button
                                            className={styles.sizesToggle}
                                            onClick={() => setShowFitTypes(!showFitTypes)}
                                        >
                                            <i className={`fas fa-chevron-${showFitTypes ? 'up' : 'down'}`}></i>
                                        </button>
                                    )}
                                </h3>

                                {product.fitType === 'Ambos' ? (
                                    <div className={`${styles.fitTypeGrid} ${showFitTypes ? styles.show : ''}`}>
                                        {['Normal', 'Oversize'].map((fit) => (
                                            <button
                                                key={fit}
                                                className={`${styles.fitTypeButton} ${selectedFitType === fit ? styles.selected : ''}`}
                                                onClick={() => setSelectedFitType(fit)}
                                            >
                                                {fit}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.fitTypeBadge}>
                                        {product.fitType}
                                    </div>
                                )}
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
                                            onChange={(e) => {
                                                // Convertir a número y asegurar que sea al menos 1
                                                const newValue = parseInt(e.target.value) || 1;
                                                setQuantity(Math.max(1, newValue));
                                            }}
                                            min="1"
                                            disabled={product.hasSizes && !selectedSize}
                                            // Asegurarnos de que el input tenga un ancho adecuado y se muestre el valor
                                            style={{ width: '40px', textAlign: 'center' }}
                                        />
                                        <button
                                            onClick={() => {
                                                // Verificar que no exceda el stock disponible
                                                const maxStock = product.hasSizes && selectedSize
                                                    ? (product.sizes?.[selectedSize] || 0)
                                                    : product.stock;
                                                const newQuantity = quantity + 1;

                                                if (newQuantity <= maxStock) {
                                                    setQuantity(newQuantity);
                                                } else {
                                                    toast.warning(`No puedes añadir más de ${maxStock} unidades`);
                                                }
                                            }}
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
                                    <p>Debido a las fuertes demandas los pedidos pueden tardar entre 1 a 5 dias en ser entregados. Podrás revisar el estado de tu pedido en nuestro Tracking. </p>
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

                                // Usar imagen cargada desde Storage o caer en la original
                                const relatedProductImage = relatedProductImagesMap[relatedProduct.id] || relatedProduct.images[0];

                                return (
                                    <Link
                                        to={`/product/${relatedProduct.id}`}
                                        key={relatedProduct.id}
                                        className={styles.relatedCard}
                                    >
                                        <div className={styles.relatedImage}>
                                            <img
                                                src={relatedProductImage}
                                                alt={relatedProduct.name}
                                                loading="lazy" // Añadir carga diferida para mejorar rendimiento
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