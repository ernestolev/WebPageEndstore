import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/Checkout.module.css';
import AnnouncementBar from '../components/AnnouncementBar';

const Checkout = () => {
    const { cart, getCartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        paymentMethod: 'card'
    });

    if (!user) {
        navigate('/login');
        return null;
    }

    if (cart.length === 0) {
        navigate('/cart');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const orderId = `ORD-${Date.now()}`;
            const orderData = {
                id: orderId,
                userId: user.uid,
                items: cart,
                total: getCartTotal(),
                shipping: formData,
                status: 'pending',
                createdAt: serverTimestamp(),
            };

            // Save order to Firestore
            await setDoc(doc(db, 'Orders', orderId), orderData);

            // Clear user's cart
            await setDoc(doc(db, 'Carts', user.uid), { items: [] });
            clearCart();

            // Redirect to success page
            navigate(`/order-success/${orderId}`);
        } catch (error) {
            console.error('Error processing order:', error);
            alert('Error al procesar el pedido. Por favor, intente nuevamente.');
        } finally {
            setLoading(false);
        }
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
                                        <label>Dirección</label>
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
                                        <label>Ciudad</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.city}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                city: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Código Postal</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.zipCode}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                zipCode: e.target.value
                                            })}
                                        />
                                    </div>
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
                                            Tarjeta de Crédito/Débito
                                        </label>
                                        <label className={styles.paymentOption}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="paypal"
                                                checked={formData.paymentMethod === 'paypal'}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    paymentMethod: e.target.value
                                                })}
                                            />
                                            <span className={styles.radioButton}></span>
                                            <i className="fab fa-paypal"></i>
                                            PayPal
                                        </label>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : 'Confirmar Pedido'}
                                </button>
                            </form>
                        </div>

                        <div className={styles.orderSummary}>
                            <h2>Resumen del Pedido</h2>
                            <div className={styles.items}>
                                {cart.map((item) => (
                                    <div key={`${item.productId}-${item.size}`} className={styles.item}>
                                        <img src={item.image} alt={item.name} />
                                        <div className={styles.itemInfo}>
                                            <h4>{item.name}</h4>
                                            <p>Talla: {item.size}</p>
                                            <p>Cantidad: {item.quantity}</p>
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
                                    <span>S/. {getCartTotal().toFixed(2)}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Envío</span>
                                    <span>Gratis</span>
                                </div>
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