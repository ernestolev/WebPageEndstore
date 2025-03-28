import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../Firebase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import styles from '../../styles/Admin.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Codigos = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState({
    code: '',
    discount: 10,
    validUntil: '',
    isActive: true,
    freeShipping: false, // Nueva propiedad para envío gratis
  });

  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [filterActive, setFilterActive] = useState('all');

  // Fetch discount codes
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        setLoading(true);
        const codesSnapshot = await getDocs(collection(db, 'Codigos'));
        const codesData = codesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by creation date (newest first)
        codesData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return 0;
        });

        setCodes(codesData);
      } catch (error) {
        console.error('Error fetching codes:', error);
        toast.error('Error al cargar los códigos de descuento');
      } finally {
        setLoading(false);
      }
    };

    fetchCodes();
  }, []);

  // Filter codes based on active status
  const filteredCodes = codes.filter(code => {
    if (filterActive === 'all') return true;
    if (filterActive === 'active') return code.isActive;
    if (filterActive === 'inactive') return !code.isActive;
    return true;
  });

  // Generate random code
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    setNewCode({ ...newCode, code: result });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'code') {
      // Convert to uppercase and limit to 6 characters
      const formattedCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      setNewCode({ ...newCode, code: formattedCode });
    } else if (name === 'discount') {
      // Ensure discount is between 1 and 100
      const discount = Math.min(Math.max(parseInt(value) || 0, 1), 100);
      setNewCode({ ...newCode, discount });
    } else {
      setNewCode({ ...newCode, [name]: value });
    }
  };

  // Toggle code active status
  const toggleCodeStatus = async (codeId, currentStatus) => {
    try {
      await updateDoc(doc(db, 'Codigos', codeId), {
        isActive: !currentStatus,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setCodes(codes.map(code =>
        code.id === codeId ? { ...code, isActive: !code.isActive } : code
      ));

      toast.success(`Código ${!currentStatus ? 'activado' : 'desactivado'} con éxito`);
    } catch (error) {
      console.error('Error updating code status:', error);
      toast.error('Error al actualizar el estado del código');
    }
  };

  // Delete code
  const deleteCode = async (codeId) => {
    if (!window.confirm('¿Estás seguro de eliminar este código de descuento?')) return;

    try {
      await deleteDoc(doc(db, 'Codigos', codeId));
      setCodes(codes.filter(code => code.id !== codeId));
      toast.success('Código eliminado con éxito');
    } catch (error) {
      console.error('Error deleting code:', error);
      toast.error('Error al eliminar el código');
    }
  };

  // Modificar la función handleSubmit para incluir freeShipping
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate code
    if (newCode.code.length !== 6) {
      setError('El código debe tener 6 caracteres');
      return;
    }

    // Check if code already exists
    if (codes.some(c => c.code === newCode.code)) {
      setError('Este código ya existe');
      return;
    }

    try {
      setIsAdding(true);
      setError('');

      const validUntil = newCode.validUntil ? new Date(newCode.validUntil) : null;

      // Add new code to Firestore, including freeShipping field
      const docRef = await addDoc(collection(db, 'Codigos'), {
        code: newCode.code,
        discount: newCode.discount,
        validUntil: validUntil,
        isActive: newCode.isActive,
        freeShipping: newCode.freeShipping, // Incluir el nuevo campo
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      // Add to local state
      setCodes([{
        id: docRef.id,
        ...newCode,
        createdAt: { toMillis: () => Date.now() }
      }, ...codes]);

      // Reset form
      setNewCode({
        code: '',
        discount: 10,
        validUntil: '',
        isActive: true,
        freeShipping: false, // Reiniciar también este campo
      });

      toast.success('Código de descuento creado con éxito');
    } catch (error) {
      console.error('Error creating code:', error);
      setError('Error al crear el código de descuento');
      toast.error('Error al crear el código de descuento');
    } finally {
      setIsAdding(false);
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(date);
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Check if a code is expired
  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    try {
      const expiryDate = validUntil.toDate ? validUntil.toDate() : new Date(validUntil);
      return expiryDate < new Date();
    } catch {
      return false;
    }
  };

  return (
    <div className={styles.adminLayout}>
      <div className={styles.adminContent}>
        <div className={styles.adminHeader}>
          <div>
            <h1 className={styles.adminTitle}>Códigos de Descuento</h1>
            <p className={styles.adminDescription}>
              Gestiona los códigos promocionales para tus clientes
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link to="/admin" className={styles.backLink}>
              <i className="fas fa-arrow-left"></i> Volver al Dashboard
            </Link>
          </div>
        </div>

        <div className={styles.codesContainer}>
          <motion.div
            className={styles.newCodeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className={styles.sectionTitle}>Crear Nuevo Código</h2>
            <form onSubmit={handleSubmit} className={styles.codeForm}>
              <div className={styles.formFields}>
                <div className={styles.formGroup}>
                  <label htmlFor="code">Código</label>
                  <div className={styles.codeInputGroup}>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={newCode.code}
                      onChange={handleChange}
                      placeholder="SALE20"
                      className={styles.codeInput}
                      maxLength={6}
                      autoComplete="off"
                      required
                    />
                    <button
                      type="button"
                      className={styles.generateButton}
                      onClick={generateRandomCode}
                    >
                      <i className="fas fa-dice"></i>
                      Generar
                    </button>
                  </div>
                  <small>6 caracteres, solo letras mayúsculas y números</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="discount">Descuento (%)</label>
                  <div className={styles.discountInputWrapper}>
                    <input
                      type="number"
                      id="discount"
                      name="discount"
                      value={newCode.discount}
                      onChange={handleChange}
                      min="1"
                      max="100"
                      required
                    />
                    <span className={styles.percentSymbol}>%</span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="validUntil">Válido Hasta (opcional)</label>
                  <input
                    type="datetime-local"
                    id="validUntil"
                    name="validUntil"
                    value={newCode.validUntil}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={newCode.isActive}
                      onChange={(e) => setNewCode({ ...newCode, isActive: e.target.checked })}
                    />
                    <span>Activo</span>
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="freeShipping"
                      checked={newCode.freeShipping}
                      onChange={(e) => setNewCode({ ...newCode, freeShipping: e.target.checked })}
                    />
                    <span>Envío Gratis</span>
                  </label>
                  <small>Si está marcado, este código aplicará envío gratis independientemente del valor de la compra</small>
                </div>
              </div>

              {error && <p className={styles.errorMessage}>{error}</p>}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <span className={styles.spinner}></span>
                    Creando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus-circle"></i>
                    Crear Código
                  </>
                )}
              </button>
            </form>
          </motion.div>

          <motion.div
            className={styles.existingCodesSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Códigos Existentes</h2>
              <div className={styles.filterControls}>
                <button
                  className={`${styles.filterButton} ${filterActive === 'all' ? styles.active : ''}`}
                  onClick={() => setFilterActive('all')}
                >
                  Todos
                </button>
                <button
                  className={`${styles.filterButton} ${filterActive === 'active' ? styles.active : ''}`}
                  onClick={() => setFilterActive('active')}
                >
                  Activos
                </button>
                <button
                  className={`${styles.filterButton} ${filterActive === 'inactive' ? styles.active : ''}`}
                  onClick={() => setFilterActive('inactive')}
                >
                  Inactivos
                </button>
              </div>
            </div>

            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Cargando códigos...</p>
              </div>
            ) : filteredCodes.length > 0 ? (
              <div className={styles.codesGrid}>
                <AnimatePresence>
                  {filteredCodes.map(code => (
                    <motion.div
                      key={code.id}
                      className={`${styles.codeCard} ${!code.isActive ? styles.inactive : ''} ${isExpired(code.validUntil) ? styles.expired : ''}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      <div className={styles.codeHeader}>
                        <h3 className={styles.codeText}>{code.code}</h3>
                        <span className={styles.discountBadge}>
                          -{code.discount}%
                        </span>
                      </div>

                      <div className={styles.codeDetails}>
                        <div className={styles.codeInfo}>
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Estado:</span>
                            <span className={`${styles.statusBadge} ${code.isActive ? styles.active : styles.inactive}`}>
                              {code.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Creado:</span>
                            <span>{formatDate(code.createdAt)}</span>
                          </div>

                          {code.validUntil && (
                            <div className={styles.infoItem}>
                              <span className={styles.infoLabel}>Válido hasta:</span>
                              <span className={isExpired(code.validUntil) ? styles.expired : ''}>
                                {formatDate(code.validUntil)}
                                {isExpired(code.validUntil) && (
                                  <span className={styles.expiredTag}>Expirado</span>
                                )}
                              </span>
                            </div>
                          )}
                          {code.freeShipping && (
                            <div className={styles.infoItem}>
                              <span className={styles.specialBadge}>
                                <i className="fas fa-truck"></i> Envío Gratis
                              </span>
                            </div>
                          )}
                        </div>

                        <div className={styles.codeActions}>
                          <button
                            className={`${styles.actionButton} ${styles.toggleButton}`}
                            onClick={() => toggleCodeStatus(code.id, code.isActive)}
                          >
                            <i className={`fas fa-${code.isActive ? 'toggle-on' : 'toggle-off'}`}></i>
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={() => deleteCode(code.id)}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <i className="fas fa-ticket-alt"></i>
                <p>No hay códigos {filterActive !== 'all' ? `${filterActive === 'active' ? 'activos' : 'inactivos'}` : ''} disponibles</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Codigos;