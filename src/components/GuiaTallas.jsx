import React from 'react';
import styles from '../styles/GuiaTallas.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const GuiaTallas = ({ isOpen, onClose }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <AnimatePresence>
        <motion.div 
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className={styles.header}>
            <h2>Guía de Tallas</h2>
            <button className={styles.closeButton} onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className={styles.content}>
            <p className={styles.description}>
              Usa esta tabla para encontrar tu talla ideal según tu altura y peso.
              Para un ajuste holgado (Oversize), selecciona una talla más grande de la recomendada.
            </p>
            
            <div className={styles.tableWrapper}>
              <table className={styles.sizeTable}>
                <thead>
                  <tr>
                    <th className={styles.cornerCell}>Altura (cm) \ Peso (kg)</th>
                    <th>50-60kg</th>
                    <th>61-70kg</th>
                    <th>71-80kg</th>
                    <th>81-90kg</th>
                    <th>91-100kg</th>
                    <th>101-110kg</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.rowHeader}>150-160 cm</td>
                    <td className={styles.size}>S</td>
                    <td className={styles.size}>M</td>
                    <td className={styles.size}>M</td>
                    <td className={styles.size}>L</td>
                    <td className={styles.size}>XL</td>
                    <td className={styles.size}>XXL</td>
                  </tr>
                  <tr>
                    <td className={styles.rowHeader}>161-170 cm</td>
                    <td className={styles.size}>S</td>
                    <td className={styles.size}>M</td>
                    <td className={styles.size}>L</td>
                    <td className={styles.size}>L</td>
                    <td className={styles.size}>XL</td>
                    <td className={styles.size}>XXL</td>
                  </tr>
                  <tr>
                    <td className={styles.rowHeader}>171-180 cm</td>
                    <td className={styles.size}>M</td>
                    <td className={styles.size}>M</td>
                    <td className={styles.size}>L</td>
                    <td className={styles.size}>XL</td>
                    <td className={styles.size}>XL</td>
                    <td className={styles.size}>XXL</td>
                  </tr>
                  <tr>
                    <td className={styles.rowHeader}>181-190 cm</td>
                    <td className={styles.size}>M</td>
                    <td className={styles.size}>L</td>
                    <td className={styles.size}>L</td>
                    <td className={styles.size}>XL</td>
                    <td className={styles.size}>XXL</td>
                    <td className={styles.size}>XXL</td>
                  </tr>
                  <tr>
                    <td className={styles.rowHeader}>191-200 cm</td>
                    <td className={styles.size}>L</td>
                    <td className={styles.size}>L</td>
                    <td className={styles.size}>XL</td>
                    <td className={styles.size}>XL</td>
                    <td className={styles.size}>XXL</td>
                    <td className={styles.size}>XXL</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className={styles.guideInfo}>
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <i className="fas fa-ruler"></i>
                </div>
                <div className={styles.infoText}>
                  <h3>Ajuste Regular</h3>
                  <p>Sigue esta tabla para un ajuste normal que se adapta cómodamente al cuerpo.</p>
                </div>
              </div>
              
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <i className="fas fa-tshirt"></i>
                </div>
                <div className={styles.infoText}>
                  <h3>Ajuste Oversize</h3>
                  <p>Para un estilo holgado, considera elegir una talla más de la recomendada.</p>
                </div>
              </div>
              
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <i className="fas fa-question-circle"></i>
                </div>
                <div className={styles.infoText}>
                  <h3>¿Dudas?</h3>
                  <p>Si tienes preguntas sobre el tallaje, contáctanos por WhatsApp y te ayudaremos.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.footer}>
            <button className={styles.closeModalButton} onClick={onClose}>
              Entendido
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default GuiaTallas;