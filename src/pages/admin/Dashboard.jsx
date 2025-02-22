import React from 'react';
import styles from '../../styles/Admin.module.css';

const Dashboard = () => {
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <i className="fas fa-tshirt"></i>
        <div className={styles.statInfo}>
          <h3>Total Productos</h3>
          <p>124</p>
        </div>
      </div>
      <div className={styles.statCard}>
        <i className="fas fa-shopping-cart"></i>
        <div className={styles.statInfo}>
          <h3>Pedidos Pendientes</h3>
          <p>8</p>
        </div>
      </div>
      <div className={styles.statCard}>
        <i className="fas fa-users"></i>
        <div className={styles.statInfo}>
          <h3>Usuarios Activos</h3>
          <p>1,234</p>
        </div>
      </div>
      <div className={styles.statCard}>
        <i className="fas fa-dollar-sign"></i>
        <div className={styles.statInfo}>
          <h3>Ventas del Mes</h3>
          <p>S/. 12,345</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;