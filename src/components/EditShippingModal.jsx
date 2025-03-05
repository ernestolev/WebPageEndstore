import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/EditShippingModal.module.css';

const EditShippingModal = ({ orderId, onClose, currentShipping }) => {
    const [formData, setFormData] = useState(currentShipping);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editsLeft, setEditsLeft] = useState(2);

    const [isDisabled, setIsDisabled] = useState(false);


    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                // Check order tracking status
                const trackingDoc = await getDoc(doc(db, 'tracking', orderId));
                if (trackingDoc.exists()) {
                    const trackingStatus = trackingDoc.data().currentStatus;
                    if (['PACKING', 'COURIER', 'SHIPPING', 'DELIVERED'].includes(trackingStatus)) {
                        setError('No se puede editar la dirección una vez que el pedido está siendo preparado');
                        setIsDisabled(true);
                        return;
                    }
                }

                // Get edit count
                const orderDoc = await getDoc(doc(db, 'Orders', orderId));
                const editCount = orderDoc.data()?.shippingEditCount || 0;
                setEditsLeft(2 - editCount);
                if (editCount >= 2) {
                    setIsDisabled(true);
                    setError('Ya has alcanzado el límite de ediciones');
                }
            } catch (error) {
                console.error('Error fetching order data:', error);
                setError('Error al cargar los datos del pedido');
                setIsDisabled(true);
            }
        };

        fetchOrderData();
    }, [orderId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const orderRef = doc(db, 'Orders', orderId);
            const orderDoc = await getDoc(orderRef);
            const currentEditCount = orderDoc.data()?.shippingEditCount || 0;

            if (currentEditCount >= 2) {
                throw new Error('Ya has alcanzado el límite de ediciones');
            }

            await updateDoc(orderRef, {
                shipping: formData,
                shippingEditCount: currentEditCount + 1
            });

            onClose();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${isDisabled ? styles.disabled : ''}`}>
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2>Editar Dirección de Envío</h2>

                <div className={`${styles.notice} ${isDisabled ? styles.warning : ''}`}>
                    <i className="fas fa-info-circle"></i>
                    <p>{
                        isDisabled ? 
                        error : 
                        `Te quedan ${editsLeft} ${editsLeft === 1 ? 'edición' : 'ediciones'} disponibles`
                    }</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label>Nombre Completo</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            required
                            disabled={isDisabled}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Dirección</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            required
                            disabled={isDisabled}
                        />
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Ciudad</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({...formData, city: e.target.value})}
                                required
                                disabled={isDisabled}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Código Postal</label>
                            <input
                                type="text"
                                value={formData.zipCode}
                                onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                                required
                                disabled={isDisabled}
                            />
                        </div>
                    </div>

                    {error && !isDisabled && <div className={styles.error}>{error}</div>}

                    <button 
                        type="submit" 
                        className={`${styles.submitButton} ${isDisabled ? styles.disabled : ''}`}
                        disabled={loading || isDisabled || editsLeft === 0}
                    >
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default EditShippingModal;