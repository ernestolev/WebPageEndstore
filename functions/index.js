const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors')({ origin: true });

admin.initializeApp();

exports.processPayment = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      console.log('Recibida solicitud para procesar pago:', JSON.stringify(request.body));

      // Verificar método y origen
      if (request.method !== 'POST') {
        console.error('Método no permitido:', request.method);
        return response.status(405).send('Método no permitido');
      }

      // Recibir datos del cliente
      const { token, amount, orderId, email, description } = request.body;

      if (!token || !amount || !orderId) {
        console.error('Faltan datos requeridos:', { token: !!token, amount, orderId });
        return response.status(400).send('Faltan datos requeridos');
      }

      console.log('Procesando pago para orden:', orderId, 'monto:', amount);

      // Configurar solicitud a Culqi
      const culqiAPI = axios.create({
        baseURL: 'https://api.culqi.com/v2',
        headers: {
          'Authorization': `Bearer sk_live_7b91e396e5e04658`, // Clave privada de producción actualizada
          'Content-Type': 'application/json'
        }
      });

      // Crear el cargo
      const chargeData = {
        amount: Math.round(amount * 100), // Convertir a centavos
        currency_code: 'PEN',
        email: email,
        source_id: token.id,
        description: description || `Compra en End Store - Pedido ${orderId}`,
        capture: true,
        metadata: {
          order_id: orderId
        }
      };

      console.log('Enviando datos a Culqi:', JSON.stringify(chargeData));

      // Realizar la solicitud de cargo a Culqi
      const chargeResponse = await culqiAPI.post('/charges', chargeData);

      console.log('Respuesta exitosa de Culqi:', JSON.stringify(chargeResponse.data));

      // Devolver respuesta exitosa
      return response.status(200).json({
        success: true,
        charge: chargeResponse.data
      });

    } catch (error) {
      console.error('Error en processPayment:', error.message);
      
      // Obtener más detalles del error
      let errorDetails = error.message;
      if (error.response) {
        console.error('Error de respuesta de Culqi:', JSON.stringify(error.response.data));
        errorDetails = JSON.stringify(error.response.data);
      }
      
      return response.status(500).json({
        success: false,
        error: errorDetails
      });
    }
  });
});