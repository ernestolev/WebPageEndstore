import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../Firebase';
import { toast } from 'react-toastify';
import styles from '../../styles/AdminMensajes.module.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Mensajes = () => {
    const [mensajes, setMensajes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('todos');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [responseText, setResponseText] = useState('');

    useEffect(() => {
        fetchMensajes();
    }, [filter]);

    const fetchMensajes = async () => {
        try {
            setLoading(true);
            let mensajesQuery;

            if (filter === 'todos') {
                mensajesQuery = query(collection(db, 'mensajes'), orderBy('createdAt', 'desc'));
            } else {
                mensajesQuery = query(
                    collection(db, 'mensajes'), 
                    where('status', '==', filter),
                    orderBy('createdAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(mensajesQuery);
            const mensajesData = [];
            
            querySnapshot.forEach((doc) => {
                mensajesData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            setMensajes(mensajesData);
        } catch (error) {
            console.error('Error al obtener mensajes:', error);
            toast.error('Error al cargar los mensajes');
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

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Fecha no disponible';
        
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return format(date, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
        } catch (error) {
            console.error('Error al formatear fecha:', error);
            return 'Fecha inválida';
        }
    };

    const updateMessageStatus = async (messageId, newStatus) => {
        try {
            const messageRef = doc(db, 'mensajes', messageId);
            await updateDoc(messageRef, {
                status: newStatus,
                lastUpdated: new Date()
            });
            
            toast.success(`Estado actualizado a: ${getStatusLabel(newStatus)}`);
            fetchMensajes();
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            toast.error('Error al actualizar el estado');
        }
    };

    const deleteMessage = async (messageId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este mensaje? Esta acción no se puede deshacer.')) {
            try {
                await deleteDoc(doc(db, 'mensajes', messageId));
                toast.success('Mensaje eliminado correctamente');
                fetchMensajes();
            } catch (error) {
                console.error('Error al eliminar mensaje:', error);
                toast.error('Error al eliminar el mensaje');
            }
        }
    };

    const openResponseModal = (message) => {
        setSelectedMessage(message);
        setResponseText(message.response || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedMessage(null);
        setResponseText('');
    };

    const handleResponseSubmit = async (e) => {
        e.preventDefault();
        
        if (!responseText.trim()) {
            toast.error('Por favor ingrese una respuesta');
            return;
        }
        
        try {
            const messageRef = doc(db, 'mensajes', selectedMessage.id);
            await updateDoc(messageRef, {
                response: responseText,
                responseDate: new Date(),
                status: 'respondido',
                lastUpdated: new Date()
            });
            
            toast.success('Respuesta guardada correctamente');
            closeModal();
            fetchMensajes();
        } catch (error) {
            console.error('Error al enviar respuesta:', error);
            toast.error('Error al guardar la respuesta');
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'nuevo': return 'Nuevo';
            case 'leido': return 'Leído';
            case 'en_proceso': return 'En proceso';
            case 'respondido': return 'Respondido';
            case 'cerrado': return 'Cerrado';
            default: return status;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'nuevo': return styles.statusNuevo;
            case 'leido': return styles.statusLeido;
            case 'en_proceso': return styles.statusEnProceso;
            case 'respondido': return styles.statusRespondido;
            case 'cerrado': return styles.statusCerrado;
            default: return '';
        }
    };

    // Filtrar mensajes según la búsqueda
    const filteredMensajes = mensajes.filter(mensaje => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
            (mensaje.name && mensaje.name.toLowerCase().includes(query)) ||
            (mensaje.email && mensaje.email.toLowerCase().includes(query)) ||
            (mensaje.subject && mensaje.subject.toLowerCase().includes(query)) ||
            (mensaje.message && mensaje.message.toLowerCase().includes(query))
        );
    });

    return (
        <div className={styles.mensajesContainer}>
            <div className={styles.header}>
                <h1>Mensajes de Contacto</h1>
                <p>Gestiona los mensajes enviados desde el formulario de contacto</p>
            </div>
            
            <div className={styles.filterSection}>
                <div className={styles.filters}>
                    <select 
                        value={filter} 
                        onChange={handleFilterChange}
                        className={styles.statusFilter}
                    >
                        <option value="todos">Todos los mensajes</option>
                        <option value="nuevo">Nuevos</option>
                        <option value="leido">Leídos</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="respondido">Respondidos</option>
                        <option value="cerrado">Cerrados</option>
                    </select>
                    
                    <div className={styles.searchBox}>
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o asunto..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>
                
                <div className={styles.statsBar}>
                    <div className={styles.statItem}>
                        <div className={styles.statCount}>
                            {mensajes.filter(m => m.status === 'nuevo').length}
                        </div>
                        <div className={styles.statLabel}>Nuevos</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statCount}>
                            {mensajes.filter(m => m.status === 'en_proceso').length}
                        </div>
                        <div className={styles.statLabel}>En proceso</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statCount}>
                            {mensajes.filter(m => m.status === 'respondido').length}
                        </div>
                        <div className={styles.statLabel}>Respondidos</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statCount}>
                            {mensajes.length}
                        </div>
                        <div className={styles.statLabel}>Total</div>
                    </div>
                </div>
            </div>
            
            {loading ? (
                <div className={styles.loadingContainer}>
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Cargando mensajes...</p>
                </div>
            ) : filteredMensajes.length === 0 ? (
                <div className={styles.emptyState}>
                    <i className="fas fa-envelope-open"></i>
                    <p>No hay mensajes {filter !== 'todos' ? `con estado "${getStatusLabel(filter)}"` : ''}</p>
                    {searchQuery && <p>No hay resultados para "{searchQuery}"</p>}
                </div>
            ) : (
                <div className={styles.mensajesGrid}>
                    {filteredMensajes.map(mensaje => (
                        <div key={mensaje.id} className={styles.mensajeCard}>
                            <div className={styles.mensajeHeader}>
                                <div className={styles.mensajeInfo}>
                                    <h3>{mensaje.subject || 'Sin asunto'}</h3>
                                    <span className={`${styles.mensajeStatus} ${getStatusClass(mensaje.status)}`}>
                                        {getStatusLabel(mensaje.status)}
                                    </span>
                                </div>
                                <div className={styles.mensajeMeta}>
                                    <div className={styles.mensajeDate}>
                                        <i className="far fa-calendar-alt"></i>
                                        {formatDate(mensaje.createdAt)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.mensajeContent}>
                                <div className={styles.senderInfo}>
                                    <div className={styles.senderAvatar}>
                                        <i className="fas fa-user"></i>
                                    </div>
                                    <div className={styles.senderDetails}>
                                        <h4>{mensaje.name}</h4>
                                        <div className={styles.contactDetails}>
                                            <a href={`mailto:${mensaje.email}`} className={styles.email}>
                                                <i className="fas fa-envelope"></i>
                                                {mensaje.email}
                                            </a>
                                            {mensaje.phone && (
                                                <a href={`tel:${mensaje.phone}`} className={styles.phone}>
                                                    <i className="fas fa-phone"></i>
                                                    {mensaje.phone}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={styles.messageBody}>
                                    <p>{mensaje.message}</p>
                                </div>
                                
                                {mensaje.response && (
                                    <div className={styles.responseSection}>
                                        <h4>
                                            <i className="fas fa-reply"></i>
                                            Respuesta
                                        </h4>
                                        <div className={styles.responseContent}>
                                            <p>{mensaje.response}</p>
                                            {mensaje.responseDate && (
                                                <p className={styles.responseDate}>
                                                    Respondido el: {formatDate(mensaje.responseDate)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div className={styles.mensajeActions}>
                                    {mensaje.status === 'nuevo' && (
                                        <button 
                                            className={styles.btnMarkRead}
                                            onClick={() => updateMessageStatus(mensaje.id, 'leido')}
                                        >
                                            <i className="fas fa-check"></i> Marcar como leído
                                        </button>
                                    )}
                                    
                                    {['nuevo', 'leido'].includes(mensaje.status) && (
                                        <button 
                                            className={styles.btnProcess}
                                            onClick={() => updateMessageStatus(mensaje.id, 'en_proceso')}
                                        >
                                            <i className="fas fa-clock"></i> Marcar en proceso
                                        </button>
                                    )}
                                    
                                    {!mensaje.response && (
                                        <button 
                                            className={styles.btnRespond}
                                            onClick={() => openResponseModal(mensaje)}
                                        >
                                            <i className="fas fa-reply"></i> Responder
                                        </button>
                                    )}
                                    
                                    {mensaje.response && (
                                        <button 
                                            className={styles.btnEdit}
                                            onClick={() => openResponseModal(mensaje)}
                                        >
                                            <i className="fas fa-edit"></i> Editar respuesta
                                        </button>
                                    )}
                                    
                                    {['leido', 'en_proceso', 'respondido'].includes(mensaje.status) && (
                                        <button 
                                            className={styles.btnClose}
                                            onClick={() => updateMessageStatus(mensaje.id, 'cerrado')}
                                        >
                                            <i className="fas fa-archive"></i> Cerrar
                                        </button>
                                    )}
                                    
                                    <button 
                                        className={styles.btnDelete}
                                        onClick={() => deleteMessage(mensaje.id)}
                                    >
                                        <i className="fas fa-trash"></i> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Modal de Respuesta */}
            {isModalOpen && selectedMessage && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Responder Mensaje</h2>
                            <button className={styles.closeBtn} onClick={closeModal}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className={styles.modalContent}>
                            <div className={styles.messageInfo}>
                                <p><strong>De:</strong> {selectedMessage.name} &lt;{selectedMessage.email}&gt;</p>
                                <p><strong>Asunto:</strong> {selectedMessage.subject || 'Sin asunto'}</p>
                                <p><strong>Fecha:</strong> {formatDate(selectedMessage.createdAt)}</p>
                            </div>
                            
                            <div className={styles.messageContent}>
                                <h3>Mensaje original</h3>
                                <div className={styles.originalMessage}>
                                    <p>{selectedMessage.message}</p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleResponseSubmit} className={styles.responseForm}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="response">Tu Respuesta:</label>
                                    <textarea
                                        id="response"
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        placeholder="Escribe aquí tu respuesta..."
                                        rows="6"
                                        required
                                    ></textarea>
                                </div>
                                
                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className={styles.submitBtn}>
                                        <i className="fas fa-paper-plane"></i> Guardar Respuesta
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

export default Mensajes;