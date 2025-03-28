import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../Firebase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from '../styles/LibroReclamaciones.module.css';
import AnnouncementBar from '../components/AnnouncementBar';

const COMPANY_INFO = {
    businessName: "EndStore",
    ruc: "10714564736",
    address: "Calle Galvez Silvera 138, Lima",
    email: "ermarlevh04@gmail.com",
    phone: "981 410 745"
};

const LibroReclamaciones = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('nuevo'); // 'nuevo' o 'consulta'
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupResult, setLookupResult] = useState(null);
    const [lookupError, setLookupError] = useState(null);
    const [lookupData, setLookupData] = useState({
        searchType: 'email', // 'email' o 'number'
        email: '',
        complaintNumber: ''
    });

    const [formData, setFormData] = useState({
        // Consumer data
        consumerType: 'natural',
        fullName: '',
        documentType: 'dni',
        documentNumber: '',
        email: '',
        phone: '',
        address: '',
        
        // Complaint details
        complaintType: 'reclamo',
        productType: 'producto',
        details: '',
        requestedSolution: '',
        orderNumber: '',
        purchaseDate: '',
        amount: '',
        description: '',
        
        // New fields for INDECOPI compliance
        acceptTerms: false,
        preferredResponseMethod: 'email',
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLookupInputChange = (e) => {
        const { name, value } = e.target;
        setLookupData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const required = [
            'fullName',
            'documentNumber',
            'email',
            'phone',
            'address',
            'description',
            'details',
            'requestedSolution'
        ];

        for (const field of required) {
            if (!formData[field] || formData[field].trim() === '') {
                toast.error(`Por favor complete el campo ${field}`);
                return false;
            }
        }

        if (formData.documentType === 'dni' && formData.documentNumber.length !== 8) {
            toast.error('El DNI debe tener 8 dígitos');
            return false;
        }

        if (!formData.email.includes('@')) {
            toast.error('Ingrese un email válido');
            return false;
        }

        if (!formData.acceptTerms) {
            toast.error('Debe aceptar los términos para continuar');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            // Generar un número de reclamo único
            const complaintNumber = `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            const complaintData = {
                ...formData,
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || formData.email,
                status: 'pendiente',
                createdAt: serverTimestamp(),
                complaintNumber: complaintNumber,
                responseDate: null,
                response: null,
            };

            // Asegurarse de usar la colección correcta
            const docRef = await addDoc(collection(db, 'Reclamos'), complaintData);
            
            console.log("Documento creado con ID:", docRef.id);
            
            toast.success('Su reclamo ha sido registrado exitosamente. Número de reclamo: ' + complaintNumber);
            
            // Reset form con todos los campos correctamente
            setFormData({
                consumerType: 'natural',
                fullName: '',
                documentType: 'dni',
                documentNumber: '',
                email: '',
                phone: '',
                address: '',
                complaintType: 'reclamo',
                productType: 'producto',
                details: '',
                requestedSolution: '',
                orderNumber: '',
                purchaseDate: '',
                amount: '',
                description: '',
                acceptTerms: false,
                preferredResponseMethod: 'email',
            });
            
        } catch (error) {
            console.error('Error al enviar reclamo:', error);
            toast.error('Error al registrar el reclamo: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLookupSubmit = async (e) => {
        e.preventDefault();
        setLookupResult(null);
        setLookupError(null);
        
        try {
            setLookupLoading(true);
            
            let reclamosQuery;
            
            if (lookupData.searchType === 'email') {
                if (!lookupData.email || !lookupData.email.includes('@')) {
                    setLookupError('Por favor ingrese un correo electrónico válido');
                    return;
                }
                reclamosQuery = query(
                    collection(db, 'Reclamos'), 
                    where('email', '==', lookupData.email)
                );
            } else {
                if (!lookupData.complaintNumber) {
                    setLookupError('Por favor ingrese un número de reclamo válido');
                    return;
                }
                reclamosQuery = query(
                    collection(db, 'Reclamos'), 
                    where('complaintNumber', '==', lookupData.complaintNumber)
                );
            }
            
            const querySnapshot = await getDocs(reclamosQuery);
            
            if (querySnapshot.empty) {
                setLookupError('No se encontraron reclamos con los datos proporcionados');
                return;
            }
            
            const reclamos = [];
            querySnapshot.forEach((doc) => {
                reclamos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            setLookupResult(reclamos);
            
        } catch (error) {
            console.error('Error al buscar reclamos:', error);
            setLookupError('Error al buscar reclamos: ' + error.message);
        } finally {
            setLookupLoading(false);
        }
    };

    // Función para formatear fechas
    const formatDate = (timestamp) => {
        if (!timestamp) return 'No disponible';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Traducir estado a español
    const translateStatus = (status) => {
        const statusMap = {
            'pendiente': 'Pendiente',
            'en_proceso': 'En Proceso',
            'resuelto': 'Resuelto',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || status;
    };

    // Obtener clase CSS según estado
    const getStatusClass = (status) => {
        const statusClassMap = {
            'pendiente': styles.statusPending,
            'en_proceso': styles.statusInProcess,
            'resuelto': styles.statusResolved,
            'cancelado': styles.statusCancelled
        };
        return statusClassMap[status] || '';
    };

    return (
        <>
            <AnnouncementBar />
            <div className={styles.libroReclamaciones}>
                <div className={styles.container}>
                    <h1>Libro de Reclamaciones</h1>
                    
                    {/* Tab Navigation */}
                    <div className={styles.tabNavigation}>
                        <button 
                            className={`${styles.tabButton} ${activeTab === 'nuevo' ? styles.active : ''}`}
                            onClick={() => setActiveTab('nuevo')}
                        >
                            <i className="fas fa-file-alt"></i> Nuevo Reclamo
                        </button>
                        <button 
                            className={`${styles.tabButton} ${activeTab === 'consulta' ? styles.active : ''}`}
                            onClick={() => setActiveTab('consulta')}
                        >
                            <i className="fas fa-search"></i> Consultar Estado
                        </button>
                    </div>
                    
                    {activeTab === 'nuevo' ? (
                        // Formulario de Nuevo Reclamo
                        <>
                            <p className={styles.subtitle}>
                                Conforme a lo establecido en el Código de Protección y Defensa del Consumidor
                                este es el Libro de Reclamaciones que permite a los consumidores presentar
                                sus quejas o reclamos sobre los productos y servicios ofrecidos.
                            </p>
                            <div className={styles.legalNotice}>
                                <i className="fas fa-book"></i>
                                <p>
                                    Este establecimiento cuenta con un Libro de Reclamaciones a su disposición. 
                                    Solicítelo para registrar su queja o reclamo.
                                </p>
                            </div>

                            <div className={styles.companyInfo}>
                                <h2>Datos del Proveedor</h2>
                                <div className={styles.infoGrid}>
                                    <div>
                                        <strong>Razón Social:</strong> {COMPANY_INFO.businessName}
                                    </div>
                                    <div>
                                        <strong>RUC:</strong> {COMPANY_INFO.ruc}
                                    </div>
                                    <div>
                                        <strong>Dirección:</strong> {COMPANY_INFO.address}
                                    </div>
                                    <div>
                                        <strong>Email:</strong> {COMPANY_INFO.email}
                                    </div>
                                    <div>
                                        <strong>Teléfono:</strong> {COMPANY_INFO.phone}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className={styles.form}>
                                {/* Consumer Information Section */}
                                <section className={styles.section}>
                                    <h2>Identificación del Consumidor</h2>

                                    <div className={styles.radioGroup}>
                                        <label>
                                            <input
                                                type="radio"
                                                name="consumerType"
                                                value="natural"
                                                checked={formData.consumerType === 'natural'}
                                                onChange={handleInputChange}
                                            />
                                            Persona Natural
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="consumerType"
                                                value="juridica"
                                                checked={formData.consumerType === 'juridica'}
                                                onChange={handleInputChange}
                                            />
                                            Persona Jurídica
                                        </label>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            placeholder="Nombre completo"
                                            required
                                        />

                                        <select
                                            name="documentType"
                                            value={formData.documentType}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="dni">DNI</option>
                                            <option value="ce">Carné de Extranjería</option>
                                            <option value="ruc">RUC</option>
                                        </select>

                                        <input
                                            type="text"
                                            name="documentNumber"
                                            value={formData.documentNumber}
                                            onChange={handleInputChange}
                                            placeholder="Número de documento"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Correo electrónico"
                                            required
                                        />

                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="Teléfono"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Dirección"
                                            required
                                        />
                                    </div>
                                </section>

                                {/* Complaint Details Section */}
                                <section className={styles.section}>
                                    <h2>Identificación del Bien Contratado</h2>
                                    <div className={styles.radioGroup}>
                                        <label>
                                            <input
                                                type="radio"
                                                name="complaintType"
                                                value="reclamo"
                                                checked={formData.complaintType === 'reclamo'}
                                                onChange={handleInputChange}
                                            />
                                            Reclamo (Disconformidad con el producto/servicio)
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                name="complaintType"
                                                value="queja"
                                                checked={formData.complaintType === 'queja'}
                                                onChange={handleInputChange}
                                            />
                                            Queja (Disconformidad con la atención)
                                        </label>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <input
                                            type="text"
                                            name="orderNumber"
                                            value={formData.orderNumber}
                                            onChange={handleInputChange}
                                            placeholder="Número de pedido (opcional)"
                                        />

                                        <input
                                            type="date"
                                            name="purchaseDate"
                                            value={formData.purchaseDate}
                                            onChange={handleInputChange}
                                            placeholder="Fecha de compra"
                                        />

                                        <input
                                            type="number"
                                            name="amount"
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            placeholder="Monto reclamado (opcional)"
                                            step="0.01"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <input
                                            type="text"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Descripción del producto/servicio"
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <textarea
                                            name="details"
                                            value={formData.details}
                                            onChange={handleInputChange}
                                            placeholder="Detalle de la reclamación"
                                            required
                                            rows="4"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <textarea
                                            name="requestedSolution"
                                            value={formData.requestedSolution}
                                            onChange={handleInputChange}
                                            placeholder="Solución que solicita"
                                            required
                                            rows="4"
                                        />
                                    </div>
                                </section>

                                <section className={styles.section}>
                                    <h2>Método de Respuesta Preferido</h2>
                                    <div className={styles.radioGroup}>
                                        <label>
                                            <input
                                                type="radio"
                                                name="preferredResponseMethod"
                                                value="email"
                                                checked={formData.preferredResponseMethod === 'email'}
                                                onChange={handleInputChange}
                                            />
                                            Correo Electrónico
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                disabled
                                                name="preferredResponseMethod"
                                                value="physical"
                                                checked={formData.preferredResponseMethod === 'physical'}
                                                onChange={handleInputChange}
                                            />
                                            Carta Física
                                        </label>
                                    </div>
                                </section>

                                <section className={styles.termsSection}>
                                    <div className={styles.checkbox}>
                                        <input
                                            type="checkbox"
                                            id="acceptTerms"
                                            name="acceptTerms"
                                            checked={formData.acceptTerms}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <label htmlFor="acceptTerms">
                                            Declaro que la información proporcionada es verdadera y acepto que la respuesta 
                                            sea remitida por el medio preferido en un plazo máximo de 30 días calendario.
                                        </label>
                                    </div>
                                    <p className={styles.legalText}>
                                        La formulación del reclamo no impide acudir a otras vías de solución de controversias 
                                        ni es requisito previo para interponer una denuncia ante el INDECOPI.
                                    </p>
                                    <p className={styles.legalText}>
                                        El proveedor conservará el registro de su reclamo por un período de 2 años.
                                    </p>
                                </section>

                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={loading || !formData.acceptTerms}
                                >
                                    {loading ? 'Enviando...' : 'Enviar Reclamación'}
                                </button>
                            </form>
                        </>
                    ) : (
                        // Sección de Consulta de Estado de Reclamos
                        <section className={styles.lookupSection}>
                            <div className={styles.lookupHeader}>
                                <h2>Consulta el Estado de tu Reclamo</h2>
                                <p className={styles.lookupDescription}>
                                    Ingresa tu correo electrónico o el número de reclamo que recibiste al registrar tu solicitud.
                                </p>
                            </div>
                            
                            <div className={styles.lookupCard}>
                                <form onSubmit={handleLookupSubmit} className={styles.lookupForm}>
                                    <div className={styles.lookupOptions}>
                                        <label className={lookupData.searchType === 'email' ? styles.activeOption : ''}>
                                            <input
                                                type="radio"
                                                name="searchType"
                                                value="email"
                                                checked={lookupData.searchType === 'email'}
                                                onChange={handleLookupInputChange}
                                            />
                                            <i className="fas fa-envelope"></i> Buscar por Email
                                        </label>
                                        <label className={lookupData.searchType === 'number' ? styles.activeOption : ''}>
                                            <input
                                                type="radio"
                                                name="searchType"
                                                value="number"
                                                checked={lookupData.searchType === 'number'}
                                                onChange={handleLookupInputChange}
                                            />
                                            <i className="fas fa-hashtag"></i> Buscar por Número de Reclamo
                                        </label>
                                    </div>
                                    
                                    {lookupData.searchType === 'email' ? (
                                        <div className={styles.lookupInput}>
                                            <div className={styles.inputIcon}>
                                                <i className="fas fa-envelope"></i>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={lookupData.email}
                                                    onChange={handleLookupInputChange}
                                                    placeholder="Ingresa tu correo electrónico"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.lookupInput}>
                                            <div className={styles.inputIcon}>
                                                <i className="fas fa-search"></i>
                                                <input
                                                    type="text"
                                                    name="complaintNumber"
                                                    value={lookupData.complaintNumber}
                                                    onChange={handleLookupInputChange}
                                                    placeholder="Ingresa tu número de reclamo (ej. REC-123456-789)"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <button 
                                        type="submit" 
                                        className={styles.lookupButton}
                                        disabled={lookupLoading}
                                    >
                                        {lookupLoading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i> Buscando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-search"></i> Consultar Estado
                                            </>
                                        )}
                                    </button>
                                </form>
                                
                                {lookupError && (
                                    <div className={styles.lookupError}>
                                        <i className="fas fa-exclamation-circle"></i>
                                        <p>{lookupError}</p>
                                    </div>
                                )}
                                
                                {lookupResult && lookupResult.length > 0 && (
                                    <div className={styles.lookupResults}>
                                        <h3>
                                            <i className="fas fa-file-alt"></i>
                                            {lookupResult.length === 1 ? 
                                                ' Reclamo encontrado:' : 
                                                ` ${lookupResult.length} Reclamos encontrados:`
                                            }
                                        </h3>
                                        
                                        {lookupResult.map(reclamo => (
                                            <div key={reclamo.id} className={styles.complaintCard}>
                                                <div className={styles.complaintCardHeader}>
                                                    <div className={styles.complaintNumber}>
                                                        <span>Nº de Reclamo:</span>
                                                        <strong>{reclamo.complaintNumber}</strong>
                                                    </div>
                                                    <div className={`${styles.complaintStatus} ${getStatusClass(reclamo.status)}`}>
                                                        {translateStatus(reclamo.status)}
                                                    </div>
                                                </div>
                                                
                                                <div className={styles.complaintCardBody}>
                                                    <div className={styles.complaintDetail}>
                                                        <span>Fecha del reclamo:</span>
                                                        <p>{formatDate(reclamo.createdAt)}</p>
                                                    </div>
                                                    <div className={styles.complaintDetail}>
                                                        <span>Tipo:</span>
                                                        <p>{reclamo.complaintType === 'reclamo' ? 'Reclamo' : 'Queja'}</p>
                                                    </div>
                                                    <div className={styles.complaintDetail}>
                                                        <span>Descripción:</span>
                                                        <p>{reclamo.description}</p>
                                                    </div>
                                                    <div className={styles.complaintDetail}>
                                                        <span>Detalles:</span>
                                                        <p>{reclamo.details}</p>
                                                    </div>
                                                    <div className={styles.complaintDetail}>
                                                        <span>Solución solicitada:</span>
                                                        <p>{reclamo.requestedSolution}</p>
                                                    </div>
                                                    
                                                    {reclamo.response && (
                                                        <>
                                                            <div className={styles.responseSection}>
                                                                <h4>Respuesta del proveedor:</h4>
                                                                <div className={styles.responseCard}>
                                                                    <p className={styles.responseText}>{reclamo.response}</p>
                                                                    {reclamo.responseDate && (
                                                                        <p className={styles.responseDate}>
                                                                            Respondido el: {formatDate(reclamo.responseDate)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                    
                                                    {reclamo.status === 'pendiente' && (
                                                        <div className={styles.pendingMessage}>
                                                            <i className="fas fa-clock"></i>
                                                            <p>Tu reclamo está siendo revisado. Te contactaremos a la brevedad.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
};

export default LibroReclamaciones;