import { useState, useEffect } from 'react';
import styles from '../styles/CulqiButton.module.css';
import PropTypes from 'prop-types';
import { loadCulqiScript, initCulqi, processCardPayment, cleanupCulqi } from '../utils/culqiService';

const CulqiButton = ({ amount, orderId, email, onSuccess, onError, disabled }) => {
  const [processError, setProcessError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Efecto para cargar e inicializar Culqi
  useEffect(() => {
    let isMounted = true;

    const setupCulqi = async () => {
      try {
        await loadCulqiScript();

        if (!isMounted) return;

        const initialized = initCulqi();
        if (initialized) {
          setIsReady(true);
        }
      } catch (err) {
        console.error('Error inicializando Culqi:', err);
        if (isMounted) {
          setProcessError('Error al cargar el procesador de pagos');
        }
      }
    };

    setupCulqi();

    return () => {
      isMounted = false;
      cleanupCulqi();
    };
  }, []);

  const handleClick = async () => {
    setProcessError(null);
    setLoading(true);

    try {
      // Procesar el pago con todos los datos necesarios
      const token = await processCardPayment({
        amount: amount,
        orderId: orderId,
        email: email,
        title: 'End Store'
      });

      // Cerrar el formulario de Culqi inmediatamente después de obtener el token
      cleanupCulqi();

      // Luego continuar con el flujo normal
      onSuccess(token);
    } catch (err) {
      console.error('Error en procesamiento:', err);
      setProcessError(err.user_message || err.merchant_message || err.message || 'Error al procesar el pago');
      onError(err);

      // También intentar limpiar en caso de error
      cleanupCulqi();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.culqiWrapper}>
      {processError && (
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i>
          {processError}
        </div>
      )}

      <button
        type="button"
        className={styles.culqiButton}
        onClick={handleClick}
        disabled={!isReady || loading || disabled}
      >
        {loading ? (
          <div className={styles.buttonContent}>
            <span>Procesando</span> <div className={styles.miniSpinner}></div>
          </div>
        ) : !isReady ? (
          <div className={styles.buttonContent}>
            <span>Cargando pasarela</span> <div className={styles.miniSpinner}></div>
          </div>
        ) : (
          <div className={styles.buttonContent}>
            <i className="fas fa-lock"></i>
            <span>Pagar con Culqi</span>
            <div className={styles.paymentIcons}>
              <i className="fab fa-cc-visa"></i>
              <i className="fab fa-cc-mastercard"></i>
              <i className="fab fa-cc-amex"></i>
            </div>
          </div>
        )}
      </button>
    </div>
  );
};

CulqiButton.propTypes = {
  amount: PropTypes.number.isRequired,
  email: PropTypes.string.isRequired,
  orderId: PropTypes.string,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

CulqiButton.defaultProps = {
  disabled: false,
  orderId: `ORD-${Date.now()}`
};

export default CulqiButton;