import React from 'react';
import styles from '../styles/Policies.module.css';

const TerminosCondiciones = () => {
    return (
        <div className={styles.policiesContainer}>
            <div className={styles.header}>
                <h1>Términos y Condiciones</h1>
                <p>Última actualización: 28 de Febrero, 2024</p>
            </div>

            <div className={styles.contentWrapper}>
                <section className={styles.section}>
                    <h2>2.1 Uso del Sitio Web</h2>
                    <div className={styles.termsList}>
                        <div className={styles.termItem}>
                            <i className="fas fa-user"></i>
                            <p>Debes ser mayor de edad para realizar compras</p>
                        </div>
                        <div className={styles.termItem}>
                            <i className="fas fa-shield-alt"></i>
                            <p>No puedes utilizar el sitio para actividades ilícitas o fraudulentas</p>
                        </div>
                        <div className={styles.termItem}>
                            <i className="fas fa-edit"></i>
                            <p>Nos reservamos el derecho de modificar los servicios y precios sin previo aviso</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>2.2 Compras y Pagos</h2>
                    <div className={styles.paymentsList}>
                        <div className={styles.paymentItem}>
                            <i className="fas fa-tag"></i>
                            <p>Todos los precios incluyen IGV</p>
                        </div>
                        <div className={styles.paymentItem}>
                            <i className="fas fa-credit-card"></i>
                            <p>Aceptamos pagos con tarjetas de crédito/débito y PayU</p>
                        </div>
                        <div className={styles.paymentItem}>
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>Nos reservamos el derecho de cancelar pedidos por sospecha de fraude</p>
                        </div>
                    </div>
                </section>

                {/* ... Continue with other sections ... */}
            </div>
        </div>
    );
};

export default TerminosCondiciones;