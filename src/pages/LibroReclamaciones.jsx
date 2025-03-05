import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
        const { name, value } = e.target;
        setFormData(prev => ({
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
            if (!formData[field]) {
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

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);

            const complaintData = {
                ...formData,
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || formData.email,
                status: 'pending',
                createdAt: serverTimestamp(),
                complaintNumber: `REC-${Date.now()}`,
            };

            await addDoc(collection(db, 'Complaints'), complaintData);

            toast.success('Su reclamo ha sido registrado exitosamente');
            // Reset form
            setFormData({
                consumerType: 'natural',
                fullName: '',
                documentType: 'dni',
                documentNumber: '',
                email: '',
                phone: '',
                address: '',
                parentFullName: '',
                parentDocumentNumber: '',
                amount: '',
                description: '',
                complaintType: 'reclamo',
                productType: 'producto',
                details: '',
                requestedSolution: '',
                orderNumber: '',
                purchaseDate: '',
            });
        } catch (error) {
            console.error('Error submitting complaint:', error);
            toast.error('Error al registrar el reclamo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <  >
            <AnnouncementBar />

            <div className={styles.libroReclamaciones}>
                <div className={styles.container}>
                    <h1>Libro de Reclamaciones</h1>
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
                                    name="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onChange={(e) => handleInputChange({
                                        target: {
                                            name: 'acceptTerms',
                                            value: e.target.checked
                                        }
                                    })}
                                    required
                                />
                                <label>
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
                </div>
            </div>
        </>
    );
};

export default LibroReclamaciones;