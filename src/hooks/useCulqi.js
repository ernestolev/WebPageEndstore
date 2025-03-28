import { useState, useEffect, useRef } from 'react';

// Función mejorada para cargar el script de Culqi
const injectCulqiScript = () => {
  return new Promise((resolve, reject) => {
    // Verificar si ya está cargado
    if (window.Culqi) {
      return resolve(window.Culqi);
    }

    try {
      // Eliminar cualquier script anterior para evitar conflictos
      const existingScripts = document.querySelectorAll('script[src*="checkout.culqi.com"]');
      existingScripts.forEach(script => script.remove());
      
      // Crear nuevo script
      const script = document.createElement('script');
      script.src = 'https://checkout.culqi.com/js/v4';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Asegurarnos de que el objeto Culqi esté disponible
        if (window.Culqi) {
          resolve(window.Culqi);
        } else {
          // A veces hay un pequeño retraso después de que se carga el script
          setTimeout(() => {
            if (window.Culqi) {
              resolve(window.Culqi);
            } else {
              reject(new Error('Culqi no está disponible después de cargar el script'));
            }
          }, 1000);
        }
      };
      
      script.onerror = () => {
        reject(new Error('No se pudo cargar el script de Culqi'));
      };
      
      document.body.appendChild(script);
    } catch (err) {
      reject(err);
    }
  });
};

export const useCulqi = ({ amount, orderId, email }) => {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [yapeQrCode, setYapeQrCode] = useState(null);
  const paymentResolved = useRef(false);
  const culqiRef = useRef(null);
  
  // Inicializar Culqi cuando el componente se monta
  useEffect(() => {
    // Llave de producción
    const publicKey = 'pk_live_51e7530136f10026';
    let isMounted = true;
    
    const initCulqi = async () => {
      try {
        setLoading(true);
        const culqi = await injectCulqiScript();
        
        if (!isMounted) return;
        
        // Guardar referencia al objeto Culqi
        culqiRef.current = culqi;
        
        // Configurar Culqi
        culqi.publicKey = publicKey;
        
        // Inicializar y configurar opciones
        culqi.init();
        culqi.options({
          lang: "es",
          installments: false,
          paymentMethods: {
            tarjeta: true,
            yape: true,
          },
        });
        
        setIsReady(true);
      } catch (err) {
        console.error('Error inicializando Culqi:', err);
        if (isMounted) {
          setError('No se pudo inicializar el procesador de pagos: ' + err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    initCulqi();
    
    return () => {
      isMounted = false;
      // Cleanup para evitar memory leaks
      if (window.culqi && typeof window.culqi === 'function') {
        window.culqi = function() {}; // Reset el callback global
      }
    };
  }, []);
  
  // Procesar el pago con Culqi
  const handlePayment = (method = 'card') => {
    return new Promise((resolve, reject) => {
      if (!isReady || !culqiRef.current) {
        reject(new Error('El procesador de pagos no está listo. Por favor, recarga la página.'));
        return;
      }
      
      setLoading(true);
      setError(null);
      paymentResolved.current = false;
      
      try {
        // Obtener la referencia a Culqi
        const Culqi = culqiRef.current;
        
        // Configuración para el pago
        Culqi.settings({
          title: 'End Store',
          currency: 'PEN',
          amount: Math.round(amount * 100), // Convertir a centavos
          order: orderId || 'ord_' + Date.now(),
          metadata: { email }
        });
        
        if (method === 'card') {
          // Pago con tarjeta
          Culqi.open();
        } else if (method === 'yape') {
          // Implementación real de Yape
          console.log("Iniciando pago con Yape");
          // Aquí iría la implementación real de Yape
        }
        
        // Listener para eventos de Culqi
        window.culqi = function() {
          if (paymentResolved.current) return;
          
          if (Culqi.token) {
            const token = Culqi.token;
            console.log('Token generado:', token);
            paymentResolved.current = true;
            setLoading(false);
            resolve(token);
          } else if (Culqi.error) {
            const culqiError = Culqi.error;
            console.error('Error de Culqi:', culqiError);
            paymentResolved.current = true;
            setError(culqiError.user_message || culqiError.merchant_message || 'Error en el procesamiento del pago');
            setLoading(false);
            reject(culqiError);
          }
        };
      } catch (err) {
        console.error('Error en procesamiento:', err);
        setError(err.message || 'Error inesperado en el procesamiento del pago');
        setLoading(false);
        reject(err);
      }
    });
  };
  
  // Generar QR de Yape (implementación real)
  const generateYapeQR = async () => {
    try {
      setLoading(true);
      
      // Aquí se implementaría la llamada real al backend
      // Este es un ejemplo simulado para desarrollo
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: 'ype_live_' + Math.random().toString(36).substr(2, 9),
            qr_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', // QR placeholder
            amount: Math.round(amount * 100),
            expiration_date: new Date(Date.now() + 5 * 60000).toISOString() // 5 minutos
          });
        }, 1500);
      });
      
      setYapeQrCode(response);
      return response;
    } catch (error) {
      setError(error.message || 'Error al generar el código QR de Yape');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Verificar el estado de un pago con Yape
  const verifyYapePayment = async (yapeId) => {
    try {
      setLoading(true);
      
      // Aquí se implementaría la llamada real al backend
      // Este es un ejemplo simulado para desarrollo
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: 'chr_live_' + Math.random().toString(36).substr(2, 9),
            amount: Math.round(amount * 100),
            currency_code: 'PEN',
            outcome: { type: 'authorized', code: 'yape_payment_success' },
            source: { id: yapeId, type: 'yape' }
          });
        }, 1500);
      });
      
      return response;
    } catch (error) {
      setError(error.message || 'Error al verificar el pago con Yape');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  // Función para crear un token de Yape
  const createYapeToken = async (phoneNumber, otpCode) => {
    try {
      setLoading(true);
      
      // Aquí se implementaría la llamada real al backend
      // Este es un ejemplo simulado para desarrollo
      const response = await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (otpCode === '123456') { // Código simulado
            resolve({
              id: 'tkn_live_' + Math.random().toString(36).substr(2, 9),
              type: 'yape',
              email: email,
              phone_number: phoneNumber,
              created_at: Date.now()
            });
          } else {
            reject({ user_message: 'Código OTP incorrecto', merchant_message: 'Invalid OTP code' });
          }
        }, 1500);
      });
      
      return response;
    } catch (error) {
      setError(error.message || error.user_message || 'Error al crear el token de Yape');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    isReady,
    loading,
    error,
    yapeQrCode,
    handlePayment,
    verifyYapePayment,
    createYapeToken
  };
};