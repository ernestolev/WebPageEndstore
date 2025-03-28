import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'; // Añadir setDoc
import { db } from '../Firebase';
import styles from '../styles/TrackingModal.module.css';

const AdminTrackingModal = ({ orderId, onClose, onUpdate }) => { // Asegúrate de recibir onUpdate
    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingDate, setEditingDate] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [error, setError] = useState(null); // Añadir estado para errores

    const steps = [
        {
            status: 'ACCEPTED',
            title: 'Pedido Aceptado',
            icon: <i className="fas fa-check"></i>,
            description: 'Pedido confirmado y validado'
        },
        {
            status: 'PACKING',
            title: 'Preparando Pedido',
            icon: <i className="fas fa-box"></i>,
            description: 'Pedido siendo empacado'
        },
        {
            status: 'COURIER',
            title: 'En Courier',
            icon: <i className="fas fa-warehouse"></i>,
            description: 'Entregado al servicio de mensajería'
        },
        {
            status: 'SHIPPING',
            title: 'En Camino',
            icon: <i className="fas fa-truck"></i>,
            description: 'En ruta de entrega'
        },
        {
            status: 'DELIVERED',
            title: 'Entregado',
            icon: <i className="fas fa-home"></i>,
            description: 'Entregado con éxito'
        }
    ];

    useEffect(() => {
        fetchTracking();
    }, [orderId]);

    const fetchTracking = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log(`Obteniendo seguimiento para orden ID: ${orderId}`);
            const trackingRef = doc(db, 'tracking', orderId);
            const trackingDoc = await getDoc(trackingRef);
            
            if (trackingDoc.exists()) {
                console.log('Datos de seguimiento encontrados:', trackingDoc.data());
                const trackingData = trackingDoc.data();
                setTracking(trackingData);
                setSelectedStatus(trackingData.currentStatus || 'ACCEPTED');
            } else {
                console.log('No existe seguimiento para esta orden, creando inicial...');
                // Crear seguimiento inicial si no existe
                const initialTracking = {
                    orderId,
                    currentStatus: 'ACCEPTED',
                    updates: {
                        ACCEPTED: new Date().toISOString()
                    },
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
                
                // Usar setDoc en lugar de updateDoc para crear el documento
                await setDoc(trackingRef, initialTracking);
                console.log('Seguimiento inicial creado:', initialTracking);
                
                // Actualizar también el estado del pedido en la colección Orders
                try {
                    const orderRef = doc(db, 'Orders', orderId);
                    await updateDoc(orderRef, {
                        status: 'ACCEPTED',
                        lastUpdated: new Date().toISOString()
                    });
                    console.log('Estado de la orden actualizado a ACCEPTED');
                } catch (orderErr) {
                    console.error('Error actualizando estado de la orden:', orderErr);
                }
                
                setTracking(initialTracking);
                setSelectedStatus('ACCEPTED');
                
                // Notificar al componente padre sobre el cambio
                if (typeof onUpdate === 'function') {
                    onUpdate(orderId, 'ACCEPTED');
                }
            }
        } catch (error) {
            console.error('Error fetching tracking:', error);
            setError('No se pudo cargar el seguimiento. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const updateTrackingStatus = async (newStatus, customDate = null) => {
        try {
            setLoading(true);
            console.log(`Actualizando estado a: ${newStatus}`);
            
            const trackingRef = doc(db, 'tracking', orderId);
            const updateDate = customDate ? new Date(customDate).toISOString() : new Date().toISOString();

            // Find the index of the new status in the steps array
            const newStatusIndex = steps.findIndex(step => step.status === newStatus);

            // Create a new updates object starting with existing updates
            const currentUpdates = { ...tracking?.updates } || {};
            const updatedUpdates = {};

            // Only keep updates for steps up to and including the new status
            steps.forEach((step, index) => {
                if (index <= newStatusIndex && currentUpdates[step.status]) {
                    updatedUpdates[step.status] = currentUpdates[step.status];
                }
            });

            // Always set the new status update with current date
            updatedUpdates[newStatus] = updateDate;

            console.log('Actualizando con:', {
                currentStatus: newStatus,
                lastUpdated: updateDate,
                updates: updatedUpdates
            });

            await updateDoc(trackingRef, {
                currentStatus: newStatus,
                lastUpdated: updateDate,
                updates: updatedUpdates
            });
            
            // Actualizar también el estado en la colección de órdenes
            try {
                const orderRef = doc(db, 'Orders', orderId);
                await updateDoc(orderRef, {
                    status: newStatus,
                    lastUpdated: updateDate
                });
                console.log(`Estado de la orden actualizado a ${newStatus}`);
            } catch (orderErr) {
                console.error('Error actualizando estado de la orden:', orderErr);
            }

            // Recargar datos actualizados
            await fetchTracking();
            setEditingDate(null);
            
            // Notificar al componente padre sobre el cambio
            if (typeof onUpdate === 'function') {
                onUpdate(orderId, newStatus);
            }
        } catch (error) {
            console.error('Error updating tracking:', error);
            setError('No se pudo actualizar el estado. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const updateStatusDate = async (status, newDate) => {
        try {
            setLoading(true);
            
            const trackingRef = doc(db, 'tracking', orderId);
            const formattedDate = new Date(newDate).toISOString();
            
            console.log(`Actualizando fecha para estado ${status} a: ${formattedDate}`);
            
            await updateDoc(trackingRef, {
                [`updates.${status}`]: formattedDate,
                lastUpdated: new Date().toISOString()
            });
            
            // Recargar datos actualizados
            await fetchTracking();
            setEditingDate(null);
        } catch (error) {
            console.error('Error updating date:', error);
            setError('No se pudo actualizar la fecha. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentStep = () => {
        if (!tracking) return 0;
        return steps.findIndex(step => step.status === tracking.currentStatus);
    };
    
    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.adminModal}`}>
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2>Gestión de Seguimiento</h2>
                <p className={styles.orderId}>Pedido #{orderId}</p>

                {!loading && (
                    <div className={styles.adminControls}>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className={styles.statusSelect}
                        >
                            {steps.map(step => (
                                <option key={step.status} value={step.status}>
                                    {step.title}
                                </option>
                            ))}
                        </select>
                        <button
                            className={styles.updateButton}
                            onClick={() => updateTrackingStatus(selectedStatus)}
                        >
                            Actualizar Estado
                        </button>
                    </div>
                )}

                {error && (
                    <div className={styles.errorMessage}>
                        <i className="fas fa-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className={styles.loading}>Cargando estado del pedido...</div>
                ) : (
                    <div className={styles.timeline}>
                        {steps.map((step, index) => (
                            <div
                                key={step.status}
                                className={`${styles.step} ${step.status === tracking?.currentStatus ? styles.current : ''}`}
                            >
                                <div className={styles.iconContainer}>
                                    <span className={styles.icon}>{step.icon}</span>
                                    {index < steps.length - 1 && <div className={styles.line} />}
                                </div>
                                <div className={styles.stepContent}>
                                    <h3>{step.title}</h3>
                                    <p>{step.description}</p>

                                    {tracking?.updates?.[step.status] ? (
                                        editingDate === step.status ? (
                                            <div className={styles.dateEditor}>
                                                <input
                                                    type="datetime-local"
                                                    defaultValue={new Date(tracking.updates[step.status])
                                                        .toISOString().slice(0, 16)}
                                                    onChange={(e) => updateStatusDate(step.status, e.target.value)}
                                                />
                                                <button onClick={() => setEditingDate(null)}>
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={styles.dateContainer}>
                                                <span className={styles.date}>
                                                    {new Date(tracking.updates[step.status])
                                                        .toLocaleString('es-PE', {
                                                            timeZone: 'America/Lima' // UTC-5 (Perú)
                                                        })}
                                                </span>
                                                <button
                                                    className={styles.editDateButton}
                                                    onClick={() => setEditingDate(step.status)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        )
                                    ) : (
                                        <button
                                            className={styles.setDateButton}
                                            onClick={() => updateTrackingStatus(step.status)}
                                        >
                                            Establecer Fecha
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTrackingModal;