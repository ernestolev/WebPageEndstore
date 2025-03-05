import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/TrackingModal.module.css';


const AdminTrackingModal = ({ orderId, onClose }) => {
    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingDate, setEditingDate] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);

    const steps = [
        {
            status: 'ACCEPTED',
            title: 'Pedido Aceptado',
            icon: '✓',
            description: 'Pedido confirmado y validado'
        },
        {
            status: 'PACKING',
            title: 'Preparando Pedido',
            icon: '📦',
            description: 'Pedido siendo empacado'
        },
        {
            status: 'COURIER',
            title: 'En Courier',
            icon: '🚚',
            description: 'Entregado al servicio de mensajería'
        },
        {
            status: 'SHIPPING',
            title: 'En Camino',
            icon: '🛵',
            description: 'En ruta de entrega'
        },
        {
            status: 'DELIVERED',
            title: 'Entregado',
            icon: '🏠',
            description: 'Entregado con éxito'
        }
    ];

    useEffect(() => {
        fetchTracking();
    }, [orderId]);

    const fetchTracking = async () => {
        try {
            const trackingDoc = await getDoc(doc(db, 'tracking', orderId));
            if (trackingDoc.exists()) {
                setTracking(trackingDoc.data());
                setSelectedStatus(trackingDoc.data().currentStatus);
            } else {
                // Create initial tracking if it doesn't exist
                const initialTracking = {
                    orderId,
                    currentStatus: 'ACCEPTED',
                    updates: {
                        ACCEPTED: new Date().toISOString()
                    },
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
                await updateDoc(doc(db, 'tracking', orderId), initialTracking);
                setTracking(initialTracking);
                setSelectedStatus('ACCEPTED');
            }
        } catch (error) {
            console.error('Error fetching tracking:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateTrackingStatus = async (newStatus, customDate = null) => {
        try {
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

            console.log('Updating with:', {
                currentStatus: newStatus,
                lastUpdated: updateDate,
                updates: updatedUpdates
            });

            await updateDoc(trackingRef, {
                currentStatus: newStatus,
                lastUpdated: updateDate,
                updates: updatedUpdates
            });

            await fetchTracking();
            setEditingDate(null);
        } catch (error) {
            console.error('Error updating tracking:', error);
        }
    };

    const updateStatusDate = async (status, newDate) => {
        try {
            const trackingRef = doc(db, 'tracking', orderId);
            await updateDoc(trackingRef, {
                [`updates.${status}`]: new Date(newDate).toISOString(),
                lastUpdated: new Date().toISOString()
            });
            await fetchTracking();
            setEditingDate(null);
        } catch (error) {
            console.error('Error updating date:', error);
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
                                                        .toLocaleString('es-PE')}
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