const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const crypto = require('crypto');  // Add this line
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// PayU Configuration
const payuConfig = {
    merchantId: "1020877",
    accountId: "1029941",
    apiKey: "D3xpZdI3LesEFz96645ohZEnhf",
    responseUrl: "https://endstore.web.app/payment-response",
    confirmationUrl: "https://endstore-backend-793470205282.us-central1.run.app/payment-confirmation",
    checkoutUrl: "https://checkout.payulatam.com/ppp-web-gateway-payu",
    currency: "PEN",
    country: "PE",
    test: "0"
};

try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined;

    console.log('Initializing Firebase Admin with:', {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!privateKey
    });

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
        })
    });

    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Firebase Admin initialization error:', error);
    process.exit(1);
}
const allowedOrigins = [
    'http://localhost:3008',
    'http://localhost:5173',
    'https://endstore.web.app',
    'https://endstore.firebaseapp.com',
    'https://endstore-backend-793470205282.us-central1.run.app'
];
// Middleware

app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
}).on('error', (err) => {
    console.error('Server startup error:', err);
});

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());

app.options('*', cors());

// Auth middleware
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('Auth header present:', !!authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'No authentication token provided'
            });
        }

        const token = authHeader.split('Bearer ')[1];
        console.log('Token received:', token.substring(0, 10) + '...');

        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('Token verified for user:', decodedToken.uid);

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({
            error: 'Invalid authentication token',
            details: error.message
        });
    }
};

app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: err.message,
        code: err.code
    });
});

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});


app.post('/payment-response', async (req, res) => {
    try {
        const {
            referenceCode,
            transactionState,
            TX_VALUE,
            signature
        } = req.body;

        // Verify signature
        const transactionRef = admin.firestore()
            .collection('PayuTransactions')
            .where('orderId', '==', referenceCode);

        const transaction = (await transactionRef.get()).docs[0];

        if (transaction) {
            await transaction.ref.update({
                status: transactionState,
                payuResponse: req.body,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.redirect(`${process.env.FRONTEND_URL}/payment-result?status=${transactionState}`);
    } catch (error) {
        console.error('Payment response error:', error);
        res.redirect(`https://endstore.web.app/payment-result?status=${transactionState}`);
    }
});

// PayU confirmation endpoint
app.post('/payment-confirmation', async (req, res) => {
    try {
        const {
            reference_sale,
            state_pol,
            sign
        } = req.body;

        const transactionRef = admin.firestore()
            .collection('PayuTransactions')
            .where('orderId', '==', reference_sale);

        const transaction = (await transactionRef.get()).docs[0];

        if (transaction) {
            await transaction.ref.update({
                status: state_pol,
                confirmationData: req.body,
                confirmedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).send('ERROR');
    }
});

// PayU payment endpoint
app.post('/api/payments', authenticateUser, async (req, res) => {
    try {
        const { amount, orderId, shipping, userId, cartItems } = req.body;

        if (!amount || !orderId || !shipping || !userId || !cartItems) {
            console.error('Missing required fields:', { amount, orderId, shipping, userId, cartItems });
            return res.status(400).json({
                error: 'Faltan campos requeridos'
            });
        }

        const reference = `ORDER${Date.now()}`;
        const amountStr = Number(amount).toFixed(2);

        // Create signature
        const signatureString = `${payuConfig.apiKey}~${payuConfig.merchantId}~${reference}~${amountStr}~${payuConfig.currency}`;
        const signature = crypto
            .createHash('md5')
            .update(signatureString)
            .digest('hex');

        const formData = {
            merchantId: payuConfig.merchantId,
            referenceCode: reference,
            description: `Compra en EndStore - Orden ${orderId}`,
            amount: amountStr,
            tax: "0",
            taxReturnBase: "0",
            currency: payuConfig.currency,
            signature: signature,
            accountId: payuConfig.accountId,
            buyerFullName: shipping.fullName,
            buyerEmail: shipping.email || req.user.email,
            shippingAddress: shipping.address,
            shippingCity: shipping.city,
            shippingCountry: "PE",
            telephone: shipping.phone || "999999999",
            responseUrl: payuConfig.responseUrl,
            confirmationUrl: payuConfig.confirmationUrl,
            test: payuConfig.test
        };

        // Save to Firestore
        await admin.firestore().collection('PayuTransactions').doc(reference).set({
            userId: userId,
            amount: Number(amountStr),
            status: 'PENDING',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            formData: formData,
            shipping: shipping,
            reference: reference,
            cartItems: cartItems,
            orderId: orderId
        });

        res.json({
            success: true,
            formData,
            checkoutUrl: payuConfig.checkoutUrl
        });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({
            error: 'Error procesando el pago',
            details: error.message
        });
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
