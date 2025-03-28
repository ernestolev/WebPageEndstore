import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/Contacto.module.css';
import AnnouncementBar from '../components/AnnouncementBar';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../Firebase';
import { useAuth } from '../context/AuthContext';

const Contacto = () => {
    const { theme } = useTheme();
    const { user } = useAuth();
    const mapContainer = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);
    const [hoverSocial, setHoverSocial] = useState(null);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.message) {
            toast.error('Por favor completa los campos requeridos', {
                theme: theme === 'dark' ? 'dark' : 'light',
            });
            return;
        }

        try {
            setSending(true);

            // Enviar mensaje a la colección "mensajes" (no "messages")
            await addDoc(collection(db, 'mensajes'), {
                ...formData,
                userId: user?.uid || 'guest',
                createdAt: serverTimestamp(),
                status: 'nuevo' // Agregar estado inicial para facilitar la gestión
            });

            toast.success('¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.', {
                theme: theme === 'dark' ? 'dark' : 'light',
                icon: '📨',
                style: {
                    background: 'linear-gradient(135deg, #e10600, #ff4d4d)',
                    color: 'white',
                }
            });

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: ''
            });
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Hubo un error al enviar el mensaje. Inténtalo más tarde.', {
                theme: theme === 'dark' ? 'dark' : 'light',
            });
        } finally {
            setSending(false);
        }
    };



    const socialMedia = [
        {
            name: 'WhatsApp',
            icon: 'fab fa-whatsapp',
            link: 'https://wa.me/51981410745',
            color: '#25D366',
            label: 'Escríbenos por WhatsApp',
            description: 'Atención rápida de lunes a sábado',
            phone: '+51 981 410 745'
        },
        {
            name: 'Instagram',
            icon: 'fab fa-instagram',
            link: 'https://www.instagram.com/end.store.pe?igsh=MWFuaTNnZGE1bGt0bw%3D%3D&utm_source=qr',
            color: '#E1306C',
            label: 'Síguenos en Instagram',
            description: '@end.store.pe',
            stats: '2.4K seguidores'
        },
        {
            name: 'TikTok',
            icon: 'fab fa-tiktok',
            link: 'https://www.tiktok.com/@end.store.pe?_t=ZM-8uRByss2Uyd&_r=1',
            color: '#000000',
            label: 'Síguenos en TikTok',
            description: '@end.store.pe',
            stats: '6.5K seguidores'
        }
    ];

    return (
        <>
            <AnnouncementBar />
            <div className={styles.contactPage}>
                <motion.div
                    className={styles.heroSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1>Contáctanos</h1>
                    <p>Estamos aquí para ayudarte. ¡Conecta con nosotros!</p>
                </motion.div>

                <div className={styles.contactContainer}>
                    <motion.div
                        className={styles.contactInfo}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h2>Conéctate con nosotros</h2>
                        <p className={styles.infoText}>
                            Estamos comprometidos a brindarte la mejor atención. Elige el canal que prefieras para comunicarte con nuestro equipo.
                        </p>

                        <div className={styles.socialGrid}>
                            {socialMedia.map((social, index) => (
                                <motion.a
                                    key={social.name}
                                    href={social.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.socialCard}
                                    style={{
                                        boxShadow: hoverSocial === index ? `0 8px 24px rgba(${social.name === 'WhatsApp' ? '37, 211, 102' : social.name === 'Instagram' ? '225, 48, 108' : social.name === 'TikTok' ? '0, 0, 0' : '211, 70, 56'}, 0.25)` : '',
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        y: -5
                                    }}
                                    onHoverStart={() => setHoverSocial(index)}
                                    onHoverEnd={() => setHoverSocial(null)}
                                >
                                    <div
                                        className={styles.socialIcon}
                                        style={{ backgroundColor: social.color }}
                                    >
                                        <i className={social.icon}></i>
                                    </div>
                                    <div className={styles.socialInfo}>
                                        <h3>{social.label}</h3>
                                        <p>{social.description}</p>
                                        {social.phone && <p className={styles.phoneNumber}>{social.phone}</p>}
                                        {social.stats && <p className={styles.stats}>{social.stats}</p>}
                                        {social.response && <p className={styles.response}>{social.response}</p>}
                                    </div>
                                    <div className={styles.arrowIcon}>
                                        <i className="fas fa-arrow-right"></i>
                                    </div>
                                </motion.a>
                            ))}
                        </div>

                    </motion.div>

                    <motion.div
                        className={styles.contactForm}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <div className={styles.formContainer}>
                            <h2>Envíanos un mensaje</h2>
                            <p>Completa el formulario y nos pondremos en contacto contigo lo más pronto posible.</p>

                            <form onSubmit={handleSubmit}>
                                <div className={styles.inputGroup}>
                                    <div className={styles.inputWrapper}>
                                        <label htmlFor="name">Nombre completo *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                    <div className={styles.inputWrapper}>
                                        <label htmlFor="email">Correo electrónico *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="ejemplo@email.com"
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <div className={styles.inputWrapper}>
                                        <label htmlFor="phone">Teléfono</label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+51 999 999 999"
                                        />
                                    </div>
                                    <div className={styles.inputWrapper}>
                                        <label htmlFor="subject">Asunto</label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="¿En qué podemos ayudarte?"
                                        />
                                    </div>
                                </div>

                                <div className={styles.textareaWrapper}>
                                    <label htmlFor="message">Mensaje *</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        rows="6"
                                        required
                                        placeholder="Escribe tu mensaje aquí..."
                                    ></textarea>
                                </div>

                                <motion.button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={sending}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {sending ? (
                                        <>
                                            <span className={styles.spinner}></span>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            Enviar mensaje
                                            <i className="fas fa-paper-plane"></i>
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </div>

                        <div className={styles.contactBoxes}>
                            <div className={styles.contactBox}>
                                <div className={styles.boxIcon}>
                                    <i className="fas fa-headset"></i>
                                </div>
                                <h3>Soporte</h3>
                                <p>¿Tienes problemas con tu pedido? Nuestro equipo de soporte está listo para ayudarte.</p>
                            </div>
                            <div className={styles.contactBox}>
                                <div className={styles.boxIcon}>
                                    <i className="fas fa-hands-helping"></i>
                                </div>
                                <h3>Colaboraciones</h3>
                                <p>¿Interesado en colaborar con nosotros? ¡Contáctanos para discutir oportunidades!</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    className={styles.faqSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <h2>Preguntas Frecuentes</h2>
                    <div className={styles.faqGrid}>
                        <div className={styles.faqItem}>
                            <h3>¿Cuánto tarda el envío?</h3>
                            <p>Procesamos los pedidos en 1-2 días hábiles. El envío nacional toma 3-5 días dependiendo de tu ubicación.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h3>¿Puedo cambiar o devolver mi compra?</h3>
                            <p>No, una vez que el producto ha sido comprado y entregado no hay derecho a devolución salvo sea por problemas comprensibles.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h3>¿Tienen tienda física?</h3>
                            <p>Actualmente operamos solo online, pero realizamos pop-up stores que anunciamos en nuestras redes sociales.</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h3>¿Qué métodos de pago aceptan?</h3>
                            <p>Aceptamos pagos con tarjeta de crédito/débito, PayU y transferencias bancarias.</p>
                        </div>
                    </div>
                </motion.div>

                <div className={styles.ctaSection}>
                    <h2>¿Listo para llevar tu estilo al siguiente nivel?</h2>
                    <p>Explora nuestra colección exclusiva inspirada en la Fórmula 1</p>
                    <motion.a
                        href="/catalogo"
                        className={styles.ctaButton}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Ver catálogo
                    </motion.a>
                </div>
            </div>
        </>
    );
};

export default Contacto;