import { useState, useEffect } from 'react';

const CULQI_PUBLIC_KEY = 'pk_test_c1bc662a42169ca5';

export const useCulqi = ({ amount, orderId, email }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.Culqi) {
      window.Culqi.publicKey = CULQI_PUBLIC_KEY;
      setIsReady(true);
    }
  }, []);

  const handlePayment = async () => {
    if (!isReady) return;

    setLoading(true);
    setError(null);

    try {
      window.Culqi.settings({
        title: 'EndStore',
        currency: 'PEN',
        amount: Math.round(amount * 100), // Convert to cents and ensure integer
        description: `Orden ${orderId}`,
        email: email
      });

      window.Culqi.options({
        lang: 'es',
        modal: true,
        installments: true,
        customButton: 'Pagar con Culqi'
      });

      return new Promise((resolve, reject) => {
        window.culqi = async function(response) {
          if (response.token) {
            try {
              const paymentResponse = await fetch('http://localhost:3001/api/pagar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  token: response.token.id,
                  monto: Math.round(amount * 100),
                  email: email,
                  orderId: orderId
                })
              });

              const data = await paymentResponse.json();
              
              if (!paymentResponse.ok) {
                throw new Error(data.message || 'Error al procesar el pago');
              }

              resolve(data);
            } catch (err) {
              reject(err);
              setError(err.message);
            }
          } else if (response.error) {
            reject(new Error(response.error.mensaje || 'Error en el pago'));
            setError(response.error.mensaje || 'Error en el pago');
          }
        };

        window.Culqi.open();
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { handlePayment, error, loading, isReady };
};