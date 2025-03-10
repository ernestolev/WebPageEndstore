import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Firebase';
import { useCart } from '../context/CartContext';
import PayuButton from '../components/PayuButton';
import styles from '../styles/Checkout.module.css';
import AnnouncementBar from '../components/AnnouncementBar';
import { useAuth } from '../context/AuthContext';

const Checkout = () => {
    const {
        cart,
        getCartTotal,
        clearCart,
        getSubtotal,
        getShippingCost,
        SHIPPING_THRESHOLD,
        SHIPPING_COST
    } = useCart();

    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: user?.displayName || '',
        email: user?.email || '',
        phone: '',
        shippingType: 'lima',
        // Lima fields
        district: '',
        address: '',
        locationLink: '',
        // Province fields
        documentType: 'dni',
        documentNumber: '',
        region: '',
        province: '',
        agencyDistrict: '',
        agencyName: '',
        // Payment
        paymentMethod: 'card'
    });

    if (!user) {
        return <Navigate to="/login" state={{ returnUrl: '/checkout' }} />;
    }

    if (cart.length === 0) {
        navigate('/cart');
        return null;
    }

    const validateForm = () => {
        const commonFields = {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone
        };

        const limaFields = {
            district: formData.district,
            address: formData.address
        };

        const provinceFields = {
            documentType: formData.documentType,
            documentNumber: formData.documentNumber,
            region: formData.region,
            province: formData.province,
            agencyDistrict: formData.agencyDistrict
        };

        const fieldsToValidate = {
            ...commonFields,
            ...(formData.shippingType === 'lima' ? limaFields : provinceFields)
        };

        return Object.entries(fieldsToValidate).every(([_, value]) =>
            value && value.trim() !== ''
        );
    };

    const total = getCartTotal();
    const orderId = `ORD-${Date.now()}`;

    const shippingDetails = {
        fullName: formData.fullName,
        email: formData.email || user?.email,
        phone: formData.phone,
        shippingType: formData.shippingType,
        ...(formData.shippingType === 'lima' ? {
            district: formData.district,
            address: formData.address,
            locationLink: formData.locationLink
        } : {
            documentType: formData.documentType,
            documentNumber: formData.documentNumber,
            region: formData.region,
            province: formData.province,
            agencyDistrict: formData.agencyDistrict,
            agencyName: formData.agencyName
        })
    };

    const isFormValid = validateForm();

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    const handlePaymentSuccess = async (paymentResult) => {
        setLoading(true);
        try {
            // Include full cart data with fit types in the order
            const orderData = {
                id: orderId,
                userId: user.uid,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    fitType: item.fitType, // Include fit type in the order data
                    image: item.image,
                })),
                total: getCartTotal(),
                subtotal: getSubtotal(),
                shipping: {
                    cost: getShippingCost(),
                    ...shippingDetails
                },
                status: 'paid',
                paymentId: paymentResult.transactionResponse?.transactionId,
                paymentMethod: 'payu',
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(db, 'Orders', orderId), orderData);
            await setDoc(doc(db, 'Carts', user.uid), { items: [] });
            clearCart();
            navigate(`/order-success/${orderId}`);
        } catch (error) {
            console.error('Error guardando orden:', error);
            alert('Error al guardar la orden');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentError = (error) => {
        alert(error.message || 'Error al procesar el pago');
    };


    return (
        <>
            <AnnouncementBar />
            <div className={styles.checkoutPage}>
                <div className={styles.container}>
                    <div className={styles.content}>
                        <div className={styles.shippingSection}>
                            <h2>Información de Envío</h2>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGrid}>
                                    <div className={styles.formGroup}>
                                        <label>Nombre Completo</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                fullName: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                email: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Teléfono</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                phone: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Tipo de Envío</label>
                                        <select
                                            value={formData.shippingType}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                shippingType: e.target.value
                                            })}
                                            className={styles.select}
                                        >
                                            <option value="lima">Envío a Lima</option>
                                            <option value="province">Envío a Provincia</option>
                                        </select>
                                    </div>
                                    {formData.shippingType === 'lima' ? (
                                        <>
                                            <div className={styles.shippingNotice}>
                                                <i className="fas fa-truck"></i>
                                                <div className={styles.noticeContent}>
                                                    <p>Entrega a domicilio en Lima Metropolitana:</p>
                                                    <ul>
                                                        <li>Tiempo estimado de entrega: 2-4 días hábiles</li>
                                                        <li>Seguimiento disponible después de la confirmación del pago</li>
                                                        <li>Recibirás actualizaciones del estado de tu pedido</li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Distrito</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.district}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        district: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Dirección Exacta</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        address: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Link de Ubicación (opcional)</label>
                                                <input
                                                    type="text"
                                                    value={formData.locationLink}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        locationLink: e.target.value
                                                    })}
                                                    placeholder="https://maps.google.com/..."
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className={styles.shippingNotice}>
                                                <i className="fas fa-box"></i>
                                                <div className={styles.noticeContent}>
                                                    <p>Envío a Provincia:</p>
                                                    <ul>
                                                        <li>Envío a través de Olva Courier o Shalom, según disponibilidad</li>
                                                        <li>Tiempo mínimo de entrega: 2 días hábiles (varía según destino)</li>
                                                        <li>Código de seguimiento disponible una vez el pago sea confirmado</li>
                                                        <li>El tracking se actualizará en tu perfil al dejar el pedido en agencia</li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Tipo de Documento</label>
                                                <select
                                                    value={formData.documentType}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        documentType: e.target.value
                                                    })}
                                                    className={styles.select}
                                                >
                                                    <option value="dni">DNI</option>
                                                    <option value="carnet">Carnet de Extranjería</option>
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Número de Documento</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.documentNumber}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        documentNumber: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Región</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.region}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        region: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Provincia</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.province}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        province: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Distrito de Agencia</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.agencyDistrict}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        agencyDistrict: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Nombre de Tienda (opcional)</label>
                                                <input
                                                    type="text"
                                                    value={formData.agencyName}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        agencyName: e.target.value
                                                    })}
                                                    placeholder="Ej: Olva Courier - Av. Principal"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className={styles.paymentMethods}>
                                    <h3>Método de Pago</h3>
                                    <div className={styles.paymentOptions}>
                                        <label className={styles.paymentOption}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={formData.paymentMethod === 'card'}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    paymentMethod: e.target.value
                                                })}
                                            />
                                            <span className={styles.radioButton}></span>
                                            <i className="fas fa-credit-card"></i>
                                            Tarjeta de Crédito/Débito (PayU)
                                        </label>
                                    </div>
                                </div>

                                {formData.paymentMethod === 'card' && (
                                    <PayuButton
                                        amount={total}
                                        orderId={orderId}
                                        shipping={shippingDetails}
                                        onSuccess={handlePaymentSuccess}
                                        onError={handlePaymentError}
                                        cartItems={cart}
                                        disabled={!isFormValid} // Add this prop
                                    />
                                )}
                            </form>
                        </div>

                        <div className={styles.orderSummary}>
                            <h2>Resumen del Pedido</h2>
                            <div className={styles.items}>
                                {cart.map((item) => (
                                    <div key={`${item.id}-${item.size}-${item.fitType}`} className={styles.item}>
                                        <img src={item.image} alt={item.name} />
                                        <div className={styles.itemInfo}>
                                            <h4>{item.name}</h4>
                                            <div className={styles.itemAttributes}>
                                                {item.size && (
                                                    <span className={styles.attribute}>
                                                        <i className="fas fa-ruler"></i>
                                                        Talla: {item.size}
                                                    </span>
                                                )}
                                                {item.fitType && (
                                                    <span className={styles.attribute}>
                                                        <i className="fas fa-tshirt"></i>
                                                        Fit: {item.fitType}
                                                    </span>
                                                )}
                                                <span className={styles.attribute}>
                                                    <i className="fas fa-times"></i>
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <p className={styles.itemPrice}>
                                                S/. {(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.summary}>
                                <div className={styles.summaryRow}>
                                    <span>Subtotal</span>
                                    <span>S/. {getSubtotal().toFixed(2)}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Envío</span>
                                    {getShippingCost() === 0 ? (
                                        <span className={styles.freeShipping}>Gratis</span>
                                    ) : (
                                        <span>S/. {SHIPPING_COST.toFixed(2)}</span>
                                    )}
                                </div>
                                {getShippingCost() > 0 && (
                                    <div className={styles.shippingInfo}>
                                        Te faltan S/. {(SHIPPING_THRESHOLD - getSubtotal()).toFixed(2)} para envío gratis
                                    </div>
                                )}
                                <div className={`${styles.summaryRow} ${styles.total}`}>
                                    <span>Total</span>
                                    <span>S/. {getCartTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Checkout;