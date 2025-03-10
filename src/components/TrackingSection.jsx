import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/TrackingSection.module.css';

const TrackingSection = () => {
  return (
    <section className={styles.trackingSection}>
      <div className={styles.trackingContainer}>
        <div className={styles.trackingContent}>
          <div className={styles.trackingInfo}>
            <span className={styles.tagline}>SEGUIMIENTO EN TIEMPO REAL</span>
            <h2 className={styles.trackingTitle}>
              Rastrea tus pedidos <br />
              <span className={styles.highlight}>en cualquier momento</span>
            </h2>
            <p className={styles.trackingDescription}>
              Mantente informado sobre el estado de tus compras con nuestro sistema de seguimiento en tiempo real.
              Desde la confirmación hasta la entrega, tendrás el control total de tus pedidos.
            </p>
            <div className={styles.trackingFeatures}>
              <div className={styles.feature}>
                <i className="fas fa-map-marker-alt"></i>
                <span>Ubicación en tiempo real</span>
              </div>
              <div className={styles.feature}>
                <i className="fas fa-clock"></i>
                <span>Actualizaciones instantáneas</span>
              </div>
              <div className={styles.feature}>
                <i className="fas fa-bell"></i>
                <span>Notificaciones de estado</span>
              </div>
            </div>
            <Link to="/orders" className={styles.trackingButton}>
              Ver mis pedidos
              <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className={styles.trackingVisual}>
            <div className={styles.phoneFrame}>
              <div className={styles.trackingSteps}>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>
                    <i className="fas fa-box"></i>
                  </div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepStatus}>Pedido confirmado</span>
                    <span className={styles.stepTime}>10:30 AM</span>
                  </div>
                  <div className={`${styles.stepDot} ${styles.active}`}></div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>
                    <i className="fas fa-warehouse"></i>
                  </div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepStatus}>Empacando</span>
                    <span className={styles.stepTime}>2:45 PM</span>
                  </div>
                  <div className={`${styles.stepDot} ${styles.active}`}></div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>
                    <i className="fas fa-truck"></i>
                  </div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepStatus}>En camino</span>
                    <span className={styles.stepTime}>4:20 PM</span>
                  </div>
                  <div className={styles.stepDot}></div>
                </div>
                <div className={styles.step}>
                  <div className={styles.stepIcon}>
                    <i className="fas fa-home"></i>
                  </div>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepStatus}>Entregado</span>
                    <span className={styles.stepTime}>-</span>
                  </div>
                  <div className={styles.stepDot}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackingSection;