import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import styles from '../styles/Comentarios.module.css';

const getInitialAvatar = (userName) => {
    if (!userName) return '';
    return userName.charAt(0).toUpperCase();
};

const Comentarios = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchReviews = async () => {
            if (!productId) return;

            try {
                setLoading(true);
                const reviewsQuery = query(
                    collection(db, 'comentarios'),
                    where('productId', '==', productId),
                    orderBy('createdAt', 'desc')
                );

                const querySnapshot = await getDocs(reviewsQuery);
                const reviewsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Process the data without blocking the main thread
                requestAnimationFrame(() => {
                    let total = 0;
                    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    reviewsData.forEach(review => {
                        total += review.rating;
                        counts[review.rating]++;
                    });

                    setReviews(reviewsData);
                    setAverageRating(reviewsData.length > 0 ? total / reviewsData.length : 0);
                    setRatingCounts(counts);
                    setLoading(false);
                });
            } catch (error) {
                console.error('Error fetching reviews:', error);
                setLoading(false);
            }
        };

        fetchReviews();

        // Cleanup function
        return () => {
            setReviews([]);
            setLoading(false);
        };
    }, [productId]);

    if (loading) {
        return <div className={styles.loading}>Cargando comentarios...</div>;
    }

    return (
        <div className={styles.reviewsSection}>
            <h2>Opiniones de Compradores</h2>
            <div className={styles.reviewsSummary}>
                <div className={styles.ratingOverview}>
                    <div className={styles.averageRating}>
                        <span className={styles.ratingNumber}>{averageRating.toFixed(1)}</span>
                        <div className={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <i
                                    key={star}
                                    className={`fas fa-star ${star <= Math.round(averageRating) ? styles.filled : ''}`}
                                ></i>
                            ))}
                        </div>
                        <span className={styles.totalReviews}>
                            {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}
                        </span>
                    </div>
                    <div className={styles.ratingBars}>
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className={styles.ratingBar}>
                                <span>{rating}</span>
                                <div className={styles.barContainer}>
                                    <div
                                        className={styles.bar}
                                        style={{
                                            width: `${reviews.length ? (ratingCounts[rating] / reviews.length) * 100 : 0}%`
                                        }}
                                    ></div>
                                </div>
                                <span>{ratingCounts[rating]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={styles.reviewsList}>
                {reviews.map((review) => (
                    <div key={review.id} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                            <div className={styles.reviewerInfo}>
                                <div className={styles.initialAvatar}>
                                    {getInitialAvatar(review.userName)}
                                </div>
                                <div>
                                    <h4>{review.userName}</h4>
                                    {review.verifiedPurchase && (
                                        <span className={styles.verifiedPurchase}>Compra verificada</span>
                                    )}
                                </div>
                            </div>
                            <div className={styles.reviewRating}>
                                <div className={styles.stars}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <i
                                            key={star}
                                            className={`fas fa-star ${star <= review.rating ? styles.filled : ''}`}
                                        ></i>
                                    ))}
                                </div>
                                <span className={styles.reviewDate}>
                                    {new Date(review.createdAt?.toDate()).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className={styles.reviewContent}>
                            <p>{review.comment}</p>
                            {review.images && review.images.length > 0 && (
                                <div className={styles.reviewImages}>
                                    {review.images.map((image, index) => (
                                        <img key={index} src={image} alt={`Review ${index + 1}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && (
                    <p className={styles.noReviews}>Este producto aún no tiene opiniones</p>
                )}
            </div>
        </div>
    );
};

export default Comentarios;