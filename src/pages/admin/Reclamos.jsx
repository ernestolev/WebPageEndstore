import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../Firebase';
import styles from '../../styles/AdminReclamos.module.css';
import { toast } from 'react-toastify';

const Reclamos = () => {
    const [reclamos, setReclamos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentReclamo, setCurrentReclamo] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchReclamos();
    }, [filter]);

    const fetchReclamos = async () => {
        try {
            setLoading(true);
            let reclamosQuery;

            if (filter === 'todos') {
                reclamosQuery = query(collection(db, 'Reclamos'), orderBy('createdAt', 'desc'));
            } else {
                reclamosQuery = query(
                    collection(db, 'Reclamos'), 
                    where('status', '==', filter),
                    orderBy('createdAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(reclamosQuery);
            const reclamosData = [];
            
            querySnapshot.forEach((doc) => {
                reclamosData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            setReclamos(reclamosData);
        } catch (error) {
            console.error('Error al obtener reclamos:', error);
            toast.error('Error al cargar los reclamos');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilter(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const openResponseModal = (reclamo) => {
        setCurrentReclamo(reclamo);
        setResponseText(reclamo.response || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentReclamo(null);
        setResponseText('');
    };

    const handleResponseSubmit = async (e) => {
        e.preventDefault();
        
        if (!responseText.trim()) {
            toast.error('Por favor ingrese una respuesta');
            return;
        }
        
        try {
            const reclamoRef = doc(db, 'Reclamos', currentReclamo.id);
            await updateDoc(reclamoRef, {
                response: responseText,
                responseDate: new Date(),
                status: 'resuelto',
                lastUpdated: new Date()
            });
            
            toast.success('Respuesta enviada correctamente');
            closeModal();
            fetchReclamos();
        } catch (error) {
            console.error('Error al enviar respuesta:', error);
            toast.error('Error al enviar la respuesta');
        }
    };

    const updateReclamoStatus = async (reclamoId, newStatus) => {
        try {
            const reclamoRef = doc(db, 'Reclamos', reclamoId);
            await updateDoc(reclamoRef, {
                status: newStatus,
                lastUpdated: new Date()
            });
            
            toast.success(`Estado actualizado a: ${translateStatus(newStatus)}`);
            fetchReclamos();
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            toast.error('Error al actualizar el estado');
        }
    };

    // Función para formatear fechas
    const formatDate = (timestamp) => {
        if (!timestamp) return 'No disponible';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('es-PE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Traducir estado a español
    const translateStatus = (status) => {
        const statusMap = {
            'pendiente': 'Pendiente',
            'en_proceso': 'En Proceso',
            'resuelto': 'Resuelto',
            'cancelado': 'Cancelado'
        };
        return statusMap[status] || status;
    };

    // Obtener clase CSS según estado
    const getStatusClass = (status) => {
        const statusClassMap = {
            'pendiente': styles.statusPending,
            'en_proceso': styles.statusInProcess,
            'resuelto': styles.statusResolved,
            'cancelado': styles.statusCancelled
        };
        return statusClassMap[status] || '';
    };

    // Filtrar reclamos por búsqueda
    const filteredReclamos = reclamos.filter(reclamo => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
            (reclamo.fullName && reclamo.fullName.toLowerCase().includes(query)) ||
            (reclamo.email && reclamo.email.toLowerCase().includes(query)) ||
            (reclamo.complaintNumber && reclamo.complaintNumber.toLowerCase().includes(query)) ||
            (reclamo.details && reclamo.details.toLowerCase().includes(query))
        );
    });

    return (
        <div className={styles.reclamosContainer}>
            <div className={styles.header}>
                <h1>Administración de Reclamos</h1>
                <p>Gestione los reclamos y quejas de los clientes</p>
            </div>
            
            <div className={styles.filterSection}>
                <div className={styles.filters}>
                    <select 
                        value={filter} 
                        onChange={handleFilterChange}
                        className={styles.statusFilter}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="resuelto">Resueltos</option>
                        <option value="cancelado">Cancelados</option>
                    </select>
                    
                    <div className={styles.searchBox}>
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o número..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
                
                <div className={styles.statsBar}>
                    <div className={styles.statItem}>
                        <div className={styles.statCount}>
                            {reclamos.filter(r => r.status === 'pendiente').length}
                        </div>
                        <div className={styles.statLabel}>Pendientes</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statCount}>
                            {reclamos.filter(r => r.status === 'en_proceso').length}
                        </div>
                        <div className={styles.statLabel}>En proceso</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statCount}>
                            {reclamos.filter(r => r.status === 'resuelto').length}
                        </div>
                        <div className={styles.statLabel}>Resueltos</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statCount}>
                            {reclamos.length}
                        </div>
                        <div className={styles.statLabel}>Total</div>
                    </div>
                </div>
            </div>
            
            {loading ? (
                <div className={styles.loadingContainer}>
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Cargando reclamos...</p>
                </div>
            ) : filteredReclamos.length === 0 ? (
                <div className={styles.emptyState}>
                    <i className="fas fa-clipboard-check"></i>
                    <p>No hay reclamos {filter !== 'todos' ? `con estado "${translateStatus(filter)}"` : ''}</p>
                    {searchQuery && <p>No hay resultados para "{searchQuery}"</p>}
                </div>
            ) : (
                <div className={styles.reclamosGrid}>
                    {filteredReclamos.map(reclamo => (
                        <div key={reclamo.id} className={styles.reclamoCard}>
                            <div className={styles.reclamoHeader}>
                                <div className={styles.reclamoNumber}>
                                    <span>Nº de Reclamo:</span>
                                    <strong>{reclamo.complaintNumber}</strong>
                                </div>
                                <div className={`${styles.reclamoStatus} ${getStatusClass(reclamo.status)}`}>
                                    {translateStatus(reclamo.status)}
                                </div>
                            </div>
                            
                            <div className={styles.reclamoContent}>
                                <div className={styles.reclamoCols}>
                                    <div className={styles.reclamoCol}>
                                        <h3>Información del cliente</h3>
                                        <div className={styles.clientInfo}>
                                            <p><strong>Nombre:</strong> {reclamo.fullName}</p>
                                            <p><strong>Email:</strong> {reclamo.email}</p>
                                            <p><strong>Teléfono:</strong> {reclamo.phone}</p>
                                            <p><strong>Documento:</strong> {reclamo.documentType.toUpperCase()} {reclamo.documentNumber}</p>
                                        </div>
                                    </div>
                                    
                                    <div className={styles.reclamoCol}>
                                        <h3>Detalles del reclamo</h3>
                                        <p><strong>Tipo:</strong> {reclamo.complaintType === 'reclamo' ? 'Reclamo' : 'Queja'}</p>
                                        <p><strong>Fecha:</strong> {formatDate(reclamo.createdAt)}</p>
                                        <p><strong>Producto/Servicio:</strong> {reclamo.description}</p>
                                        
                                        {reclamo.orderNumber && (
                                            <p><strong>Nº de Pedido:</strong> {reclamo.orderNumber}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className={styles.reclamoDetails}>
                                    <h3>Detalle de la reclamación</h3>
                                    <div className={styles.textBox}>
                                        <p>{reclamo.details}</p>
                                    </div>
                                    
                                    <h3>Solución solicitada</h3>
                                    <div className={styles.textBox}>
                                        <p>{reclamo.requestedSolution}</p>
                                    </div>
                                </div>
                                
                                {reclamo.response && (
                                    <div className={styles.responseBox}>
                                        <h3>Respuesta enviada</h3>
                                        <div className={styles.responseContent}>
                                            <p>{reclamo.response}</p>
                                            {reclamo.responseDate && (
                                                <p className={styles.responseDate}>
                                                    Respondido el: {formatDate(reclamo.responseDate)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className={styles.reclamoActions}>
                                    {reclamo.status === 'pendiente' && (
                                        <>
                                            <button 
                                                className={styles.btnProcess}
                                                onClick={() => updateReclamoStatus(reclamo.id, 'en_proceso')}
                                            >
                                                <i className="fas fa-clock"></i> Marcar en Proceso
                                            </button>
                                            <button 
                                                className={styles.btnRespond}
                                                onClick={() => openResponseModal(reclamo)}
                                            >
                                                <i className="fas fa-reply"></i> Responder
                                            </button>
                                        </>
                                    )}
                                    
                                    {reclamo.status === 'en_proceso' && (
                                        <>
                                            <button 
                                                className={styles.btnRespond}
                                                onClick={() => openResponseModal(reclamo)}
                                            >
                                                <i className="fas fa-reply"></i> Responder
                                            </button>
                                            <button 
                                                className={styles.btnCancel}
                                                onClick={() => updateReclamoStatus(reclamo.id, 'cancelado')}
                                            >
                                                <i className="fas fa-times"></i> Cancelar
                                            </button>
                                        </>
                                    )}
                                    
                                    {reclamo.status === 'resuelto' && !reclamo.response && (
                                        <button 
                                            className={styles.btnRespond}
                                            onClick={() => openResponseModal(reclamo)}
                                        >
                                            <i className="fas fa-reply"></i> Agregar Respuesta
                                        </button>
                                    )}
                                    
                                    {reclamo.status === 'resuelto' && reclamo.response && (
                                        <button 
                                            className={styles.btnEdit}
                                            onClick={() => openResponseModal(reclamo)}
                                        >
                                            <i className="fas fa-edit"></i> Editar Respuesta
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Modal de Respuesta */}
            {isModalOpen && currentReclamo && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Responder Reclamo</h2>
                            <button className={styles.closeBtn} onClick={closeModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className={styles.modalContent}>
                            <div className={styles.reclamoInfo}>
                                <p><strong>Número de Reclamo:</strong> {currentReclamo.complaintNumber}</p>
                                <p><strong>Cliente:</strong> {currentReclamo.fullName}</p>
                                <p><strong>Email:</strong> {currentReclamo.email}</p>
                            </div>
                            
                            <div className={styles.reclamoIssue}>
                                <h3>Detalle del Reclamo</h3>
                                <div className={styles.issueText}>
                                    <p>{currentReclamo.details}</p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleResponseSubmit} className={styles.responseForm}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="response">Su Respuesta:</label>
                                    <textarea
                                        id="response"
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        placeholder="Escriba aquí su respuesta al cliente..."
                                        rows="6"
                                        required
                                    ></textarea>
                                </div>
                                
                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className={styles.submitBtn}>
                                        <i className="fas fa-paper-plane"></i> Enviar Respuesta
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reclamos;