import React from 'react';
import styles from '../styles/Policies.module.css';
import AnnouncementBar from '../components/AnnouncementBar';

const Cookies = () => {
    return (
        <>
       <AnnouncementBar/>
        <div className={styles.policiesContainer}>
            <div className={styles.header}>
                <h1>Política de Cookies</h1>
                <p>Última actualización: 28 de Febrero, 2024</p>


                <div className={styles.contentWrapper}>
                    <section className={styles.section}>
                        <h2>3.1 ¿Qué son las Cookies?</h2>
                        <div className={styles.cookieInfo}>
                            <i className="fas fa-cookie-bite"></i>
                            <p>
                                Las cookies son pequeños archivos de texto almacenados en tu dispositivo
                                que nos ayudan a recordar tus preferencias y mejorar tu experiencia de navegación.
                            </p>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h2>3.2 Tipos de Cookies que Usamos</h2>
                        <div className={styles.cookieTypes}>
                            <div className={styles.cookieType}>
                                <i className="fas fa-lock"></i>
                                <h3>Cookies Esenciales</h3>
                                <p>Necesarias para el funcionamiento básico del sitio</p>
                            </div>
                            <div className={styles.cookieType}>
                                <i className="fas fa-chart-bar"></i>
                                <h3>Cookies de Análisis</h3>
                                <p>Nos ayudan a mejorar la experiencia del usuario</p>
                            </div>
                            <div className={styles.cookieType}>
                                <i className="fas fa-ad"></i>
                                <h3>Cookies de Publicidad</h3>
                                <p>Utilizadas para mostrar anuncios relevantes</p>
                            </div>
                        </div>
                    </section>

                    {/* ... Continue with other sections ... */}
                </div>
            </div>

        </div>
        </>
    );
};

            export default Cookies;