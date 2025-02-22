import React from 'react';
import styles from '../styles/ConfirmationModal.module.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className={styles.actions}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className={styles.confirmButton} 
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;