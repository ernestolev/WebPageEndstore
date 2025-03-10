import React, { useEffect } from 'react';
import styles from '../styles/SobreNosotros.module.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Link } from 'react-router-dom';
import AnnouncementBar from '../components/AnnouncementBar';
import imglogo from '../assets/imgs/end-largo2.png';
import imglogo2 from '../assets/imgs/end-largo.png';
import { useTheme } from '../context/ThemeContext';

const SobreNosotros = () => {
    const { theme } = useTheme();
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
            easing: 'ease-out-cubic'
        });
    }, []);

    const socialStats = [
        {
            platform: 'Instagram',
            followers: '2.4K',
            icon: 'fab fa-instagram',
            link: 'https://www.instagram.com/end.store.pe?igsh=MWFuaTNnZGE1bGt0bw%3D%3D&utm_source=qr',
            color: '#E1306C'
        },
        {
            platform: 'TikTok',
            followers: '6.5K',
            icon: 'fab fa-tiktok',
            link: 'https://www.tiktok.com/@end.store.pe?_t=ZM-8uRByss2Uyd&_r=1',
            color: '#000000'
        }
    ];

    const logoImage = theme === 'dark' ? imglogo2 : imglogo;


    return (
        <>
            <AnnouncementBar />
            <div className={styles.aboutPage}>
                <section className={styles.aboutSection}>
                    <div className={styles.container}>
                        <div className={styles.aboutGrid}>
                            <div className={styles.aboutContent} data-aos="fade-right">
                                <h2>Nuestra Historia</h2>
                                <p>
                                    EndStore nació de la pasión por la Fórmula 1 y la moda. Desde nuestros inicios,
                                    nos propusimos crear prendas que no solo vistan a los fanáticos del automovilismo,
                                    sino que cuenten historias de velocidad, adrenalina y estilo.
                                </p>
                                <p>
                                    Inspirados por leyendas como Ayrton Senna, cada diseño que creamos busca capturar
                                    la esencia del deporte motor y transformarla en piezas únicas que nuestros clientes
                                    puedan llevar con orgullo.
                                </p>
                            </div>
                            <div className={styles.aboutImage} data-aos="fade-left">
                                <img src={logoImage} alt="EndStore Historia" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values section with all cards */}
                <section className={styles.valuesSection}>
                    <div className={styles.container}>
                        <div className={styles.valuesGrid}>
                            <div className={styles.valueCard} data-aos="fade-up" data-aos-delay="0">
                                <div className={styles.valueIcon}>
                                    <i className="fas fa-star"></i>
                                </div>
                                <h3>Calidad Premium</h3>
                                <p>Materiales seleccionados y acabados perfectos en cada prenda</p>
                            </div>
                            <div className={styles.valueCard} data-aos="fade-up" data-aos-delay="100">
                                <div className={styles.valueIcon}>
                                    <i className="fas fa-tshirt"></i>
                                </div>
                                <h3>Diseños Exclusivos</h3>
                                <p>Creaciones únicas inspiradas en la F1 y el automovilismo</p>
                            </div>
                            <div className={styles.valueCard} data-aos="fade-up" data-aos-delay="200">
                                <div className={styles.valueIcon}>
                                    <i className="fas fa-heart"></i>
                                </div>
                                <h3>Pasión por la F1</h3>
                                <p>Cada prenda refleja nuestro amor por el deporte motor</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Existing workflow section */}
                <section className={styles.workflowSection}>
                    <div className={styles.container}>
                        <h2 data-aos="fade-up">Tu Experiencia EndStore</h2>
                        <div className={styles.timeline}>
                            <div className={styles.timelineItem} data-aos="fade-right">
                                <span className={styles.timelineNumber}>01</span>
                                <div className={styles.timelineContent}>
                                    <h3>Explora</h3>
                                    <p>Navega por nuestro catálogo digital y descubre diseños únicos</p>
                                </div>
                            </div>
                            <div className={styles.timelineItem} data-aos="fade-left">
                                <span className={styles.timelineNumber}>02</span>
                                <div className={styles.timelineContent}>
                                    <h3>Personaliza</h3>
                                    <p>Elige talla, cantidad y especificaciones de tu pedido</p>
                                </div>
                            </div>
                            <div className={styles.timelineItem} data-aos="fade-right">
                                <span className={styles.timelineNumber}>03</span>
                                <div className={styles.timelineContent}>
                                    <h3>Paga Seguro</h3>
                                    <p>Proceso de pago seguro a través de PayU</p>
                                </div>
                            </div>
                            <div className={styles.timelineItem} data-aos="fade-left">
                                <span className={styles.timelineNumber}>04</span>
                                <div className={styles.timelineContent}>
                                    <h3>Rastrea</h3>
                                    <p>Sigue el estado de tu pedido en tiempo real</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* New Social Media section */}
                <section className={styles.socialSection}>
                    <div className={styles.container}>
                        <h2 data-aos="fade-up">Síguenos en Redes</h2>
                        <p className={styles.socialSubtitle} data-aos="fade-up">
                            Únete a nuestra comunidad de apasionados por la F1
                        </p>
                        <div className={styles.socialGrid}>
                            {socialStats.map((social, index) => (
                                <a
                                    href={social.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.socialCard}
                                    data-aos="zoom-in"
                                    data-aos-delay={index * 100}
                                    key={social.platform}
                                    style={{ '--accent-color': social.color }}
                                >
                                    <i className={`${social.icon} ${styles.socialIcon}`}></i>
                                    <h3>{social.platform}</h3>
                                    <p className={styles.followerCount}>
                                        {social.followers}
                                        <span>seguidores</span>
                                    </p>
                                    <span className={styles.socialLink}>Seguir</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>



                <section className={styles.cta}>
                    <div className={styles.container} data-aos="zoom-in">
                        <h2>¿Listo para unirte a la pasión?</h2>
                        <p>Descubre nuestra colección inspirada en la velocidad y el estilo</p>
                        <Link to="/catalogo" className={styles.ctaButton}>
                            Ver Catálogo
                            <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
};

export default SobreNosotros;