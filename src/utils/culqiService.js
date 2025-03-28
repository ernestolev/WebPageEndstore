/**
 * Servicio de integración con Culqi para pagos
 */

// Clave pública de prueba
const CULQI_PUBLIC_KEY = 'pk_live_51e7530136f10026';

/**
 * Carga el script de Culqi si no está ya cargado
 */
export const loadCulqiScript = () => {
  return new Promise((resolve, reject) => {
    // Si ya existe en window, resolver inmediatamente
    if (window.Culqi) {
      return resolve(window.Culqi);
    }

    // Eliminar cualquier script previo para evitar conflictos
    const existingScripts = document.querySelectorAll('script[src*="checkout.culqi.com"]');
    existingScripts.forEach(script => script.remove());

    // Crear y agregar el nuevo script
    const script = document.createElement('script');
    script.src = 'https://checkout.culqi.com/js/v4';
    script.async = true;

    script.onload = () => {
      // Dar un pequeño tiempo para que se inicialice completamente
      setTimeout(() => {
        if (window.Culqi) {
          resolve(window.Culqi);
        } else {
          reject(new Error('Culqi no está disponible después de cargar el script'));
        }
      }, 500);
    };

    script.onerror = () => {
      reject(new Error('Error al cargar el script de Culqi'));
    };

    document.body.appendChild(script);
  });
};

/**
 * Inicializa Culqi con la clave pública
 */
export const initCulqi = () => {
  if (!window.Culqi) {
    console.error('Culqi no está disponible. Carga el script primero.');
    return false;
  }

  try {
    window.Culqi.publicKey = CULQI_PUBLIC_KEY;
    window.Culqi.init();

    // Configurar opciones adicionales
    window.Culqi.options({
      lang: "es",
      installments: false,
      paymentMethods: {
        tarjeta: true,
        yape: true,
      },
    });

    console.log('Culqi inicializado correctamente');
    return true;
  } catch (error) {
    console.error('Error al inicializar Culqi:', error);
    return false;
  }
};

/**
 * Procesa un pago con tarjeta
 * @param {object} config - Configuración del pago
 * @returns {Promise} - Promesa que se resuelve con el token de la tarjeta
 */
export const processCardPayment = (config) => {
  return new Promise((resolve, reject) => {
    if (!window.Culqi) {
      reject(new Error('Culqi no está disponible. Carga el script primero.'));
      return;
    }

    try {
      // Configuración mínima requerida para el pago
      const settings = {
        title: config.title || 'End Store',
        currency: 'PEN',
        amount: Math.round(config.amount * 100), // Convertir a centavos
        description: `Compra en End Store - Orden ${config.orderId || Date.now()}`
      };

      // Añadir metadata si hay email
      if (config.email) {
        settings.metadata = {
          email: config.email,
          order_id: config.orderId || `ORD-${Date.now()}`
        };
      }

      // ELIMINAR ESTA PARTE - Es la que causa el error
      // if (config.orderId) {
      //   settings.order = config.orderId;
      // }

      console.log('Configuración de Culqi:', settings);

      // Aplicar configuración a Culqi
      window.Culqi.settings(settings);

      // Establecer callback para recibir respuesta
      window.culqi = function () {
        if (window.Culqi.token) {
          console.log('Token generado:', window.Culqi.token.id);
          resolve(window.Culqi.token);
        } else if (window.Culqi.error) {
          console.error('Error de Culqi:', window.Culqi.error);
          reject(window.Culqi.error);
        }
      };

      // Abrir formulario de Culqi
      window.Culqi.open();

    } catch (error) {
      console.error('Error al procesar el pago:', error);
      reject(error);
    }
  });
};

/**
 * Limpia cualquier recurso o estado relacionado con Culqi
 */
export const cleanupCulqi = () => {
  try {
    // Intentar cerrar el formulario si está abierto
    if (window.Culqi && typeof window.Culqi.close === 'function') {
      window.Culqi.close();
    }
    
    // Resetear el callback global
    if (window.culqi && typeof window.culqi === 'function') {
      window.culqi = function () {};
    }
    
    console.log('Recursos de Culqi liberados correctamente');
  } catch (error) {
    console.error('Error al limpiar recursos de Culqi:', error);
  }
};