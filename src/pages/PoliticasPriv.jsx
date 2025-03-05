import React from 'react';
import styles from '../styles/Policies.module.css';

const PoliticasPriv = () => {
    return (
        <div className={styles.policiesContainer}>
            <div className={styles.header}>
                <h1>Política de Privacidad</h1>
                <p>Última actualización: 28 de Febrero, 2024</p>
            </div>

            <div className={styles.contentWrapper}>
                <section className={styles.section}>
                    <h2>1.1 Información que Recopilamos</h2>
                    <div className={styles.infoList}>
                        <div className={styles.infoItem}>
                            <i className="fas fa-user-circle"></i>
                            <p>Datos personales proporcionados por el usuario (nombre, correo electrónico, teléfono, dirección)</p>
                        </div>
                        <div className={styles.infoItem}>
                            <i className="fas fa-globe"></i>
                            <p>Información de navegación (cookies, dirección IP, tipo de dispositivo)</p>
                        </div>
                        <div className={styles.infoItem}>
                            <i className="fas fa-credit-card"></i>
                            <p>Datos de pago (cuando se realiza una compra en nuestra plataforma)</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>1.2 Uso de la Información</h2>
                    <div className={styles.useList}>
                        <div className={styles.useItem}>
                            <i className="fas fa-check"></i>
                            <p>Procesar pedidos y gestionar entregas</p>
                        </div>
                        <div className={styles.useItem}>
                            <i className="fas fa-check"></i>
                            <p>Mejorar la experiencia del usuario en nuestra web</p>
                        </div>
                        <div className={styles.useItem}>
                            <i className="fas fa-check"></i>
                            <p>Enviar comunicaciones promocionales (solo con consentimiento)</p>
                        </div>
                        <div className={styles.useItem}>
                            <i className="fas fa-check"></i>
                            <p>Cumplir con obligaciones legales y de seguridad</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>1.3 Protección de los Datos</h2>
                    <div className={styles.securityList}>
                        <div className={styles.securityItem}>
                            <i className="fas fa-lock"></i>
                            <p>Implementamos medidas de seguridad avanzadas para proteger tu información</p>
                        </div>
                        <div className={styles.securityItem}>
                            <i className="fas fa-shield-alt"></i>
                            <p>No compartimos ni vendemos tus datos a terceros sin tu consentimiento</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>1.4 Derechos del Usuario</h2>
                    <div className={styles.rightsList}>
                        <div className={styles.rightItem}>
                            <i className="fas fa-user-edit"></i>
                            <p>Acceder, corregir o eliminar tus datos personales</p>
                        </div>
                        <div className={styles.rightItem}>
                            <i className="fas fa-envelope"></i>
                            <p>Retirar tu consentimiento para comunicaciones comerciales</p>
                        </div>
                        <div className={styles.rightItem}>
                            <i className="fas fa-gavel"></i>
                            <p>Presentar una reclamación ante la autoridad de protección de datos</p>
                        </div>
                    </div>
                </section>

                <div className={styles.contact}>
                    <p>Para ejercer estos derechos, contáctanos en:</p>
                    <a href="mailto:ermarlevh04@gmail.com">ermarlevh04@gmail.com</a>
                </div>
            </div>
        </div>
    );
};

export default PoliticasPriv;