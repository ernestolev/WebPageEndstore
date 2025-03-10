import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Firebase';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/ComentariosModal.module.css';

const ComentariosModal = ({ orderId, productId, productName, onClose }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Por favor, selecciona una calificación');
            return;
        }
        if (!comment.trim()) {
            setError('Por favor, escribe un comentario');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'comentarios'), {
                productId,
                orderId,
                userId: user.uid,
                userName: user.displayName || 'Usuario',
                userPhoto: user.photoURL,
                rating,
                comment: comment.trim(),
                createdAt: serverTimestamp(),
                verifiedPurchase: true,
                orderDate: new Date().toISOString()
            });
            onClose();
        } catch (error) {
            console.error('Error al guardar el comentario:', error);
            setError('Hubo un error al guardar tu comentario. Por favor, intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>

                <h2>Calificar Producto</h2>
                <h3>{productName}</h3>

                <div className={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <i
                            key={star}
                            className={`fas fa-star ${styles.star} ${
                                (hoveredRating || rating) >= star ? styles.filled : ''
                            }`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                        ></i>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <textarea
                        placeholder="Comparte tu opinión sobre el producto..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows="4"
                    ></textarea>

                    {error && <p className={styles.error}>{error}</p>}

                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Enviando...' : 'Enviar Comentario'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ComentariosModal;