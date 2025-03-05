import React from 'react';
import styles from '../styles/PoliticasCambios.module.css';
import AnnouncementBar from '../components/AnnouncementBar';

const PoliticasCambios = () => {
    return (
        <>
            <AnnouncementBar />
            <div className={styles.policiesContainer}>
                <div className={styles.header}>
                    <h1>Política de Cambios y Devoluciones</h1>
                    <p className={styles.subtitle}>Tu satisfacción es nuestra prioridad</p>
                </div>

                <div className={styles.contentWrapper}>
                    <section className={styles.section}>
                        <h2>1. Condiciones Generales</h2>
                        <p>
                            En EndStore, nos esforzamos por garantizar la satisfacción de nuestros clientes.
                            Si no estás completamente satisfecho con tu compra, ofrecemos opciones de cambio
                            y devolución según las condiciones detalladas a continuación.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h2>2. Plazos para Cambios y Devoluciones</h2>
                        <div className={styles.timelineGrid}>
                            <div className={styles.timelineItem}>
                                <i className="fas fa-exchange-alt"></i>
                                <h3>Cambios</h3>
                                <p>7 días calendario posteriores a la recepción</p>
                            </div>
                            <div className={styles.timelineItem}>
                                <i className="fas fa-undo"></i>
                                <h3>Devoluciones</h3>
                                <p>10 días calendario desde la entrega</p>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2>3. Requisitos para Cambios y Devoluciones</h2>
                        <div className={styles.requirementsList}>
                            <div className={styles.requirement}>
                                <i className="fas fa-check-circle"></i>
                                <p>Producto en empaque original y perfecto estado</p>
                            </div>
                            <div className={styles.requirement}>
                                <i className="fas fa-check-circle"></i>
                                <p>Comprobante de compra (boleta o factura)</p>
                            </div>
                            <div className={styles.requirement}>
                                <i className="fas fa-check-circle"></i>
                                <p>No ser producto en oferta o personalizado</p>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2>4. Proceso de Solicitud</h2>
                        <div className={styles.processSteps}>
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>1</div>
                                <h3>Contacto</h3>
                                <p>Envía un correo a soporte@endstore.com</p>
                            </div>
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>2</div>
                                <h3>Evaluación</h3>
                                <p>Revisamos tu caso en 48h</p>
                            </div>
                            <div className={styles.step}>
                                <div className={styles.stepNumber}>3</div>
                                <h3>Resolución</h3>
                                <p>Te indicamos los siguientes pasos</p>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2>5. Productos No Elegibles</h2>
                        <div className={styles.nonEligibleList}>
                            <div className={styles.nonEligibleItem}>
                                <i className="fas fa-times-circle"></i>
                                <p>Artículos en oferta o liquidación</p>
                            </div>
                            <div className={styles.nonEligibleItem}>
                                <i className="fas fa-times-circle"></i>
                                <p>Productos personalizados</p>
                            </div>
                            <div className={styles.nonEligibleItem}>
                                <i className="fas fa-times-circle"></i>
                                <p>Ropa interior y productos de higiene</p>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2>6. Contacto</h2>
                        <div className={styles.contactInfo}>
                            <a href="mailto:ermarlevh04@gmail.com" className={styles.contactCard}>
                                <i className="fas fa-envelope"></i>
                                <h3>Email</h3>
                                <p>ermarlevh04@gmail.com</p>
                            </a>
                            <a href="https://wa.me/51981410745" className={styles.contactCard}>
                                <i className="fab fa-whatsapp"></i>
                                <h3>WhatsApp</h3>
                                <p>+51 981 410 745</p>
                            </a>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
};

export default PoliticasCambios;