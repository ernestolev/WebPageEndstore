import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
    getDoc,
    writeBatch,
    increment,
    updateDoc
} from 'firebase/firestore';
import { db } from '../Firebase';
import { useCart } from '../context/CartContext';
import PayuButton from '../components/PayuButton';
import styles from '../styles/Checkout.module.css';
import AnnouncementBar from '../components/AnnouncementBar';
import { useAuth } from '../context/AuthContext';
import GooglePayButton from '@google-pay/button-react';
import imggpay from '../assets/imgs/Gpay-logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { regionesPeru, ProvinciasPeru } from '../Data/PeruData';
import * as emailjs from 'emailjs-com';
import { loadCulqiScript, initCulqi, processCardPayment, cleanupCulqi } from '../utils/culqiService';
import CulqiButton from '../components/CulqiButton';

const Checkout = () => {
    const {
        cart,
        getCartTotal,
        clearCart,
        getSubtotal,
        getShippingCost,
        SHIPPING_THRESHOLD,
        SHIPPING_COST,
        discountCode,
        discountAmount
    } = useCart();
    const [showBackOfCard, setShowBackOfCard] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState('shipping'); // 'shipping', 'payment' o 'culqi-form'
    const [paymentData, setPaymentData] = useState({
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
        cardHolder: '',
        email: ''
    });
    const [provinciasDisponibles, setProvinciasDisponibles] = useState([]);

    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formIsValid, setFormIsValid] = useState(false);
    const orderId = useRef(`ORD-${Date.now()}`).current;
    const [distritosLima, setDistritosLima] = useState([]);

    const [formData, setFormData] = useState({
        fullName: user?.displayName || '',
        email: user?.email || '',
        phone: '',
        shippingType: 'lima',
        // Lima fields
        district: '',
        address: '',
        locationLink: '',
        // Province fields
        documentType: 'dni',
        documentNumber: '',
        region: '',
        province: '',
        agencyDistrict: '',
        agencyName: '',
        // Payment
        paymentMethod: 'card'
    });

    const validateForm = () => {
        const commonFields = {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone
        };

        const limaFields = {
            district: formData.district,
            address: formData.address
        };

        const provinceFields = {
            documentType: formData.documentType,
            documentNumber: formData.documentNumber,
            region: formData.region,
            province: formData.province,
            agencyDistrict: formData.agencyDistrict
        };

        const fieldsToValidate = {
            ...commonFields,
            ...(formData.shippingType === 'lima' ? limaFields : provinceFields)
        };

        return Object.entries(fieldsToValidate).every(([_, value]) =>
            value && value.trim() !== ''
        );
    };

    // Agregar este useEffect debajo de los otros que ya tienes

    useEffect(() => {
        // Inicializar Culqi al cargar la página
        const initCulqi = async () => {
            try {
                if (!window.Culqi) {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.culqi.com/js/v4';
                    script.async = true;

                    // Crear una promesa para cuando el script se cargue
                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                        document.body.appendChild(script);
                    });

                    // Pequeña pausa para asegurar inicialización
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                if (window.Culqi) {
                    window.Culqi.publicKey = 'pk_test_c1bc662a42169ca5'; // CLAVE CORREGIDA
                    window.Culqi.init();
                    console.log('✅ Culqi inicializado correctamente');
                } else {
                    console.warn('⚠️ No se pudo inicializar Culqi');
                }
            } catch (error) {
                console.error('Error inicializando Culqi:', error);
            }
        };

        initCulqi();

        // Limpiar culqi al desmontar
        return () => {
            // Reset global callback
            if (window.culqi && typeof window.culqi === 'function') {
                window.culqi = function () { };
            }
        };
    }, []);


    useEffect(() => {
        // Inicializar EmailJS correctamente
        emailjs.init({
            publicKey: "BhNkNrOZyhXiJZiYc", // Tu User ID de EmailJS
        });
        console.log("EmailJS inicializado correctamente");
    }, []);

    // Actualizar el estado de validación del formulario cuando cambien los datos
    useEffect(() => {
        setFormIsValid(validateForm());
    }, [formData]);

    useEffect(() => {
        if (formData.region) {
            const provincias = ProvinciasPeru[formData.region] || [];
            setProvinciasDisponibles(provincias);

            // Si cambia la región, resetear la provincia seleccionada
            if (provincias.length > 0 && !provincias.find(p => p.nombre === formData.province)) {
                setFormData(prev => ({
                    ...prev,
                    province: ''
                }));
            }
        } else {
            setProvinciasDisponibles([]);
        }
    }, [formData.region]);

    useEffect(() => {
        // Si el tipo de envío es Lima, cargar los distritos disponibles
        if (formData.shippingType === 'lima') {
            // Obtener los distritos de Lima del objeto ProvinciasPeru
            const limDistritos = ProvinciasPeru["Lima"] || [];
            setDistritosLima(limDistritos);
        }
    }, [formData.shippingType]);

    const updateProductsStock = async (items) => {
        try {
            const batch = writeBatch(db);

            for (const item of items) {
                const productRef = doc(db, 'Productos', item.id);
                const productDoc = await getDoc(productRef);

                if (!productDoc.exists()) {
                    console.error(`Producto ${item.id} no encontrado para actualizar stock`);
                    continue;
                }

                const productData = productDoc.data();

                // Comprobar si el producto maneja tallas y si se especificó una talla
                if (item.hasSizes && item.size) {
                    // Para productos con tallas: actualizar SOLO la talla específica
                    const currentSizeStock = productData.sizes?.[item.size] || 0;

                    // Validar que hay suficiente stock
                    if (currentSizeStock < item.quantity) {
                        console.warn(`Stock insuficiente para ${item.id} talla ${item.size}: ${currentSizeStock} < ${item.quantity}`);
                        const adjustedQuantity = Math.max(0, currentSizeStock);

                        if (adjustedQuantity > 0) {
                            // Actualizar solo inventario de la talla
                            const updates = {};
                            updates[`sizes.${item.size}`] = currentSizeStock - adjustedQuantity;

                            // Actualizar también el stock general
                            updates.stock = Math.max(0, (productData.stock || 0) - adjustedQuantity);

                            batch.update(productRef, updates);
                        }
                    } else {
                        // Hay suficiente stock, actualizar normalmente
                        const updates = {};
                        updates[`sizes.${item.size}`] = currentSizeStock - item.quantity;

                        // También actualizar el stock general
                        updates.stock = Math.max(0, (productData.stock || 0) - item.quantity);

                        batch.update(productRef, updates);

                        console.log(`Actualizado: talla ${item.size} de ${currentSizeStock} a ${currentSizeStock - item.quantity}`);
                    }
                } else {
                    // Para productos sin tallas: solo actualizar el stock general
                    const currentStock = productData.stock || 0;

                    if (currentStock < item.quantity) {
                        console.warn(`Stock insuficiente para ${item.id}: ${currentStock} < ${item.quantity}`);
                        const adjustedQuantity = Math.max(0, currentStock);

                        if (adjustedQuantity > 0) {
                            batch.update(productRef, {
                                stock: currentStock - adjustedQuantity
                            });
                        }
                    } else {
                        batch.update(productRef, {
                            stock: currentStock - item.quantity
                        });

                        console.log(`Actualizado: stock general de ${currentStock} a ${currentStock - item.quantity}`);
                    }
                }
            }

            // Ejecutar todas las actualizaciones en una única transacción
            await batch.commit();
            console.log("Stock de productos actualizado correctamente");
            return true;
        } catch (error) {
            console.error("Error actualizando stock de productos:", error);
            return false;
        }
    };



    const handleCulqiSuccess = async (token) => {
        console.log('Pago exitoso con Culqi:', token);

        cleanupCulqi();

        try {
            setLoading(true);

            // URL correcta de la Cloud Function
            const functionUrl = 'https://us-central1-endstore.cloudfunctions.net/processPayment';

            console.log('Enviando token a Cloud Function en:', functionUrl);
            console.log('Datos enviados:', {
                token: token,
                amount: total,
                orderId: orderId,
                email: formData.email || user?.email,
                description: `Compra en End Store - Pedido ${orderId}`
            });

            // Enviar el token a nuestra Cloud Function para procesar el cargo
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    amount: total,
                    orderId: orderId,
                    email: formData.email || user?.email,
                    description: `Compra en End Store - Pedido ${orderId}`
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error en respuesta de Cloud Function:', response.status, errorText);
                throw new Error(`Error al procesar el pago: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('Respuesta de Cloud Function:', data);



            // Recopilar información de productos para actualización de stock
            const itemsForStockUpdate = cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                size: item.size,
                hasSizes: item.hasSizes
            }));

            // Crear la orden
            const orderData = {
                userId: user?.uid || 'guest',
                email: user?.email || paymentData.email,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    fitType: item.fitType,
                    image: item.image
                })),
                shipping: shippingDetails,
                subtotal: getSubtotal(),
                shippingCost: getShippingCost(),
                total: getCartTotal(),
                status: 'paid',
                orderDate: new Date(),
                paymentId: token.id,
                paymentMethod: 'culqi',
                paymentDetails: {
                    token: token,
                    email: paymentData.email
                },
                notificationSent: false // Inicializar como no notificado
            };

            // Si hay un código de descuento, añadirlo a la orden
            if (discountCode) {
                orderData.discountCode = discountCode.code;
                orderData.discountAmount = discountAmount;
            }

            // Guardar la orden en Firestore
            await setDoc(doc(db, 'Orders', orderId), orderData);

            // Actualizar el stock de los productos
            await updateProductsStock(itemsForStockUpdate);

            // Enviar notificación por email
            try {
                // Enviar notificación por email
                console.log("Intentando enviar notificación por email...");
                const emailSent = await sendNewOrderNotification(orderData);

                // Actualizar el documento para marcar como notificado independientemente del resultado
                // (esto asegura que no se reintente si falla)
                await updateDoc(doc(db, 'Orders', orderId), {
                    notificationSent: true
                });

                if (emailSent) {
                    console.log("✅ Orden marcada como notificada y email enviado correctamente");
                } else {
                    console.warn("⚠️ Orden marcada como notificada pero hubo problemas al enviar el email");
                }
            } catch (emailError) {
                console.error("Error en el proceso de notificación:", emailError);
            }

            // Limpiar carrito y redirigir a la página de éxito
            clearCart();
            navigate(`/order-success/${orderId}`);
        } catch (error) {
            console.error('Error procesando la orden:', error);
            toast.error('Hubo un error al procesar tu pago con Culqi. Por favor, intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentError = (error) => {
        console.error('Error de pago:', error);

        // Diferentes mensajes según el tipo de error
        let errorMessage = 'Ocurrió un error al procesar el pago.';

        // Si es un error de Culqi con formato específico
        if (error.user_message) {
            errorMessage = error.user_message;
        }
        // Si es un Error estándar de JavaScript
        else if (error.message) {
            // No mostrar alerta si el usuario canceló el pago
            if (error.message === 'Proceso de pago cancelado') {
                console.log('Pago cancelado por el usuario');
                return;
            }
            errorMessage = error.message;
        }

        // Mostrar mensaje de error con alert (podrías usar un componente de toast o modal)
        alert(errorMessage);
    };

    // Validaciones
    if (!user) {
        return <Navigate to="/login" state={{ returnUrl: '/checkout' }} />;
    }

    if (cart.length === 0) {
        navigate('/cart');
        return null;
    }

    const total = getCartTotal();

    const shippingDetails = {
        fullName: formData.fullName,
        email: formData.email || user?.email,
        phone: formData.phone,
        shippingType: formData.shippingType,
        ...(formData.shippingType === 'lima' ? {
            district: formData.district,
            address: formData.address,
            locationLink: formData.locationLink
        } : {
            documentType: formData.documentType,
            documentNumber: formData.documentNumber,
            region: formData.region,
            province: formData.province,
            agencyDistrict: formData.agencyDistrict,
            agencyName: formData.agencyName
        })
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Asegurarnos de que siempre se prevenga el comportamiento por defecto

        // Para los demás pasos, no hacemos nada adicional
    };

    const handlePaymentSuccess = async (paymentResult) => {
        setLoading(true);
        try {
            console.log("Procesando pago exitoso con método:", formData.paymentMethod);

            // Recopilar información de productos para actualización de stock
            const itemsForStockUpdate = cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                size: item.size,
                hasSizes: item.hasSizes
            }));

            // Crear el documento de la orden
            const orderData = {
                userId: user?.uid || 'guest',
                email: user?.email || formData.email,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    fitType: item.fitType,
                    image: item.image
                })),
                shipping: shippingDetails,
                subtotal: getSubtotal(),
                shippingCost: getShippingCost(),
                total: getCartTotal(),
                status: 'paid',
                orderDate: new Date(),
                paymentId: paymentResult?.id || `payment-${Date.now()}`,
                paymentMethod: formData.paymentMethod,
                paymentDetails: paymentResult,
                notificationSent: false // Inicializar como no notificado
            };

            // Si hay un código de descuento, añadirlo a la orden
            if (discountCode) {
                orderData.discountCode = discountCode.code;
                orderData.discountAmount = discountAmount;
            }

            // Guardar la orden en Firestore
            await setDoc(doc(db, 'Orders', orderId), orderData);

            // Actualizar el stock de los productos
            const stockUpdateSuccess = await updateProductsStock(itemsForStockUpdate);

            if (!stockUpdateSuccess) {
                // Log the issue but don't stop the order process
                console.warn("Hubo problemas actualizando el stock, pero la orden se completó");
            }

            // Enviar notificación por email
            const emailSent = await sendNewOrderNotification(orderData);

            if (emailSent) {
                // Actualizar el documento para marcar como notificado
                await updateDoc(doc(db, 'Orders', orderId), {
                    notificationSent: true
                });
                console.log("Orden marcada como notificada");
            }

            console.log("Orden creada exitosamente:", orderId);

            // Limpiar carrito y redirigir a la página de éxito
            clearCart();
            navigate(`/order-success/${orderId}`);
        } catch (error) {
            console.error("Error procesando la orden:", error);
            toast.error("Hubo un error al procesar tu orden. Por favor, intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const sendNewOrderNotification = async (orderData) => {
        try {

            console.log("Enviando notificación de nuevo pedido por email");

            // Preparar los datos del pedido para la plantilla de email
            const formattedDate = new Date().toLocaleString('es-PE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const currentYear = new Date().getFullYear();

            // Formatear los productos para el email
            const itemsList = orderData.items?.map(item =>
                `- ${item.name} (Talla: ${item.size || 'N/A'}, Fit: ${item.fitType || 'Regular'}, Cantidad: ${item.quantity})`
            ).join('\n') || 'No hay productos en el pedido';

            // Determinar la dirección de envío según el tipo
            const shippingAddress = orderData.shipping?.shippingType === 'lima' ?
                `${orderData.shipping?.address || ''}, ${orderData.shipping?.district || ''} - Lima` :
                `${orderData.shipping?.region || ''}, ${orderData.shipping?.province || ''}, ${orderData.shipping?.agencyDistrict || ''} - Agencia: ${orderData.shipping?.agencyName || 'No especificada'}`;

            // Preparar la plantilla de datos
            const templateParams = {
                to_email: 'ermarlevh04@gmail.com',
                order_id: orderData.id,
                order_date: formattedDate,
                customer_name: orderData.shipping?.fullName || formData.fullName,
                customer_email: orderData.shipping?.email || formData.email,
                customer_phone: orderData.shipping?.phone || formData.phone,
                shipping_address: shippingAddress,
                shipping_type: orderData.shipping?.shippingType === 'lima' ? 'Lima Metropolitana' : 'Provincias',
                payment_method: orderData.paymentMethod || formData.paymentMethod,
                items_list: itemsList,
                order_total: typeof orderData.total === 'number' ? `S/. ${orderData.total.toFixed(2)}` : orderData.total || 'N/A',
                order_link: `https://endstore.web.app/admin/orders/${orderData.id}`,
                current_year: currentYear.toString()
            };

            console.log("Enviando correo con los siguientes parámetros:", templateParams);

            // Enviar el email usando EmailJS
            const result = await emailjs.send(
                'service_wht48oi', // Tu Service ID de EmailJS
                'template_utgtq6e', // Tu Template ID de EmailJS
                templateParams
            );

            console.log('Email enviado exitosamente:', result.text);
            return true;
        } catch (error) {
            console.error('Error enviando notificación por email:', error);
            return false;
        }
    };

    const goToCulqiForm = async () => {
        if (formIsValid) {
            try {
                setLoading(true);

                // Cargar e inicializar Culqi si aún no está cargado
                await loadCulqiScript();
                initCulqi();

                // Abrir directamente el formulario de Culqi
                const token = await processCardPayment({
                    amount: getCartTotal(),
                    title: 'End Store'
                });

                console.log('Token generado:', token.id);

                // Llamar a la Cloud Function para procesar el cargo
                try {
                    console.log('Enviando token a Cloud Function para procesar cargo...');

                    const cloudFunctionURL = 'https://us-central1-endstore.cloudfunctions.net/processPayment';

                    const response = await fetch(cloudFunctionURL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            token: token,
                            amount: getCartTotal(),
                            orderId: orderId,
                            email: formData.email || user?.email || shippingDetails.email,
                            description: `Compra en End Store - ${cart.length} productos`
                        }),
                    });

                    // Verificar respuesta
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Error del servidor (${response.status}): ${errorText}`);
                    }

                    const result = await response.json();

                    if (!result.success) {
                        throw new Error(result.error || 'Error procesando el pago en el servidor');
                    }

                    console.log('Cargo procesado con éxito:', result.charge);

                    // Continuar con el flujo de crear la orden, pero ahora con información de cargo
                    const itemsForStockUpdate = cart.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        size: item.size,
                        hasSizes: item.hasSizes
                    }));

                    // Crear la orden en Firestore
                    const orderData = {
                        id: orderId,
                        userId: user.uid,
                        items: cart.map(item => ({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            size: item.size,
                            fitType: item.fitType,
                            image: item.image,
                        })),
                        total: getCartTotal(),
                        subtotal: getSubtotal(),
                        discountCode: discountCode,
                        discountAmount: discountAmount,
                        shipping: {
                            cost: getShippingCost(),
                            ...shippingDetails
                        },
                        status: 'paid',
                        paymentId: result.charge.id, // ID del cargo, no del token
                        paymentMethod: 'culqi',
                        createdAt: serverTimestamp(),
                        paymentDetails: {
                            processor: 'Culqi',
                            email: formData.email || user?.email,
                            token: token.id,
                            charge: result.charge,
                            chargeId: result.charge.id
                        },
                        chargeCompleted: true
                    };

                    // Guardar la orden
                    await setDoc(doc(db, 'Orders', orderId), orderData);

                    // Actualizar el stock de productos
                    await updateProductsStock(itemsForStockUpdate);

                    // Crear documento de seguimiento
                    await setDoc(doc(db, 'tracking', orderId), {
                        orderId: orderId,
                        currentStatus: 'ACCEPTED',
                        updates: {
                            ACCEPTED: new Date().toISOString()
                        },
                        createdAt: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    });

                    // Enviar notificación por email
                    try {
                        const emailSent = await sendNewOrderNotification(orderData);

                        if (emailSent) {
                            // Actualizar el documento para marcar como notificado
                            await updateDoc(doc(db, 'Orders', orderId), {
                                notificationSent: true
                            });
                            console.log("✅ Orden marcada como notificada y email enviado correctamente");
                        } else {
                            console.warn("⚠️ Orden marcada como notificada pero hubo problemas al enviar el email");
                        }
                    } catch (emailError) {
                        console.error("Error en el proceso de notificación:", emailError);
                    }

                    // Limpiar carrito
                    await setDoc(doc(db, 'Carts', user.uid), { items: [] });
                    clearCart();

                    // Redireccionar a página de éxito
                    navigate(`/order-success/${orderId}`);

                } catch (cloudFunctionError) {
                    console.error('Error procesando cargo a través de Cloud Function:', cloudFunctionError);

                    // Mostrar error al usuario
                    toast.error('Hubo un problema al procesar el pago. Por favor, intenta nuevamente o usa otro método de pago.');

                    // Crear una orden con estado de pago fallido para referencia
                    const failedOrderData = {
                        id: orderId,
                        userId: user.uid,
                        items: cart.map(item => ({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            size: item.size,
                            fitType: item.fitType,
                            image: item.image,
                        })),
                        total: getCartTotal(),
                        subtotal: getSubtotal(),
                        discountCode: discountCode,
                        discountAmount: discountAmount,
                        shipping: {
                            cost: getShippingCost(),
                            ...shippingDetails
                        },
                        status: 'payment_failed',
                        paymentMethod: 'culqi',
                        createdAt: serverTimestamp(),
                        paymentDetails: {
                            processor: 'Culqi',
                            email: formData.email || user?.email,
                            token: token.id,
                            errorMessage: cloudFunctionError.message
                        },
                        chargeCompleted: false
                    };

                    // Guardar la orden fallida
                    await setDoc(doc(db, 'Orders', orderId), failedOrderData);
                }

            } catch (error) {
                console.error('Error al abrir formulario Culqi:', error);
                handlePaymentError(error);
            } finally {
                setLoading(false);
                closeCulqiModal(); // Asegurarse de cerrar el modal
                cleanupCulqi();
            }
        } else {
            alert('Por favor completa todos los campos requeridos');
        }
    };

    const handleCardFormSubmit = async (e) => {
        console.log("Iniciando procesamiento de tarjeta");

        // Si recibimos un evento, prevenimos el comportamiento default
        if (e && e.preventDefault) {
            e.preventDefault();
            console.log("Evento de formulario prevenido");
        }

        if (!validateCardForm()) {
            alert('Por favor completa correctamente todos los campos de la tarjeta');
            return;
        }

        setLoading(true);

        try {
            console.log('Procesando tarjeta:', paymentData);

            // Cargar e inicializar Culqi
            await loadCulqiScript();
            initCulqi();

            // Procesar el pago con tarjeta para obtener el token
            const token = await processCardPayment({
                amount: getCartTotal(),
                title: 'End Store'
            });

            // Si llegamos aquí, el pago fue tokenizado exitosamente
            console.log('Token generado:', token.id);

            try {
                // Recopilar información de productos para actualización de stock
                const itemsForStockUpdate = cart.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    size: item.size,
                    hasSizes: item.hasSizes
                }));

                // Crear la orden en Firestore
                const orderData = {
                    id: orderId,
                    userId: user.uid,
                    items: cart.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        size: item.size,
                        fitType: item.fitType,
                        image: item.image,
                    })),
                    total: getCartTotal(),
                    subtotal: getSubtotal(),
                    discountCode: discountCode,
                    discountAmount: discountAmount,
                    shipping: {
                        cost: getShippingCost(),
                        ...shippingDetails
                    },
                    status: 'paid',
                    paymentId: token.id,
                    paymentMethod: 'culqi',
                    createdAt: serverTimestamp(),
                    paymentDetails: {
                        processor: 'Culqi',
                        email: paymentData.email,
                        token: token,
                        tokenId: token.id
                    }
                };

                // Guardar la orden
                await setDoc(doc(db, 'Orders', orderId), orderData);

                // Actualizar el stock de productos
                await updateProductsStock(itemsForStockUpdate);

                // Crear documento de seguimiento
                await setDoc(doc(db, 'tracking', orderId), {
                    orderId: orderId,
                    currentStatus: 'ACCEPTED',
                    updates: {
                        ACCEPTED: new Date().toISOString()
                    },
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                });

                // Enviar notificación por email
                try {
                    const emailSent = await sendNewOrderNotification(orderData);

                    if (emailSent) {
                        // Actualizar el documento para marcar como notificado
                        await updateDoc(doc(db, 'Orders', orderId), {
                            notificationSent: true
                        });
                        console.log("✅ Orden marcada como notificada y email enviado correctamente");
                    } else {
                        console.warn("⚠️ Orden marcada como notificada pero hubo problemas al enviar el email");
                    }
                } catch (emailError) {
                    console.error("Error en el proceso de notificación:", emailError);
                }

                // Limpiar carrito
                await setDoc(doc(db, 'Carts', user.uid), { items: [] });
                clearCart();

                // Redireccionar a página de éxito
                navigate(`/order-success/${orderId}`);

            } catch (error) {
                console.error('Error al procesar la orden:', error);

                // Intentar guardar información del error para referencia
                try {
                    await updateDoc(doc(db, 'Orders', orderId), {
                        status: 'error',
                        errorDetails: {
                            message: error.message,
                            timestamp: serverTimestamp()
                        }
                    });
                } catch (updateError) {
                    console.error('Error guardando detalles de error:', updateError);
                }

                handlePaymentError(error);
            }

        } catch (error) {
            console.error('Error procesando tarjeta:', error);
            handlePaymentError(error);
        } finally {
            setLoading(false);
            cleanupCulqi();
        }
    };

    // Validar formulario de tarjeta
    const validateCardForm = () => {
        // Limpiamos los valores para validación
        const cardNumber = paymentData.cardNumber.replace(/\s+/g, '');
        const cardExpiry = paymentData.cardExpiry;
        const cardCvv = paymentData.cardCvv;
        const cardHolder = paymentData.cardHolder;
        const email = paymentData.email;

        // Validación del número de tarjeta
        if (!cardNumber || cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
            console.error('Error de validación: Número de tarjeta inválido');
            return false;
        }

        // Validación de fecha de expiración (formato MM/YY)
        if (!cardExpiry || !cardExpiry.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
            console.error('Error de validación: Fecha de expiración inválida');
            return false;
        }

        // Validación del CVV (3-4 dígitos)
        if (!cardCvv || !cardCvv.match(/^\d{3,4}$/)) {
            console.error('Error de validación: CVV inválido');
            return false;
        }

        // Validación del nombre del titular
        if (!cardHolder || cardHolder.trim().length < 5) {
            console.error('Error de validación: Nombre del titular inválido');
            return false;
        }

        // Validación del email
        if (!email || !email.includes('@') || !email.includes('.')) {
            console.error('Error de validación: Email inválido');
            return false;
        }

        return true;
    };



    // Formatear número de tarjeta al escribir
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    // Formatear fecha de expiración
    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

        if (v.length > 2) {
            return v.slice(0, 2) + '/' + v.slice(2, 4);
        }

        return v;
    };

    const goToPaymentStep = () => {
        if (formIsValid) {
            setCheckoutStep('payment');
        } else {
            alert('Por favor completa todos los campos requeridos');
        }
    };

    const goBackToShipping = () => {
        setCheckoutStep('shipping');
    };

    const goBackToPayment = () => {
        setCheckoutStep('payment');
    };



    // Variantes de animación para el slider
    const sliderVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
        exit: { y: -20, opacity: 0, transition: { duration: 0.3 } }
    };

    // Mostramos diferente contenido según el paso actual
    const renderStepContent = () => {
        return (
            <AnimatePresence mode="wait">
                {checkoutStep === 'shipping' ? (
                    <motion.div
                        key="shipping"
                        variants={sliderVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={styles.stepContent}
                    >
                        <h2>Información de Envío</h2>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        fullName: e.target.value
                                    })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        email: e.target.value
                                    })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Teléfono</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        phone: e.target.value
                                    })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Tipo de Envío</label>
                                <select
                                    value={formData.shippingType}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        shippingType: e.target.value
                                    })}
                                    className={styles.select}
                                >
                                    <option value="lima">Envío a Lima</option>
                                    <option value="province">Envío a Provincia</option>
                                </select>
                            </div>
                            {formData.shippingType === 'lima' ? (
                                <>
                                    <div className={styles.shippingNotice}>
                                        <i className="fas fa-truck"></i>
                                        <div className={styles.noticeContent}>
                                            <p>Entrega a domicilio en Lima Metropolitana:</p>
                                            <ul>
                                                <li>Tiempo estimado de entrega: 2-4 días hábiles</li>
                                                <li>Seguimiento disponible después de la confirmación del pago</li>
                                                <li>Recibirás actualizaciones del estado de tu pedido</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Reemplazar el input de distrito por un selector */}
                                    <div className={styles.formGroup}>
                                        <label>Distrito</label>
                                        <select
                                            value={formData.district}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                district: e.target.value
                                            })}
                                            required
                                            className={styles.select}
                                        >
                                            <option value="">Selecciona un distrito</option>
                                            {distritosLima.map((distrito) => (
                                                <option key={distrito.nombre} value={distrito.nombre}>
                                                    {distrito.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Dirección Exacta</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.address}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                address: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Link de Ubicación (opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.locationLink}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                locationLink: e.target.value
                                            })}
                                            placeholder="https://maps.google.com/..."
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.shippingNotice}>
                                        <i className="fas fa-box"></i>
                                        <div className={styles.noticeContent}>
                                            <p>Envío a Provincia:</p>
                                            <ul>
                                                <li>Envío a través de Olva Courier o Shalom, según disponibilidad</li>
                                                <li>Tiempo mínimo de entrega: 2 días hábiles (varía según destino)</li>
                                                <li>Código de seguimiento disponible una vez el pago sea confirmado</li>
                                                <li>El tracking se actualizará en tu perfil al dejar el pedido en agencia</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Tipo de Documento</label>
                                        <select
                                            value={formData.documentType}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                documentType: e.target.value
                                            })}
                                            className={styles.select}
                                        >
                                            <option value="dni">DNI</option>
                                            <option value="carnet">Carnet de Extranjería</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Número de Documento</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.documentNumber}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                documentNumber: e.target.value
                                            })}
                                        />
                                    </div>

                                    {/* Reemplazar los inputs de región y provincia por selectores */}
                                    <div className={styles.formGroup}>
                                        <label>Región</label>
                                        <select
                                            value={formData.region}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                region: e.target.value
                                            })}
                                            required
                                            className={styles.select}
                                        >
                                            <option value="">Selecciona una región</option>
                                            {regionesPeru.map((region) => (
                                                <option key={region.nombre} value={region.nombre}>
                                                    {region.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Provincia</label>
                                        <select
                                            value={formData.province}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                province: e.target.value
                                            })}
                                            required
                                            className={styles.select}
                                            disabled={!formData.region || provinciasDisponibles.length === 0}
                                        >
                                            <option value="">
                                                {!formData.region
                                                    ? "Primero selecciona una región"
                                                    : provinciasDisponibles.length === 0
                                                        ? "No hay provincias disponibles"
                                                        : "Selecciona una provincia"
                                                }
                                            </option>
                                            {provinciasDisponibles.map((provincia) => (
                                                <option key={provincia.nombre} value={provincia.nombre}>
                                                    {provincia.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Distrito de Agencia</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.agencyDistrict}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                agencyDistrict: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Nombre de Tienda (opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.agencyName}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                agencyName: e.target.value
                                            })}
                                            placeholder="Ej: Olva Courier/Shalom - Av. Principal"
                                        />
                                    </div>
                                </>
                            )}



                            <div className={styles.nextButtonContainer}>

                                <div className={styles.dataWarning}>
                                    <div className={styles.warningIcon}>
                                        <i className="fas fa-exclamation-triangle"></i>
                                    </div>
                                    <div className={styles.warningContent}>
                                        <h4>¡Importante! Verifica tus datos</h4>
                                        <p>Por favor, revisa cuidadosamente tu DNI, teléfono y dirección. Cualquier error en estos datos podría causar complicaciones en la entrega y retrasos que escapan de nuestro control. Recuerda que no podrás modificar esta información después de finalizar tu compra.</p>
                                    </div>
                                </div>
                                <button
                                    className={styles.continueButton}
                                    onClick={goToPaymentStep}
                                    disabled={!formIsValid}
                                >
                                    Continuar al Pago <i className="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : checkoutStep === 'payment' ? (
                    <motion.div
                        key="payment"
                        variants={sliderVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={styles.stepContent}
                    >
                        <div className={styles.stepHeader}>
                            <button className={styles.backButton} onClick={goBackToShipping}>
                                <i className="fas fa-arrow-left"></i> Volver a Envío
                            </button>
                            <h2>Método de Pago</h2>
                        </div>
                        <div className={styles.paymentMethods}>
                            <div className={styles.paymentOptions}>

                                <label className={`${styles.paymentOption} ${styles.disabledPaymentOption}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="googlepay"
                                        disabled={true}
                                    // Eliminamos el checked y onChange ya que estará deshabilitado
                                    />
                                    <span className={styles.radioButton}></span>
                                    <img
                                        src={imggpay}
                                        alt="Google Pay"
                                        className={styles.googlePayLogo}
                                    />
                                    Google Pay <span className={styles.comingSoonBadge}>Próximamente</span>
                                </label>

                                <label className={styles.paymentOption}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="culqi"
                                        checked={formData.paymentMethod === 'culqi'}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            paymentMethod: e.target.value
                                        })}
                                    />
                                    <span className={styles.radioButton}></span>
                                    <i className="fas fa-credit-card"></i>
                                    Culqi (Tarjeta de crédito o débito)
                                </label>

                            </div>

                            <div className={styles.paymentFormContainer}>
                                {formData.paymentMethod === 'card' && (
                                    <PayuButton
                                        amount={total}
                                        orderId={orderId}
                                        shipping={shippingDetails}
                                        onSuccess={handlePaymentSuccess}
                                        onError={handlePaymentError}
                                        cartItems={cart}
                                        disabled={!formIsValid}
                                    />
                                )}

                                {formData.paymentMethod === 'googlepay' && (
                                    <div className={styles.googlePayWrapper}>
                                        <GooglePayButton
                                            environment="PRODUCTION"
                                            buttonColor="black"
                                            buttonType="buy"
                                            buttonSizeMode="fill"
                                            paymentRequest={{
                                                apiVersion: 2,
                                                apiVersionMinor: 0,
                                                allowedPaymentMethods: [
                                                    {
                                                        type: 'CARD',
                                                        parameters: {
                                                            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                                            allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX', 'DISCOVER'],
                                                        },
                                                        tokenizationSpecification: {
                                                            type: 'PAYMENT_GATEWAY',
                                                            parameters: {
                                                                gateway: 'payu',
                                                                gatewayMerchantId: '1020877',
                                                            },
                                                        },
                                                    },
                                                ],
                                                merchantInfo: {
                                                    merchantId: 'BCR2DN4T765ZNFYT',
                                                    merchantName: 'End Store',
                                                },
                                                transactionInfo: {
                                                    totalPriceStatus: 'FINAL',
                                                    totalPriceLabel: 'Total',
                                                    totalPrice: total.toFixed(2),
                                                    currencyCode: 'PEN',
                                                    countryCode: 'PE',
                                                },
                                                shippingAddressRequired: false,
                                                emailRequired: true,
                                            }}
                                            onLoadPaymentData={async (paymentRequest) => {
                                                console.log('Google Pay success', paymentRequest);
                                                try {
                                                    setLoading(true);

                                                    const orderData = {
                                                        id: orderId,
                                                        userId: user.uid,
                                                        items: cart.map(item => ({
                                                            id: item.id,
                                                            name: item.name,
                                                            price: item.price,
                                                            quantity: item.quantity,
                                                            size: item.size,
                                                            fitType: item.fitType,
                                                            image: item.image,
                                                        })),
                                                        total: getCartTotal(),
                                                        subtotal: getSubtotal(),
                                                        discountCode: discountCode,
                                                        discountAmount: discountAmount,
                                                        shipping: {
                                                            cost: getShippingCost(),
                                                            ...shippingDetails
                                                        },
                                                        status: 'paid',
                                                        paymentId: `GPAY-${Date.now()}`,
                                                        paymentMethod: 'googlepay',
                                                        createdAt: serverTimestamp(),
                                                        paymentDetails: {
                                                            processor: 'GooglePay',
                                                            email: formData.email,
                                                            paymentMethodData: paymentRequest.paymentMethodData
                                                        }
                                                    };

                                                    await setDoc(doc(db, 'Orders', orderId), orderData);
                                                    await setDoc(doc(db, 'tracking', orderId), {
                                                        orderId: orderId,
                                                        currentStatus: 'ACCEPTED',
                                                        updates: {
                                                            ACCEPTED: new Date().toISOString()
                                                        },
                                                        createdAt: new Date().toISOString(),
                                                        lastUpdated: new Date().toISOString()
                                                    });
                                                    await setDoc(doc(db, 'Carts', user.uid), { items: [] });
                                                    clearCart();
                                                    navigate(`/order-success/${orderId}`);
                                                } catch (error) {
                                                    console.error('Error procesando pago de Google Pay:', error);
                                                    handlePaymentError(error);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            onError={handlePaymentError}
                                            existingPaymentMethodRequired={false}
                                            className={styles.googlePayButton}
                                        />
                                    </div>
                                )}

                                {formData.paymentMethod === 'culqi' && (
                                    <div className={styles.culqiWrapper}>
                                        {/* Eliminar este botón personalizado y solo usar el componente CulqiButton */}
                                        {/*
        <button
            className={styles.paymentButton}
            onClick={goToCulqiForm}
            disabled={loading}
        >
            {loading ? (
                <>Procesando Pago <div className={styles.miniSpinner}></div></>
            ) : (
                <>Pagar S/. {getCartTotal().toFixed(2)} con Culqi <i className="fas fa-lock"></i></>
            )}
        </button>
        */}
                                        <div className={styles.supportedMethods}>
                                            <div className={styles.supportedMethodsText}>
                                                Métodos aceptados:
                                            </div>
                                            <div className={styles.paymentMethodsIcons}>
                                                <i className="fab fa-cc-visa"></i>
                                                <i className="fab fa-cc-mastercard"></i>
                                                <i className="fab fa-cc-amex"></i>
                                                <i className="fas fa-mobile-alt"></i>
                                            </div>
                                        </div>

                                        <CulqiButton
                                            amount={total}
                                            orderId={orderId}
                                            email={formData.email || user?.email}
                                            onSuccess={handleCulqiSuccess}
                                            onError={handlePaymentError}
                                            disabled={loading || !formIsValid}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                ) : (
                    <motion.div
                        key="culqi-form"
                        variants={sliderVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={styles.stepContent}
                    >
                        <div className={styles.stepHeader}>
                            <button className={styles.backButton} onClick={goBackToPayment}>
                                <i className="fas fa-arrow-left"></i> Volver a Métodos de Pago
                            </button>
                            <h2>Pago con Tarjeta</h2>
                        </div>


                        <div className={styles.culqiFormContainer}>
                            <div className={styles.secureNotice}>
                                <i className="fas fa-lock"></i>
                                <span>Pago seguro con Culqi</span>
                            </div>

                            <div className={styles.culqiTrustMessage}>
                                <p>Ingresa los datos de tu tarjeta para completar el pago de forma segura. La información se transmite con encriptación SSL de 256 bits.</p>
                            </div>

                            {/* Vista previa de tarjeta en 3D */}
                            <div className={styles.cardContainer}>
                                <div className={`${styles.cardPreview} ${showBackOfCard ? styles.flip : ''}`}>
                                    <div className={styles.cardFront}>
                                        <div className={styles.cardTop}>
                                            <div className={styles.cardChip}></div>
                                            <div className={styles.cardBrand}>
                                                {paymentData.cardNumber.startsWith('4') ? (
                                                    <i className="fab fa-cc-visa"></i>
                                                ) : paymentData.cardNumber.startsWith('5') ? (
                                                    <i className="fab fa-cc-mastercard"></i>
                                                ) : paymentData.cardNumber.startsWith('3') ? (
                                                    <i className="fab fa-cc-amex"></i>
                                                ) : (
                                                    <i className="fas fa-credit-card"></i>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.cardNumber}>
                                            {paymentData.cardNumber || '•••• •••• •••• ••••'}
                                        </div>
                                        <div className={styles.cardDetails}>
                                            <div className={styles.cardHolder}>
                                                <span>TITULAR</span>
                                                {paymentData.cardHolder || 'Tu Nombre Aquí'}
                                            </div>
                                            <div className={styles.cardExpiry}>
                                                <span>EXPIRA</span>
                                                {paymentData.cardExpiry || 'MM/YY'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.cardBack}>
                                        <div className={styles.magneticStrip}></div>
                                        <div className={styles.cvvContainer}>
                                            <div className={styles.cvvTitle}>CVV</div>
                                            {paymentData.cardCvv || '•••'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form className={styles.cardForm}>
                                <div className={styles.formGroup}>
                                    <label>Número de Tarjeta</label>
                                    <div className={styles.cardNumberInput}>
                                        <input
                                            type="text"
                                            placeholder="4111 1111 1111 1111"
                                            value={paymentData.cardNumber}
                                            onChange={(e) => {
                                                const formatted = formatCardNumber(e.target.value);
                                                setPaymentData({
                                                    ...paymentData,
                                                    cardNumber: formatted
                                                });
                                            }}
                                            maxLength={19}
                                            required
                                            onFocus={() => setShowBackOfCard(false)}
                                        />
                                        <div className={styles.cardBrands}>
                                            <i className={`fab fa-cc-visa ${paymentData.cardNumber.startsWith('4') ? styles.active : ''}`}></i>
                                            <i className={`fab fa-cc-mastercard ${paymentData.cardNumber.startsWith('5') ? styles.active : ''}`}></i>
                                            <i className={`fab fa-cc-amex ${paymentData.cardNumber.startsWith('3') ? styles.active : ''}`}></i>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Fecha de Expiración</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            value={paymentData.cardExpiry}
                                            onChange={(e) => {
                                                const formatted = formatExpiry(e.target.value);
                                                setPaymentData({
                                                    ...paymentData,
                                                    cardExpiry: formatted
                                                });
                                            }}
                                            maxLength={5}
                                            required
                                            onFocus={() => setShowBackOfCard(false)}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>CVV</label>
                                        <div className={styles.cvvInput}>
                                            <input
                                                type="text"
                                                placeholder="123"
                                                value={paymentData.cardCvv}
                                                onChange={(e) => setPaymentData({
                                                    ...paymentData,
                                                    cardCvv: e.target.value.replace(/\D/g, '').substring(0, 4)
                                                })}
                                                maxLength={4}
                                                required
                                                onFocus={() => setShowBackOfCard(true)}
                                                onBlur={() => setShowBackOfCard(false)}
                                            />
                                            <div className={styles.tooltip}>
                                                <span className={styles.cvvHelp}>
                                                    <i className="fas fa-question-circle"></i>
                                                </span>
                                                <div className={styles.tooltipContent}>
                                                    Código de seguridad de 3 o 4 dígitos que se encuentra en el reverso de tu tarjeta.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Nombre del Titular</label>
                                    <input
                                        type="text"
                                        placeholder="Como aparece en la tarjeta"
                                        value={paymentData.cardHolder}
                                        onChange={(e) => setPaymentData({
                                            ...paymentData,
                                            cardHolder: e.target.value
                                        })}
                                        required
                                        onFocus={() => setShowBackOfCard(false)}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Correo Electrónico</label>
                                    <input
                                        type="email"
                                        placeholder="Para recibir el comprobante"
                                        value={paymentData.email}
                                        onChange={(e) => setPaymentData({
                                            ...paymentData,
                                            email: e.target.value
                                        })}
                                        required
                                        onFocus={() => setShowBackOfCard(false)}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className={styles.paymentButton}
                                    onClick={handleCardFormSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>Procesando Pago <div className={styles.miniSpinner}></div></>
                                    ) : (
                                        <>Pagar S/. {getCartTotal().toFixed(2)} <i className="fas fa-lock"></i></>
                                    )}
                                </button>

                                <div className={styles.securityInfo}>
                                    <div className={styles.securityItem}>
                                        <i className="fas fa-shield-alt"></i>
                                        <span>Pago seguro con SSL</span>
                                    </div>
                                    <div className={styles.securityItem}>
                                        <i className="fas fa-lock"></i>
                                        <span>Información protegida</span>
                                    </div>
                                    <div className={styles.securityItem}>
                                        <i className="fas fa-credit-card"></i>
                                        <span>No almacenamos tus datos</span>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    return (
        <>
            <AnnouncementBar />
            <div className={styles.checkoutPage}>
                <div className={styles.container}>
                    <div className={styles.content}>
                        <div className={styles.shippingSection}>
                            <div className={styles.checkoutSteps}>
                                <div className={`${styles.step} ${checkoutStep === 'shipping' ? styles.activeStep : styles.completedStep}`}>
                                    <div className={styles.stepCircle}>
                                        {checkoutStep !== 'shipping' ? <i className="fas fa-check"></i> : 1}
                                    </div>
                                    <span>Envío</span>
                                </div>
                                <div className={styles.stepConnector}></div>
                                <div className={`${styles.step} ${checkoutStep === 'payment' ? styles.activeStep : ''}`}>
                                    <div className={styles.stepCircle}>2</div>
                                    <span>Pago</span>
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                {renderStepContent()}
                            </form>
                        </div>

                        <div className={styles.orderSummary}>
                            <h2>Resumen del Pedido</h2>
                            <div className={styles.items}>
                                {cart.map((item) => (
                                    <div key={`${item.id}-${item.size}-${item.fitType}`} className={styles.item}>
                                        <img src={item.image} alt={item.name} />
                                        <div className={styles.itemInfo}>
                                            <h4>{item.name}</h4>
                                            <div className={styles.itemAttributes}>
                                                {item.size && (
                                                    <span className={styles.attribute}>
                                                        <i className="fas fa-ruler"></i>
                                                        Talla: {item.size}
                                                    </span>
                                                )}
                                                {item.fitType && (
                                                    <span className={styles.attribute}>
                                                        <i className="fas fa-tshirt"></i>
                                                        Fit: {item.fitType}
                                                    </span>
                                                )}
                                                <span className={styles.attribute}>
                                                    <i className="fas fa-times"></i>
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <p className={styles.itemPrice}>
                                                S/. {(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.summary}>
                                <div className={styles.summaryRow}>
                                    <span>Envío</span>
                                    {discountCode && discountCode.freeShipping ? (
                                        <span className={styles.freeShipping}>
                                            Gratis <span className={styles.discountApplied}>(Código aplicado)</span>
                                        </span>
                                    ) : getShippingCost() === 0 ? (
                                        <span className={styles.freeShipping}>Gratis</span>
                                    ) : (
                                        <span>S/. {SHIPPING_COST.toFixed(2)}</span>
                                    )}
                                </div>


                                {getShippingCost() > 0 && (
                                    <div className={styles.shippingInfo}>
                                        Te faltan S/. {(SHIPPING_THRESHOLD - getSubtotal()).toFixed(2)} para envío gratis
                                    </div>
                                )}
                                <div className={`${styles.summaryRow} ${styles.total}`}>
                                    <span>Total</span>
                                    <span>S/. {getCartTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Checkout;