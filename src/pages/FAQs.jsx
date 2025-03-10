import React, { useState, useEffect } from 'react';
import styles from '../styles/FAQs.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AnnouncementBar from '../components/AnnouncementBar';

const FAQs = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [highlightedQuestion, setHighlightedQuestion] = useState(null);

  const categories = [
    { id: 'general', name: 'General', icon: 'fa-info' },
    { id: 'products', name: 'Productos', icon: 'fa-circle' },
    { id: 'orders', name: 'Pedidos', icon: 'fa-box' },
    { id: 'shipping', name: 'Envíos', icon: 'fa-truck' },
    { id: 'returns', name: 'Devoluciones', icon: 'fa-stop' },
    { id: 'payment', name: 'Pagos', icon: 'fa-credit-card' }
  ];

  const faqs = [
    {
      id: 'q1',
      question: '¿Qué es EndStore?',
      answer: 'EndStore es una tienda online especializada en ropa y accesorios inspirados en la Fórmula 1. Nuestro objetivo es ofrecer prendas de alta calidad con diseños únicos para los amantes del automovilismo y la moda urbana.',
      category: 'general'
    },
    {
      id: 'q2',
      question: '¿Cómo puedo contactar con servicio al cliente?',
      answer: 'Puedes contactarnos a través de WhatsApp al +51 981 410 745, por correo electrónico a ermarlevh04@gmail.com, o mediante nuestras redes sociales. También puedes usar nuestro formulario de contacto disponible en la sección de Contacto de nuestra web.',
      category: 'general'
    },
    {
      id: 'q3',
      question: '¿Cuánto tiempo tardan en procesarse los pedidos?',
      answer: 'Procesamos los pedidos en un plazo de 1-2 días hábiles. Una vez procesado, recibirás una confirmación por email con la información de seguimiento de tu envío.',
      category: 'orders'
    },
    {
      id: 'q4',
      question: '¿Puedo modificar o cancelar mi pedido?',
      answer: 'Puedes modificar o cancelar tu pedido dentro de las primeras 2 horas después de realizar la compra. Para hacerlo, contacta inmediatamente a nuestro servicio de atención al cliente a través de WhatsApp o email.',
      category: 'orders'
    },
    {
      id: 'q5',
      question: '¿Cuáles son los métodos de pago aceptados?',
      answer: 'Aceptamos pagos con tarjetas de crédito y débito (Visa, Mastercard, American Express), transferencias bancarias y pagos a través de PayU. Todos nuestros pagos son procesados a través de plataformas seguras y encriptadas.',
      category: 'payment'
    },
    {
      id: 'q6',
      question: '¿Las transacciones son seguras?',
      answer: 'Sí, todas nuestras transacciones están protegidas con encriptación SSL de 256 bits, asegurando que tus datos personales y bancarios estén completamente seguros. Trabajamos con los procesadores de pago más confiables del mercado.',
      category: 'payment'
    },
    {
      id: 'q7',
      question: '¿Cuánto tiempo tarda el envío?',
      answer: 'Los tiempos de entrega dependen de tu ubicación. Para Lima Metropolitana, el tiempo estimado es de 1-3 días hábiles. Para provincias, el tiempo de entrega es de 3-7 días hábiles. Los envíos internacionales pueden tardar entre 7-15 días hábiles.',
      category: 'shipping'
    },
    {
      id: 'q8',
      question: '¿Realizan envíos internacionales?',
      answer: 'No, por el momento solo hacemos envios dentro de Perú.',
      category: 'shipping'
    },
    {
      id: 'q9',
      question: '¿Puedo hacer seguimiento a mi pedido?',
      answer: 'Sí, una vez que tu pedido haya sido despachado, podras ir a la sección Mis pedidos y desde ahi hacer segumiento a cada una de tus compras.',
      category: 'shipping'
    },
    {
      id: 'q10',
      question: '¿Cuál es la política de devoluciones?',
      answer: 'No aceptamos devoluciones salvo en casos excepcionales.',
      category: 'returns'
    },
    {
      id: 'q11',
      question: '¿Cómo inicio un proceso de devolución?',
      answer: 'Para iniciar una devolución, debes contactar a nuestro servicio de atención al cliente proporcionando tu número de pedido. Una vez aprobada la devolución, te enviaremos instrucciones detalladas sobre cómo proceder con el envío de vuelta.',
      category: 'returns'
    },
    {
      id: 'q12',
      question: '¿Cuánto tiempo toma recibir el reembolso?',
      answer: 'Una vez recibido y verificado el producto devuelto, procesamos el reembolso en un plazo de 3-5 días hábiles. El tiempo que tarde en reflejarse en tu cuenta dependerá de tu entidad bancaria, generalmente entre 3-10 días hábiles adicionales.',
      category: 'returns'
    },
    {
      id: 'q13',
      question: '¿Las prendas son fieles a las tallas estándar?',
      answer: 'Nuestras prendas siguen un estándar de tallaje peruano. Recomendamos revisar nuestra guía de tallas disponible en cada producto para encontrar el ajuste perfecto. Si tienes dudas específicas sobre algún producto, no dudes en contactarnos antes de realizar tu compra.',
      category: 'products'
    },
    {
        id: 'q20',
        question: '¿Con que tipos de fits cuentan?',
        answer: 'Contamos con 2, fit normal y fit oversize.',
        category: 'products'
      },
    {
      id: 'q14',
      question: '¿Los colores de los productos son exactamente como se ven en las fotos?',
      answer: 'Nos esforzamos por mostrar los colores de la manera más precisa posible, pero pueden existir ligeras variaciones debido a la configuración de pantalla de cada dispositivo. Si necesitas confirmar un color específico, puedes solicitarnos fotos adicionales del producto.',
      category: 'products'
    },
    {
      id: 'q15',
      question: '¿Cómo puedo cuidar mis prendas de EndStore?',
      answer: 'Recomendamos lavar nuestras prendas a mano o en ciclo delicado con agua fría, usar detergentes suaves, no usar blanqueadores, secar a la sombra y planchar a baja temperatura. Cada prenda incluye una etiqueta con instrucciones específicas de cuidado.',
      category: 'products'
    }
  ];

  // Filter questions based on active category and search query
  useEffect(() => {
    let filtered = faqs;
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
      
      // Auto-expand questions that match the search
      setExpandedIds(filtered.map(faq => faq.id));
      
      // Highlight the first matching question
      if (filtered.length > 0 && !highlightedQuestion) {
        setHighlightedQuestion(filtered[0].id);
        setTimeout(() => setHighlightedQuestion(null), 2000);
      }
    }
    
    setFilteredQuestions(filtered);
  }, [activeCategory, searchQuery]);

  const toggleQuestion = (id) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <>
      <AnnouncementBar />
      <div className={styles.faqsContainer}>
        <motion.div 
          className={styles.heroSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Preguntas Frecuentes</h1>
          <p>Encuentra respuestas a las dudas más comunes sobre nuestros productos y servicios</p>
          
          <div className={styles.searchWrapper}>
            <input
              type="search"
              placeholder="Buscar preguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button className={styles.searchButton}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </motion.div>
        
        <div className={styles.faqsContent}>
          <motion.aside 
            className={styles.categoriesSidebar}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2>Categorías</h2>
            <ul className={styles.categoriesList}>
              {categories.map(category => (
                <li 
                  key={category.id}
                  className={activeCategory === category.id ? styles.active : ''}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <i className={`fas ${category.icon}`}></i>
                  <span>{category.name}</span>
                  {activeCategory === category.id && (
                    <motion.div 
                      className={styles.activeBubble}
                      layoutId="activeBubble"
                    />
                  )}
                </li>
              ))}
            </ul>
            
            <div className={styles.contactHelp}>
              <h3>¿No encuentras tu respuesta?</h3>
              <p>Nuestro equipo está listo para ayudarte con cualquier duda adicional.</p>
              <Link to="/contacto" className={styles.contactLink}>
                Contáctanos <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </motion.aside>
          
          <motion.div 
            className={styles.questionsSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2>{categories.find(cat => cat.id === activeCategory)?.name || 'Todas las preguntas'}</h2>
            
            {filteredQuestions.length > 0 ? (
              <div className={styles.questionsList}>
                {filteredQuestions.map((faq) => (
                  <motion.div
                    key={faq.id}
                    className={`${styles.questionCard} ${expandedIds.includes(faq.id) ? styles.expanded : ''} ${highlightedQuestion === faq.id ? styles.highlight : ''}`}
                    onClick={() => toggleQuestion(faq.id)}
                    initial={false}
                    animate={{
                      backgroundColor: highlightedQuestion === faq.id ? 'rgba(225, 6, 0, 0.1)' : 'var(--card-bg)'
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className={styles.questionHeader}>
                      <h3>{faq.question}</h3>
                      <motion.div
                        className={styles.expandIcon}
                        animate={{ rotate: expandedIds.includes(faq.id) ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <i className="fas fa-chevron-down"></i>
                      </motion.div>
                    </div>
                    
                    <AnimatePresence>
                      {expandedIds.includes(faq.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className={styles.answerWrapper}
                        >
                          <div className={styles.answerContent}>
                            <p>{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>
                  <i className="fas fa-search"></i>
                </div>
                <h3>No encontramos resultados</h3>
                <p>Intenta con otra búsqueda o categoría</p>
              </div>
            )}
          </motion.div>
        </div>
        
        <section className={styles.additionalHelp}>
          <h2>¿Necesitas más ayuda?</h2>
          
          <div className={styles.helpOptions}>
            <motion.div 
              className={styles.helpCard}
              whileHover={{ y: -10, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            >
              <div className={styles.helpIcon}>
                <i className="fas fa-comments"></i>
              </div>
              <h3>Chat en vivo</h3>
              <p>Habla con nuestro equipo de atención al cliente en tiempo real a través de WhatsApp.</p>
              <a href="https://wa.me/51972460736" target="_blank" rel="noopener noreferrer" className={styles.helpButton}>
                Iniciar chat
              </a>
            </motion.div>
            
            <motion.div 
              className={styles.helpCard}
              whileHover={{ y: -10, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            >
              <div className={styles.helpIcon}>
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Email</h3>
              <p>Envíanos un correo con tu consulta y te responderemos en un máximo de 24 horas.</p>
              <a href="mailto:kontechnology@gmail.com" className={styles.helpButton}>
                Enviar email
              </a>
            </motion.div>
            
            <motion.div 
              className={styles.helpCard}
              whileHover={{ y: -10, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            >
              <div className={styles.helpIcon}>
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3>Contacto</h3>
              <p>Encuentra toda nuestra información de contacto y formulario de consultas.</p>
              <Link to="/contacto" className={styles.helpButton}>
                Ver contacto
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default FAQs;