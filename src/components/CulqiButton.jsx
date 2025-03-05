import React from 'react';
import { useCulqi } from '../hooks/useCulqi';
import styles from '../styles/CulqiButton.module.css';

const CulqiButton = ({ amount, orderId, email, onSuccess, onError }) => {
  const { handlePayment, error, loading, isReady } = useCulqi({
    amount,
    orderId,
    email
  });

  const onClick = async () => {
    try {
      const result = await handlePayment();
      if (result && result.id) {
        onSuccess?.(result);
      }
    } catch (err) {
      onError?.(err);
    }
  };

  if (!isReady) return null;

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      <button
        className={`${styles.culqiButton} ${loading ? styles.loading : ''}`}
        onClick={onClick}
        disabled={loading}
      >
        {loading ? (
          <span className={styles.spinner}></span>
        ) : (
          <>
            <i className="fas fa-credit-card"></i>
            Pagar con Culqi
          </>
        )}
      </button>
    </div>
  );
};

export default CulqiButton;