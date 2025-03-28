
import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../Firebase';
import styles from '../../styles/Orders.module.css';
import AdminTrackingModal from '../../components/AdminTrackingModal';
import logo from '../../assets/imgs/end-logo2.png';



const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState('all'); // Cambiado a 'all' para mostrar todo por defecto
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [viewOrderDetails, setViewOrderDetails] = useState(null);
    const [error, setError] = useState(null);



    const checkCollections = async () => {
        try {
            console.log('Verificando colecciones disponibles en Firestore...');

            // Intentar con "orders" en minúscula por si acaso
            try {
                const ordersLowerRef = collection(db, 'orders');
                const ordersLowerDocs = await getDocs(ordersLowerRef);
                console.log(`Documentos en colección "orders" (minúscula): ${ordersLowerDocs.size}`);
            } catch (e) {
                console.log('Error al verificar "orders":', e);
            }

            // Verificar también otros nombres posibles
            const possibleNames = ['Orders', 'orders', 'Pedidos', 'pedidos', 'OrdersCollection'];

            for (const name of possibleNames) {
                try {
                    const ref = collection(db, name);
                    const docs = await getDocs(ref);
                    console.log(`Colección "${name}": ${docs.size} documentos`);

                    if (docs.size > 0) {
                        console.log(`Encontrados documentos en colección "${name}"`);
                        docs.forEach(doc => {
                            console.log(`- ID: ${doc.id}`);
                        });
                    }
                } catch (e) {
                    console.log(`Error al verificar colección "${name}":`, e);
                }
            }
        } catch (error) {
            console.error('Error verificando colecciones:', error);
        }
    };

    useEffect(() => {
        // Verificar colecciones primero
        checkCollections();

        // Luego intentar obtener órdenes
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Intentando obtener órdenes de la colección "Orders"...');

                // Obtener todos los documentos de la colección Orders sin ningún filtro
                const ordersRef = collection(db, 'Orders');
                console.log('Referencia a la colección creada:', ordersRef);

                // Verificar si la colección existe y tiene documentos
                const collectionCheck = await getDocs(ordersRef);
                console.log(`Documentos en la colección: ${collectionCheck.size}`);

                if (collectionCheck.empty) {
                    console.log('La colección "Orders" está vacía o no existe');
                    setOrders([]);
                    setLoading(false);
                    return;
                }

                // Mostrar IDs y datos para verificar
                collectionCheck.forEach(doc => {
                    console.log(`Documento encontrado - ID: ${doc.id}`);
                    console.log('Datos del documento:', JSON.stringify(doc.data()));
                });

                // Procesar los documentos 
                const ordersData = collectionCheck.docs.map(doc => {
                    const data = doc.data();
                    console.log(`Procesando documento ${doc.id}:`, data);

                    // Manejar el timestamp - puede venir en diferentes formatos
                    let orderDate;
                    if (data.createdAt) {
                        if (typeof data.createdAt.toDate === 'function') {
                            orderDate = data.createdAt.toDate();
                        } else if (data.createdAt.seconds) {
                            orderDate = new Date(data.createdAt.seconds * 1000);
                        } else {
                            orderDate = new Date(data.createdAt);
                        }
                    } else {
                        orderDate = new Date(); // fecha actual si no hay createdAt
                    }

                    return {
                        id: doc.id,
                        ...data,
                        orderDate,
                        status: data.status || 'PENDING'
                    };
                });

                console.log('Datos procesados de órdenes:', ordersData);
                setOrders(ordersData);

            } catch (error) {
                console.error('Error obteniendo órdenes:', error);
                // Mostrar más detalles sobre el error
                console.error('Detalles del error:', JSON.stringify(error, Object.getOwnPropertyNames(error).reduce((acc, key) => {
                    acc[key] = error[key];
                    return acc;
                }, {})));
                setError('Error al cargar las órdenes. Por favor, recarga la página.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);


    // Función para actualizar el estado de tracking cuando el modal lo actualiza
    const handleTrackingUpdate = (orderId, newStatus) => {
        console.log(`Actualizando estado de orden ${orderId} a ${newStatus} en componente Orders`);

        // Actualizar el estado local para reflejar el cambio
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId
                    ? { ...order, status: newStatus, lastUpdated: new Date() }
                    : order
            )
        );
    };
    // Función para manejar la visualización de detalles del pedido
    const handleViewOrderDetails = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (order) {
            setViewOrderDetails(order);
        }
    };

    const handlePrintShippingLabel = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // Crear una nueva ventana para imprimir
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, permite las ventanas emergentes para imprimir el rótulo de envío.');
            return;
        }

        // Convertir logo importado a URL
        const logoDataURL = logo; // Aquí usamos el logo importado directamente

        // Determinar el tipo de envío y la información de destino
        const isLima = order.shipping?.shippingType === 'lima';
        const destinationText = isLima ?
            `${order.shipping?.district || 'Lima'}` :
            `${order.shipping?.province || ''}, ${order.shipping?.region || ''}`;

        const addressDetails = isLima ?
            `${order.shipping?.address || ''}` :
            `Agencia: ${order.shipping?.agencyName || ''} - ${order.shipping?.agencyDistrict || ''}`;

        // HTML para el rótulo de envío con un diseño moderno
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Rótulo de Envío - ${order.id}</title>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Inter', sans-serif;
                        padding: 0;
                        background-color: #f8f9fa;
                    }
                    
                    .shipping-label {
                        width: 100%;
                        max-width: 380px;
                        margin: 20px auto;
                        background: white;
                        border: 1px solid #ddd;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        padding: 15px;
                        position: relative;
                        page-break-inside: avoid;
                    }
                    
                    .label-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #e10600;
                    }
                    
                    .logo {
                        height: 35px;
                        max-width: 120px;
                        object-fit: contain;
                    }
                    
                    .shipping-type {
                        background-color: #e10600;
                        color: white;
                        padding: 3px 8px;
                        border-radius: 3px;
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    
                    .order-id {
                        font-size: 14px;
                        color: #555;
                        margin-top: 4px;
                        text-align: right;
                    }
                    
                    .label-section {
                        margin: 15px 0;
                    }
                    
                    .section-title {
                        font-size: 11px;
                        text-transform: uppercase;
                        color: #888;
                        letter-spacing: 0.5px;
                        margin-bottom: 5px;
                    }
                    
                    .customer-name {
                        font-size: 16px;
                        font-weight: 600;
                        margin-bottom: 3px;
                    }
                    
                    .customer-details {
                        font-size: 13px;
                        color: #444;
                        line-height: 1.4;
                    }
                    
                    .destination {
                        font-size: 16px;
                        font-weight: 600;
                        color: #222;
                        margin-bottom: 3px;
                    }
                    
                    .address {
                        font-size: 13px;
                        color: #444;
                        line-height: 1.4;
                        margin-bottom: 5px;
                    }
                    
                    .barcode-section {
                        text-align: center;
                        margin: 15px 0;
                        padding: 10px;
                        background-color: #f8f9fa;
                        border-radius: 4px;
                    }
                    
                    .barcode-text {
                        font-family: monospace;
                        font-size: 14px;
                        letter-spacing: 2px;
                        margin-top: 5px;
                    }
                    
                    .label-footer {
                        border-top: 1px dashed #ddd;
                        margin-top: 15px;
                        padding-top: 10px;
                        font-size: 12px;
                        color: #777;
                        text-align: center;
                    }
                    
                    .shipping-note {
                        background-color: rgba(225, 6, 0, 0.08);
                        padding: 8px 12px;
                        border-radius: 4px;
                        font-size: 12px;
                        color: #e10600;
                        margin: 15px 0;
                        line-height: 1.4;
                    }
                    
                    .print-date {
                        font-size: 10px;
                        color: #999;
                        text-align: right;
                        margin-top: 10px;
                    }
                    
                    .cut-line {
                        border-top: 1px dashed #bbb;
                        margin: 30px 0;
                        position: relative;
                    }
                    
                    .cut-line:before {
                        content: '✂️';
                        position: absolute;
                        top: -10px;
                        left: -15px;
                        font-size: 12px;
                    }
                    
                    @media print {
                        body {
                            background: none;
                        }
                        
                        .shipping-label {
                            box-shadow: none;
                            margin: 0;
                            border: 1px solid #ddd;
                            page-break-after: always;
                        }
                        
                        .no-print {
                            display: none;
                        }
                        
                        .cut-line {
                            border-top: 1px dashed #999;
                        }
                        
                        .cut-line:before {
                            display: none;
                        }
                    }
                </style>
                <!-- Script para generar código de barras con JsBarcode -->
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            </head>
            <body>
                <div class="no-print" style="text-align: center; padding: 20px;">
                    <button onclick="window.print()" style="padding: 8px 16px; background: #e10600; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">Imprimir Rótulo</button>
                    <button onclick="window.close()" style="padding: 8px 16px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; margin-left: 10px; cursor: pointer;">Cerrar</button>
                </div>
                
                <div class="shipping-label">
                    <div class="label-header">
                        <img src="${logoDataURL}" class="logo" alt="EndStore Logo"
                             onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'140\\' height=\\'40\\' viewBox=\\'0 0 140 40\\'><defs><linearGradient id=\\'grad\\' x1=\\'0%\\' y1=\\'0%\\' x2=\\'100%\\' y2=\\'0%\\'><stop offset=\\'0%\\' style=\\'stop-color:%23e10600;stop-opacity:1\\' /><stop offset=\\'100%\\' style=\\'stop-color:%23ff3333;stop-opacity:1\\' /></linearGradient></defs><rect x=\\'5\\' y=\\'10\\' width=\\'30\\' height=\\'20\\' rx=\\'4\\' fill=\\'url(%23grad)\\' /><circle cx=\\'20\\' cy=\\'20\\' r=\\'8\\' fill=\\'white\\' opacity=\\'0.8\\'/><circle cx=\\'20\\' cy=\\'20\\' r=\\'5\\' fill=\\'url(%23grad)\\'/><text x=\\'40\\' y=\\'26\\' font-family=\\'Arial, sans-serif\\' font-weight=\\'bold\\' font-size=\\'17\\' fill=\\'%23222\\'>EndStore</text></svg>'">
                        <div>
                            <div class="shipping-type">${isLima ? 'Lima' : 'Provincias'}</div>
                            <div class="order-id">#${order.id}</div>
                        </div>
                    </div>
                    
                    <div class="label-section">
                        <div class="section-title">Destinatario</div>
                        <div class="customer-name">${order.shipping?.fullName || 'Cliente'}</div>
                        <div class="customer-details">
                            Tel: ${order.shipping?.phone || 'No disponible'}<br>
                            ${order.shipping?.email || order.paymentDetails?.email || 'Email no disponible'}
                        </div>
                    </div>
                    
                    <div class="label-section">
                        <div class="section-title">Destino</div>
                        <div class="destination">${destinationText}</div>
                        <div class="address">${addressDetails}</div>
                    </div>
                    
                    <div class="barcode-section">
                        <svg id="barcode"></svg>
                        <div class="barcode-text">${order.id}</div>
                    </div>
                    
                    
                    <div class="label-footer">
                        EndStore - www.endstore.pe<br>
                        Atención al cliente: WSP 981410745
                    </div>
                    
                    <div class="print-date">
                        Impreso el ${new Date().toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}
                    </div>
                </div>
                
                <div class="cut-line"></div>
                
                <!-- Copia duplicada del rótulo -->
                <div class="shipping-label">
                    <div style="position: absolute; top: 5px; right: 5px; font-size: 10px; color: #999; transform: rotate(45deg);">COPIA</div>
                    
                    <div class="label-header">
                        <img src="${logoDataURL}" class="logo" alt="EndStore Logo"
                             onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'140\\' height=\\'40\\' viewBox=\\'0 0 140 40\\'><defs><linearGradient id=\\'grad\\' x1=\\'0%\\' y1=\\'0%\\' x2=\\'100%\\' y2=\\'0%\\'><stop offset=\\'0%\\' style=\\'stop-color:%23e10600;stop-opacity:1\\' /><stop offset=\\'100%\\' style=\\'stop-color:%23ff3333;stop-opacity:1\\' /></linearGradient></defs><rect x=\\'5\\' y=\\'10\\' width=\\'30\\' height=\\'20\\' rx=\\'4\\' fill=\\'url(%23grad)\\' /><circle cx=\\'20\\' cy=\\'20\\' r=\\'8\\' fill=\\'white\\' opacity=\\'0.8\\'/><circle cx=\\'20\\' cy=\\'20\\' r=\\'5\\' fill=\\'url(%23grad)\\'/><text x=\\'40\\' y=\\'26\\' font-family=\\'Arial, sans-serif\\' font-weight=\\'bold\\' font-size=\\'17\\' fill=\\'%23222\\'>EndStore</text></svg>'">
                        <div>
                            <div class="shipping-type">${isLima ? 'Lima' : 'Provincias'}</div>
                            <div class="order-id">#${order.id}</div>
                        </div>
                    </div>
                    
                    <div class="label-section">
                        <div class="section-title">Destinatario</div>
                        <div class="customer-name">${order.shipping?.fullName || 'Cliente'}</div>
                        <div class="customer-details">
                            Tel: ${order.shipping?.phone || 'No disponible'}<br>
                            ${order.shipping?.email || order.paymentDetails?.email || 'Email no disponible'}
                        </div>
                    </div>
                    
                    <div class="label-section">
                        <div class="section-title">Destino</div>
                        <div class="destination">${destinationText}</div>
                        <div class="address">${addressDetails}</div>
                    </div>
                    
                    <div class="barcode-section">
                        <svg id="barcode2"></svg>
                        <div class="barcode-text">${order.id}</div>
                    </div>
                    
                    <div class="shipping-note">
                        <strong>IMPORTANTE:</strong> ${isLima ?
                'Entrega a domicilio. Contactar al cliente antes de realizar la entrega.' :
                'Envío a agencia. Por favor verificar los documentos del destinatario al momento de la entrega.'}
                    </div>
                    
                    <div class="label-footer">
                        EndStore - www.endstore.pe<br>
                        Atención al cliente: ventas@endstore.pe
                    </div>
                    
                    <div class="print-date">
                        Impreso el ${new Date().toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
                    </div>
                </div>
                
                <script>
                    // Generar los códigos de barras cuando la página termine de cargar
                    window.onload = function() {
                        try {
                            JsBarcode("#barcode", "${order.id}", {
                                format: "CODE128",
                                width: 1.5,     
                                height: 40,     
                                displayValue: false
                            });
                            
                            JsBarcode("#barcode2", "${order.id}", {
                                format: "CODE128",
                                width: 1.5,     
                                height: 40,     
                                displayValue: false
                            });
                        } catch (e) {
                            console.error("Error generando código de barras:", e);
                            // Mostrar texto alternativo en caso de error
                            document.querySelectorAll(".barcode-section").forEach(section => {
                                section.innerHTML = '<div style="font-family: monospace; font-size: 14px; padding: 10px;">${order.id}</div>';
                            });
                        }
                        
                        // Imprimir automáticamente después de cargar
                        setTimeout(function() {
                            window.focus();
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    // Reemplaza la función handlePrintOrder con esta versión optimizada

    const handlePrintOrder = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // Crear una nueva ventana para imprimir
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, permite las ventanas emergentes para imprimir los detalles del pedido.');
            return;
        }

        const logoDataURL = logo;

        // Optimizar la lista de productos para ocupar menos espacio
        const orderItems = order.items?.map((item, index) =>
            `<div class="product-item">
            <div class="product-image">
                <img src="${item.image || ''}" alt="${item.name || 'Producto'}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'50\\' height=\\'50\\' viewBox=\\'0 0 50 50\\'><rect width=\\'50\\' height=\\'50\\' fill=\\'%23f0f0f0\\'/><text x=\\'50%\\' y=\\'50%\\' font-size=\\'8\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23aaa\\'>Sin imagen</text></svg>'">
            </div>
            <div class="product-details">
                <span class="product-name">${item.name || 'Producto'}</span>
                <span class="product-meta">Talla: ${item.size || 'N/A'} | Cant: ${item.quantity || 1} | <strong>S/. ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</strong></span>
            </div>
        </div>`
        ).join('') || '<div class="empty-products">No hay productos en este pedido</div>';

        // Determinar qué información de envío mostrar según el tipo
        const shippingInfo = order.shipping?.shippingType === 'lima' ?
            `<strong>Dirección:</strong> ${order.shipping.address || ''}, ${order.shipping.district || ''} | <strong>Tel:</strong> ${order.shipping.phone || 'N/A'}` :
            `<strong>Región:</strong> ${order.shipping?.region || ''}, <strong>Provincia:</strong> ${order.shipping?.province || ''} | <strong>Agencia:</strong> ${order.shipping?.agencyName || ''} (${order.shipping?.agencyDistrict || ''}) | <strong>Tel:</strong> ${order.shipping?.phone || 'N/A'}`;

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Pedido #${order.id}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', sans-serif;
                    line-height: 1.4;
                    color: #333;
                    font-size: 10px;
                }
                
                .container {
                    max-width: 100%;
                    margin: 0;
                    background: white;
                }
                
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    background-color: #f8f8f8;
                    border-bottom: 2px solid #e10600;
                }
                
                .logo-container {
                    flex: 0 0 auto;
                }
                
                .logo {
                    height: 30px;
                    object-fit: contain;
                }
                
                .order-title {
                    flex: 1;
                    text-align: right;
                }
                
                .order-title h1 {
                    font-size: 16px;
                    color: #e10600;
                    margin: 0;
                }
                
                .order-title p {
                    font-size: 10px;
                    color: #777;
                    margin: 2px 0 0;
                }
                
                .order-meta {
                    display: flex;
                    flex-wrap: wrap;
                    padding: 8px 20px;
                    background-color: #f0f0f0;
                    font-size: 10px;
                }
                
                .meta-item {
                    margin-right: 20px;
                }
                
                .meta-item:last-child {
                    margin-right: 0;
                }
                
                .meta-label {
                    font-weight: 600;
                    color: #555;
                    margin-right: 5px;
                }
                
                .order-status {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 12px;
                    font-size: 9px;
                    font-weight: 600;
                    color: white;
                    background-color: #4CAF50;
                    text-transform: uppercase;
                }
                
                .two-column {
                    display: flex;
                    padding: 12px 20px 0;
                }
                
                .column {
                    flex: 1;
                    padding-right: 15px;
                }
                
                .column:last-child {
                    padding-right: 0;
                    padding-left: 15px;
                    border-left: 1px solid #eee;
                }
                
                .section {
                    margin-bottom: 15px;
                }
                
                .section-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 5px;
                    padding-bottom: 3px;
                    border-bottom: 1px solid #eee;
                }
                
                .info-row {
                    display: flex;
                    margin-bottom: 3px;
                    font-size: 10px;
                }
                
                .info-label {
                    flex: 0 0 70px;
                    font-weight: 500;
                    color: #666;
                }
                
                .info-value {
                    flex: 1;
                }
                
                .shipping-info {
                    background-color: #f9f9f9;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 10px;
                    line-height: 1.5;
                }
                
                .products-container {
                    margin-top: 12px;
                    border: 1px solid #eee;
                }
                
                .products-header {
                    display: flex;
                    background-color: #f0f0f0;
                    font-weight: 600;
                    font-size: 10px;
                    padding: 6px 10px;
                }
                
                .header-item {
                    flex: 1;
                }
                
                .header-item:first-child {
                    flex: 0 0 50px;
                }
                
                .product-items {
                    padding: 8px 10px;
                    max-height: 220px; /* Límite de altura para la lista de productos */
                    overflow-y: auto;
                }
                
                .product-item {
                    display: flex;
                    padding: 5px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .product-item:last-child {
                    border-bottom: none;
                }
                
                .product-image {
                    width: 40px;
                    height: 40px;
                    margin-right: 10px;
                    overflow: hidden;
                    border-radius: 3px;
                    border: 1px solid #eee;
                }
                
                .product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .product-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                
                .product-name {
                    font-weight: 600;
                    margin-bottom: 2px;
                    font-size: 10px;
                }
                
                .product-meta {
                    font-size: 9px;
                    color: #666;
                }
                
                .summary {
                    margin-top: 12px;
                    padding: 8px 10px;
                    background-color: #f8f8f8;
                    border-radius: 4px;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 3px;
                    font-size: 10px;
                }
                
                .summary-row:last-child {
                    margin-bottom: 0;
                    margin-top: 5px;
                    padding-top: 5px;
                    border-top: 1px solid #ddd;
                    font-weight: 600;
                }
                
                .summary-label {
                    color: #666;
                }
                
                .total-row {
                    font-size: 12px;
                    color: #e10600;
                    font-weight: 700;
                }
                
                .barcode-container {
                    text-align: center;
                    margin: 15px 0 5px;
                }
                
                .footer {
                    text-align: center;
                    font-size: 9px;
                    color: #888;
                    margin-top: 10px;
                    border-top: 1px solid #eee;
                    padding-top: 10px;
                }
                
                .print-date {
                    text-align: right;
                    font-size: 8px;
                    color: #aaa;
                    margin-top: 5px;
                }
                
                .empty-products {
                    text-align: center;
                    padding: 10px;
                    color: #888;
                    font-style: italic;
                    font-size: 10px;
                }
                
                .actions {
                    display: flex;
                    justify-content: center;
                    padding: 10px;
                    gap: 10px;
                }
                
                .btn {
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-weight: 500;
                    font-size: 12px;
                    cursor: pointer;
                    border: none;
                }
                
                .btn-primary {
                    background-color: #e10600;
                    color: white;
                }
                
                .btn-secondary {
                    background-color: #f0f0f0;
                    color: #333;
                    border: 1px solid #ddd;
                }
                
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    
                    body {
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        font-size: 10px;
                    }
                    
                    .container {
                        width: 100%;
                        margin: 0;
                        box-shadow: none;
                    }
                    
                    @page {
                        size: letter portrait;
                        margin: 0.5cm;
                    }
                }
            </style>
            
            <!-- Script para generar código de barras con JsBarcode -->
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
            <div class="no-print actions">
                <button class="btn btn-primary" onclick="window.print()">Imprimir Pedido</button>
                <button class="btn btn-secondary" onclick="window.close()">Cerrar</button>
            </div>
            
            <div class="container">
                <div class="header">
                    <div class="logo-container">
                        <img src="${logoDataURL}" class="logo" alt="EndStore Logo"
                            onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'120\\' height=\\'30\\' viewBox=\\'0 0 120 30\\'><text x=\\'0\\' y=\\'20\\' font-size=\\'20\\' font-weight=\\'bold\\' font-family=\\'Arial\\' fill=\\'%23e10600\\'>EndStore</text></svg>'">
                    </div>
                    <div class="order-title">
                        <h1>Pedido #${order.id}</h1>
                        <p>${formatDate(order.orderDate)}</p>
                    </div>
                </div>
                
                <div class="order-meta">
                    <div class="meta-item">
                        <span class="meta-label">Estado:</span>
                        <span class="order-status">${order.status.toUpperCase()}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Cliente:</span>
                        <span>${order.shipping?.fullName || 'No disponible'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Pago:</span>
                        <span>${order.paymentMethod === 'culqi' ? 'Tarjeta' : order.paymentMethod === 'yape' ? 'Yape' : 'En línea'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Email:</span>
                        <span>${order.shipping?.email || order.paymentDetails?.email || 'No disponible'}</span>
                    </div>
                </div>
                
                <div class="two-column">
                    <div class="column">
                        <div class="section">
                            <h2 class="section-title">Información de Envío</h2>
                            <div class="shipping-info">
                                <p><strong>Tipo:</strong> ${order.shipping?.shippingType === 'lima' ? 'Lima Metropolitana' : 'Provincias'}</p>
                                <p>${shippingInfo}</p>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h2 class="section-title">Resumen</h2>
                            <div class="summary">
                                <div class="summary-row">
                                    <span class="summary-label">Subtotal</span>
                                    <span>S/. ${(order.subtotal || 0).toFixed(2)}</span>
                                </div>
                                
                                ${order.discountAmount > 0 ? `
                                <div class="summary-row">
                                    <span class="summary-label">Descuento</span>
                                    <span>- S/. ${(order.discountAmount || 0).toFixed(2)}</span>
                                </div>
                                ` : ''}
                                
                                <div class="summary-row">
                                    <span class="summary-label">Envío</span>
                                    <span>S/. ${(order.shipping?.cost || 0).toFixed(2)}</span>
                                </div>
                                
                                <div class="summary-row total-row">
                                    <span class="summary-label">Total</span>
                                    <span>S/. ${(order.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="column">
                        <div class="section">
                            <h2 class="section-title">Productos</h2>
                            <div class="products-container">
                                <div class="product-items">
                                    ${orderItems}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="barcode-container">
                    <svg id="barcode"></svg>
                </div>
                
                <div class="footer">
                    <p>Gracias por comprar en EndStore. Si tienes alguna pregunta, contáctanos en WhatsApp 981419745</p>
                    
                    <div class="print-date">
                        Impreso el ${new Date().toLocaleDateString('es-PE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}
                    </div>
                </div>
            </div>
            
            <script>
                // Generar el código de barras cuando la página termine de cargar
                window.onload = function() {
                    try {
                        JsBarcode("#barcode", "${order.id}", {
                            format: "CODE128",
                            width: 1.0,
                            height: 30,
                            displayValue: true,
                            fontSize: 9,
                            marginTop: 3,
                            marginBottom: 3,
                            font: "monospace"
                        });
                    } catch (e) {
                        console.error("Error generando código de barras:", e);
                        document.querySelector(".barcode-container").innerHTML = 
                            '<div style="font-family: monospace; font-size: 11px; text-align: center;">${order.id}</div>';
                    }
                    
                    // Imprimir automáticamente después de cargar
                    setTimeout(function() {
                        window.focus();
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const filteredOrders = orders.filter(order => {
        // Buscar en los campos principales (insensible a mayúsculas/minúsculas)
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((order.shipping?.fullName || '') + '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((order.shipping?.email || '') + '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((order.paymentDetails?.email || '') + '').toLowerCase().includes(searchTerm.toLowerCase());

        // Comprobar el estado (insensible a mayúsculas/minúsculas)
        const orderStatusLower = ((order.status || '') + '').toLowerCase();
        const filterStatusLower = filterStatus.toLowerCase();

        const matchesStatus =
            filterStatus === 'all' ||
            orderStatusLower.includes(filterStatusLower);

        // Date range filter - verifica si orderDate es una fecha válida
        let matchesDate = true;

        if (order.orderDate instanceof Date && !isNaN(order.orderDate)) {
            const orderDate = order.orderDate;
            const now = new Date();
            const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);

            matchesDate =
                (dateRange === 'today' && daysDiff < 1) ||
                (dateRange === 'last7' && daysDiff <= 7) ||
                (dateRange === 'last30' && daysDiff <= 30) ||
                (dateRange === 'last90' && daysDiff <= 90) ||
                dateRange === 'all';
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusBadgeClass = (status) => {
        // Asegurar que status es un string y convertir a minúsculas
        const statusLower = ((status || '') + '').toLowerCase();

        // Mapa de estados a clases de estilo
        if (statusLower.includes('paid') || statusLower.includes('pago')) {
            return `${styles.statusBadge} ${styles.statusPaid}`;
        } else if (statusLower.includes('pend') || statusLower.includes('process')) {
            return `${styles.statusBadge} ${styles.statusPending}`;
        } else if (statusLower.includes('ship') || statusLower.includes('envi')) {
            return `${styles.statusBadge} ${styles.statusShipped}`;
        } else if (statusLower.includes('cancel') || statusLower.includes('canc')) {
            return `${styles.statusBadge} ${styles.statusCancelled}`;
        } else {
            // Estado desconocido
            return `${styles.statusBadge}`;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Fecha no disponible';

        const date = new Date(dateString);
        if (isNaN(date)) return 'Fecha no válida';

        return date.toLocaleString('es-PE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Nuevo componente modal para ver detalles del pedido
    const OrderDetailsModal = ({ order, onClose }) => {
        if (!order) return null;

        return (
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <h2>Detalles del Pedido #{order.id}</h2>
                        <button className={styles.closeButton} onClick={onClose}>
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className={styles.modalBody}>
                        <div className={styles.orderDetailSection}>
                            <h3>Información del Cliente</h3>
                            <div className={styles.orderDetailRow}>
                                <span className={styles.label}>Nombre:</span>
                                <span className={styles.value}>{order.shipping?.fullName || 'No disponible'}</span>
                            </div>
                            <div className={styles.orderDetailRow}>
                                <span className={styles.label}>Email:</span>
                                <span className={styles.value}>
                                    {order.shipping?.email || order.paymentDetails?.email || 'No disponible'}
                                </span>
                            </div>
                            <div className={styles.orderDetailRow}>
                                <span className={styles.label}>Teléfono:</span>
                                <span className={styles.value}>{order.shipping?.phone || 'No disponible'}</span>
                            </div>
                        </div>

                        <div className={styles.orderDetailSection}>
                            <h3>Información de Envío</h3>
                            <div className={styles.orderDetailRow}>
                                <span className={styles.label}>Tipo:</span>
                                <span className={styles.value}>
                                    {order.shipping?.shippingType === 'lima' ? 'Lima Metropolitana' : 'Provincias'}
                                </span>
                            </div>

                            {order.shipping?.shippingType === 'lima' ? (
                                <>
                                    <div className={styles.orderDetailRow}>
                                        <span className={styles.label}>Dirección:</span>
                                        <span className={styles.value}>{order.shipping.address || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.orderDetailRow}>
                                        <span className={styles.label}>Distrito:</span>
                                        <span className={styles.value}>{order.shipping.district || 'No disponible'}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={styles.orderDetailRow}>
                                        <span className={styles.label}>Región:</span>
                                        <span className={styles.value}>{order.shipping?.region || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.orderDetailRow}>
                                        <span className={styles.label}>Provincia:</span>
                                        <span className={styles.value}>{order.shipping?.province || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.orderDetailRow}>
                                        <span className={styles.label}>Agencia:</span>
                                        <span className={styles.value}>{order.shipping?.agencyName || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.orderDetailRow}>
                                        <span className={styles.label}>Distrito Agencia:</span>
                                        <span className={styles.value}>{order.shipping?.agencyDistrict || 'No disponible'}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={styles.orderDetailSection}>
                            <h3>Productos</h3>
                            <div className={styles.orderProductList}>
                                {(order.items || []).map((item, index) => (
                                    <div key={index} className={styles.orderProduct}>
                                        <div className={styles.productImage}>
                                            <img src={item.image || '/placeholder.png'} alt={item.name} />
                                        </div>
                                        <div className={styles.productInfo}>
                                            <h4>{item.name}</h4>
                                            <div className={styles.productMeta}>
                                                <span>Talla: {item.size}</span>
                                                <span>Cantidad: {item.quantity}</span>
                                                <span>Precio: S/. {(item.price || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.orderDetailSection}>
                            <h3>Resumen de Pago</h3>
                            <div className={styles.orderSummary}>
                                <div className={styles.orderDetailRow}>
                                    <span className={styles.label}>Subtotal:</span>
                                    <span className={styles.value}>S/. {(order.subtotal || 0).toFixed(2)}</span>
                                </div>

                                {order.discountAmount > 0 && (
                                    <div className={styles.orderDetailRow}>
                                        <span className={styles.label}>Descuento:</span>
                                        <span className={styles.value}>-S/. {(order.discountAmount || 0).toFixed(2)}</span>
                                    </div>
                                )}

                                <div className={styles.orderDetailRow}>
                                    <span className={styles.label}>Costo de envío:</span>
                                    <span className={styles.value}>S/. {(order.shipping?.cost || 0).toFixed(2)}</span>
                                </div>

                                <div className={`${styles.orderDetailRow} ${styles.totalRow}`}>
                                    <span className={styles.label}>Total:</span>
                                    <span className={styles.value}>S/. {(order.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.orderDetailSection}>
                            <h3>Método de Pago</h3>
                            <div className={styles.orderDetailRow}>
                                <span className={styles.label}>Método:</span>
                                <span className={styles.value}>
                                    {order.paymentMethod === 'culqi' ? 'Tarjeta de crédito/débito' :
                                        order.paymentMethod === 'yape' ? 'Yape' : 'Pago en línea'}
                                </span>
                            </div>

                            {order.paymentDetails && (
                                <div className={styles.orderDetailRow}>
                                    <span className={styles.label}>Detalles:</span>
                                    <span className={styles.value}>
                                        {order.paymentDetails.token?.type === 'card' ? (
                                            <span>Tarjeta terminada en {order.paymentDetails.token?.last_four || '****'}</span>
                                        ) : (
                                            <span>ID de transacción: {order.paymentId || 'No disponible'}</span>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button className={styles.labelButton} onClick={() => handlePrintShippingLabel(order.id)}>
                            <i className="fas fa-tag"></i> Rótulo de Envío
                        </button>
                        <button className={styles.printButton} onClick={() => handlePrintOrder(order.id)}>
                            <i className="fas fa-print"></i> Imprimir
                        </button>
                        <button className={styles.closeModalButton} onClick={onClose}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.ordersPage}>
            <header className={styles.header}>
                <h1>Pedidos</h1>
                <div className={styles.headerActions}>
                    <button className={styles.exportButton}>
                        <i className="fas fa-download"></i>
                        Exportar
                    </button>
                </div>
            </header>

            <div className={styles.filters}>
                <div className={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Buscar por ID de pedido o cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="paid">Pagado</option>
                        <option value="pending">Pendiente</option>
                        <option value="shipped">Enviado</option>
                        <option value="cancelled">Cancelado</option>
                    </select>

                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="all">Todas las fechas</option>
                        <option value="today">Hoy</option>
                        <option value="last7">Últimos 7 días</option>
                        <option value="last30">Últimos 30 días</option>
                        <option value="last90">Últimos 90 días</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Cargando pedidos...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className={styles.noResults}>
                    <i className="fas fa-search"></i>
                    <h3>No se encontraron pedidos</h3>
                    <p>Intenta con otros criterios de búsqueda</p>
                </div>
            ) : (
                <div className={styles.ordersTable}>
                    <div className={styles.tableHeader}>
                        <div className={styles.column}>Pedido</div>
                        <div className={styles.column}>Fecha</div>
                        <div className={styles.column}>Cliente</div>
                        <div className={styles.column}>Total</div>
                        <div className={styles.column}>Estado</div>
                        <div className={styles.column}>Acciones</div>
                    </div>


                    {filteredOrders.map(order => (
                        <div key={order.id} className={styles.orderRow}>
                            <div className={styles.column}>{order.id}</div>
                            <div className={styles.column}>
                                {order.orderDate instanceof Date && !isNaN(order.orderDate)
                                    ? formatDate(order.orderDate)
                                    : 'Fecha no disponible'}
                            </div>
                            <div className={styles.column}>
                                <div className={styles.customerInfo}>
                                    <span className={styles.customerName}>
                                        {order.shipping?.fullName ||
                                            order.paymentDetails?.name ||
                                            order.customer?.name ||
                                            'Cliente'}
                                    </span>
                                    <span className={styles.customerEmail}>
                                        {order.shipping?.email ||
                                            order.paymentDetails?.email ||
                                            order.customer?.email ||
                                            'Email no disponible'}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.column}>
                                S/. {(order.total || 0).toFixed(2)}
                            </div>
                            <div className={styles.column}>
                                <span className={getStatusBadgeClass(order.status)}>
                                    {((order.status || 'PENDING') + '').toUpperCase()}
                                </span>
                            </div>
                            <div className={styles.column}>
                                <div className={styles.actionButtons}>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => handleViewOrderDetails(order.id)}
                                        title="Ver detalles"
                                    >
                                        <i className="fas fa-eye"></i>
                                    </button>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => setSelectedOrderId(order.id)}
                                        title="Gestionar envío"
                                    >
                                        <i className="fas fa-truck"></i>
                                    </button>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => handlePrintOrder(order.id)}
                                        title="Imprimir pedido"
                                    >
                                        <i className="fas fa-print"></i>
                                    </button>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => handlePrintShippingLabel(order.id)}
                                        title="Imprimir rótulo"
                                    >
                                        <i className="fas fa-tag"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de seguimiento */}
            {selectedOrderId && (
                <AdminTrackingModal
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                    onUpdate={handleTrackingUpdate}
                />
            )}

            {/* Modal de detalles del pedido */}
            {viewOrderDetails && (
                <OrderDetailsModal
                    order={viewOrderDetails}
                    onClose={() => setViewOrderDetails(null)}
                />
            )}
        </div>
    );
};

export default Orders;