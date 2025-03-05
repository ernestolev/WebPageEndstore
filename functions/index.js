const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

const runtimeOpts = {
    timeoutSeconds: 300,
    memory: '256MB',
    nodejs: 20
};

// Define hardcoded PayU configuration with consistent casing
const payuConfig = {
    merchantId: '1020877',          // Changed to camelCase
    accountId: '1029941',           // Changed to camelCase
    apiKey: 'D3xpZdI3LesEFz96645ohZEnhf',  // Changed to camelCase
    apiLogin: 'BI8S0csf1QbADQY',    // Changed to camelCase
    publicKey: 'PKfiBYnG78w9f7K912C2122d7l', // Changed to camelCase
    responseUrl: 'https://endstore.web.app/payment-response', // Changed to camelCase
    confirmationUrl: 'https://endstore.web.app/api/payment-confirmation', // Changed to camelCase
    checkoutUrl: 'https://checkout.payulatam.com/ppp-web-gateway-payu/', // Changed to camelCase
    currency: 'PEN',
    country: 'PE',
    test: 0
};

exports.createPayuPayment = functions
    .runWith(runtimeOpts)
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Usuario no autenticado');
        }

        try {
            const { orderId, amount, shipping } = data;

            // Log received data for debugging
            console.log('Received payment data:', { orderId, amount, shipping });

            // Generate signature using camelCase properties
            const signatureString = `${payuConfig.apiKey}~${payuConfig.merchantId}~${orderId}~${amount}~${payuConfig.currency}`;
            const signature = crypto.createHash('md5').update(signatureString).digest('hex');

            // Save transaction
            const transactionRef = admin.firestore().collection('PayuTransactions').doc();
            await transactionRef.set({
                orderId,
                userId: context.auth.uid,
                amount,
                status: 'PENDING',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                shipping,
                signature // Save signature for reference
            });

            // Create form data with matching PayU field names
            const formData = {
                merchantId: payuConfig.merchantId,
                accountId: payuConfig.accountId,
                description: `Compra en EndStore - Orden ${orderId}`,
                referenceCode: orderId,
                amount,
                tax: "0",
                taxReturnBase: "0",
                currency: payuConfig.currency,
                signature,
                test: payuConfig.test,
                buyerEmail: shipping.email,
                buyerFullName: shipping.fullName,
                shippingAddress: shipping.address,
                shippingCity: shipping.city,
                telephone: shipping.phone,
                responseUrl: payuConfig.responseUrl,
                confirmationUrl: payuConfig.confirmationUrl
            };

            // Log form data for debugging
            console.log('PayU Form Data:', formData);

            return {
                success: true,
                formData,
                transactionId: transactionRef.id
            };

        } catch (error) {
            console.error('Payment error:', {
                message: error.message,
                stack: error.stack,
                data: { orderId: data.orderId, amount: data.amount }
            });
            throw new functions.https.HttpsError('internal', 'Error procesando el pago: ' + error.message);
        }
    });