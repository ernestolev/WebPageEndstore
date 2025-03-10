import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/TrackingModal.module.css';

const TrackingModal = ({ orderId, onClose }) => {
    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);

    const steps = [
        {
            status: 'ACCEPTED',
            title: 'Pedido Aceptado',
            icon: <i className="fas fa-check"></i>,
            description: 'Tu pedido ha sido confirmado y validado'
        },
        {
            status: 'PACKING',
            title: 'Preparando Pedido',
            icon: <i className="fas fa-box"></i>,
            description: 'Tu pedido está siendo empacado'
        },
        {
            status: 'COURIER',
            title: 'En Courier',
            icon: <i className="fas fa-warehouse"></i>,
            description: 'Pedido entregado al servicio de mensajería'
        },
        {
            status: 'SHIPPING',
            title: 'En Camino',
            icon: <i className="fas fa-truck"></i>,
            description: 'Tu pedido está en ruta de entrega'
        },
        {
            status: 'DELIVERED',
            title: 'Entregado',
            icon: <i className="fas fa-home"></i>,
            description: 'Pedido entregado con éxito'
        }
    ];

    useEffect(() => {
        const fetchTracking = async () => {
            try {
                const trackingDoc = await getDoc(doc(db, 'tracking', orderId));
                if (trackingDoc.exists()) {
                    setTracking(trackingDoc.data());
                }
            } catch (error) {
                console.error('Error fetching tracking:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTracking();
    }, [orderId]);

    const getCurrentStep = () => {
        if (!tracking) return 0;
        return steps.findIndex(step => step.status === tracking.currentStatus);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2>Seguimiento de Pedido</h2>
                <p className={styles.orderId}>Pedido #{orderId}</p>

                {loading ? (
                    <div className={styles.loading}>Cargando estado del pedido...</div>
                ) : (
                    <div className={styles.timeline}>
                        {steps.map((step, index) => {
                            const currentStep = getCurrentStep();
                            const isCompleted = index <= currentStep;
                            const isCurrent = index === currentStep;

                            return (
                                <div
                                    key={step.status}
                                    className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''}`}
                                >
                                    <div className={styles.iconContainer}>
                                        <span className={styles.icon}>{step.icon}</span>
                                        {index < steps.length - 1 && <div className={styles.line} />}
                                    </div>
                                    <div className={styles.stepContent}>
                                        <h3>{step.title}</h3>
                                        <p>{step.description}</p>
                                        {tracking?.updates?.[step.status] && (
                                            <span className={styles.date}>
                                                {new Date(tracking.updates[step.status]).toLocaleString('es-PE')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackingModal;