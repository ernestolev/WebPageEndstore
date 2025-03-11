import React, { useState, useEffect } from 'react';
import { db } from '../../Firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import styles from '../../styles/Dashboard.module.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  // Estados para almacenar datos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingOrders: 0,
    activeUsers: 0,
    monthSales: 0,
    totalOrders: 0,
    productsByCategory: [],
    recentOrders: [],
    salesData: [],
    lowStockProducts: []
  });

  // Estado para controlar el periodo de las gráficas
  const [timeRange, setTimeRange] = useState('7days');

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Obtener total de productos
        const productsSnapshot = await getDocs(collection(db, 'Productos'));
        const productsCount = productsSnapshot.size;
        const products = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Agrupar productos por categoría
        const categoryCounts = products.reduce((acc, product) => {
          const category = product.category || 'Sin categoría';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});

        const productsByCategory = Object.entries(categoryCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        // Productos con stock bajo
        const lowStockProducts = products
          .filter(product => {
            if (!product.hasSizes) return product.stock <= 5;
            if (product.sizes) {
              return Object.values(product.sizes).some(stock => stock <= 5);
            }
            return false;
          })
          .slice(0, 5);

        // Obtener usuarios activos
        const usersSnapshot = await getDocs(collection(db, 'Users'));
        const usersCount = usersSnapshot.size;

        // Obtener pedidos pendientes (pagados pero no enviados/entregados)
        const pendingOrdersQuery = query(
          collection(db, 'Orders'),
          where('trackingStatus', '==', 'aceptado')
        );

        const pendingOrdersSnapshot = await getDocs(pendingOrdersQuery);
        const pendingOrdersCount = pendingOrdersSnapshot.size;

        // Obtener todos los pedidos
        const ordersSnapshot = await getDocs(
          query(collection(db, 'Orders'), orderBy('createdAt', 'desc'))
        );

        const orders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        // Consulta directa para órdenes pagadas
        const paidOrdersQuery = query(
          collection(db, 'Orders'),
          where('status', '==', 'PAID')
        );
        const paidOrdersSnapshot = await getDocs(paidOrdersQuery);
        const paidOrders = paidOrdersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        console.log("Órdenes pagadas encontradas:", paidOrders.length);

        const totalPaidOrders = paidOrders.length;

        // Calcular ventas del mes (solo órdenes PAID)
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const monthSales = paidOrders
          .filter(order => {
            const orderDate = order.createdAt;
            return orderDate >= monthStart && orderDate <= monthEnd;
          })
          .reduce((total, order) => total + (Number(order.total) || 0), 0);

        // Obtener pedidos recientes para mostrar
        const recentOrders = orders
          .filter(order => ['PAID', 'paid', 'processing', 'delivered', 'shipped'].includes(order.status))
          .slice(0, 5);

        // Preparar datos para gráficas basados en el rango de tiempo seleccionado
        const daysToInclude = timeRange === '30days' ? 30 : timeRange === '7days' ? 7 : 14;
        let salesData = [];

        // Crear array con fechas para el rango seleccionado - solo PAID
        for (let i = daysToInclude - 1; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const formattedDate = format(date, 'yyyy-MM-dd');
          const dayOrders = paidOrders.filter(order => {
            const orderDate = format(order.createdAt, 'yyyy-MM-dd');
            return orderDate === formattedDate;
          });

          const daySales = dayOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

          salesData.push({
            date: formattedDate,
            sales: daySales,
            orders: dayOrders.length
          });
        }

        setStats({
          totalProducts: productsCount,
          pendingOrders: pendingOrdersCount,
          activeUsers: usersCount,
          monthSales: monthSales,
          totalOrders: totalPaidOrders,
          productsByCategory,
          recentOrders,
          salesData,
          lowStockProducts
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  // Preparar datos para la gráfica de ventas
  const salesChartData = {
    labels: stats.salesData.map(d => format(parseISO(d.date), 'dd MMM', { locale: es })),
    datasets: [
      {
        label: 'Ventas (S/.)',
        data: stats.salesData.map(d => d.sales),
        borderColor: '#e10600',
        backgroundColor: 'rgba(225, 6, 0, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Preparar datos para la gráfica de pedidos
  const ordersChartData = {
    labels: stats.salesData.map(d => format(parseISO(d.date), 'dd MMM', { locale: es })),
    datasets: [
      {
        label: 'Pedidos',
        data: stats.salesData.map(d => d.orders),
        backgroundColor: '#3f51b5',
        barThickness: 10,
        borderRadius: 4
      }
    ]
  };

  // Preparar datos para la gráfica de categorías
  const categoryChartData = {
    labels: stats.productsByCategory.slice(0, 5).map(c => c.name),
    datasets: [
      {
        data: stats.productsByCategory.slice(0, 5).map(c => c.count),
        backgroundColor: [
          '#e10600',
          '#f44336',
          '#ff9e80',
          '#ffab91',
          '#ffccbc'
        ],
        borderWidth: 0
      }
    ]
  };

  // Opciones para las gráficas
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function (context) {
            return `Ventas: S/. ${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 15
        }
      }
    },
    cutout: '70%'
  };

  // Variants para animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Cargando datos del dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-circle"></i>
        <h3>Error al cargar los datos</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.dashboardContainer}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className={styles.dashboardHeader}>
        <h2>Dashboard</h2>
        <div className={styles.dateInfo}>
          <i className="fas fa-calendar-alt"></i>
          <span>{format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
        </div>
      </div>

      <motion.div className={styles.statsGrid} variants={itemVariants}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(0, 150, 136, 0.1)' }}>
            <i className="fas fa-dollar-sign" style={{ color: '#009688' }}></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Ventas Confirmadas del Mes</h3>
            <p>S/. {stats.monthSales.toFixed(2)}</p>
            <div className={styles.statLink}>
              <Link to="/admin/orders">Ver detalles</Link>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(255, 145, 0, 0.1)' }}>
            <i className="fas fa-shopping-bag" style={{ color: '#ff9100' }}></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Pedidos Aceptados</h3>
            <p>{stats.pendingOrders}</p>
            <div className={styles.statLink}>
              <Link to="/admin/orders">Ver pedidos</Link>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(63, 81, 181, 0.1)' }}>
            <i className="fas fa-users" style={{ color: '#3f51b5' }}></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Usuarios Activos</h3>
            <p>{stats.activeUsers}</p>
            <div className={styles.statLink}>
              <Link to="/admin/users">Ver usuarios</Link>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'rgba(225, 6, 0, 0.1)' }}>
            <i className="fas fa-shopping-cart" style={{ color: '#e10600' }}></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Total Pedidos Pagados</h3>
            <p>{stats.totalOrders}</p>
            <div className={styles.statLink}>
              <Link to="/admin/orders">Ver pedidos</Link>
            </div>
          </div>
        </div>
      </motion.div>

      <div className={styles.dashboardContent}>
        <motion.div className={styles.graphSection} variants={itemVariants}>
          <div className={styles.sectionHeader}>
            <h3>Ventas Recientes</h3>
            <div className={styles.timeRangeSelector}>
              <button
                className={timeRange === '7days' ? styles.active : ''}
                onClick={() => setTimeRange('7days')}
              >
                7 días
              </button>
              <button
                className={timeRange === '14days' ? styles.active : ''}
                onClick={() => setTimeRange('14days')}
              >
                14 días
              </button>
              <button
                className={timeRange === '30days' ? styles.active : ''}
                onClick={() => setTimeRange('30days')}
              >
                30 días
              </button>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <Line data={salesChartData} options={lineChartOptions} height={250} />
          </div>

          <div className={styles.insightRow}>
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <h4>Total Pedidos Pagados</h4>
                <i className="fas fa-shopping-cart"></i>
              </div>
              <p className={styles.insightValue}>{stats.totalOrders}</p>
              <div className={styles.insightChart}>
                <Bar data={ordersChartData} options={barChartOptions} height={100} />
              </div>
            </div>

            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <h4>Productos por Categoría</h4>
                <i className="fas fa-chart-pie"></i>
              </div>
              <div className={styles.doughnutContainer}>
                <Doughnut data={categoryChartData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </motion.div>

        <div className={styles.dashboardSidebar}>
          <motion.div className={styles.quickActions} variants={itemVariants}>
            <h3>Acciones Rápidas</h3>
            <div className={styles.actionButtons}>
              <Link to="/admin/products/new" className={styles.actionButton}>
                <i className="fas fa-plus"></i>
                <span>Nuevo Producto</span>
              </Link>
              <Link to="/admin/codigos" className={styles.actionButton}>
                <i className="fas fa-ticket-alt"></i>
                <span>Crear Código</span>
              </Link>
              <Link to="/admin/orders" className={styles.actionButton}>
                <i className="fas fa-tasks"></i>
                <span>Gestionar Pedidos</span>
              </Link>
              <Link to="/admin/categorias" className={styles.actionButton}>
                <i className="fas fa-layer-group"></i>
                <span>Categorías</span>
              </Link>
            </div>
          </motion.div>

          <motion.div className={styles.recentOrders} variants={itemVariants}>
            <h3>
              <div className={styles.sectionTitle}>
                <i className="fas fa-shopping-bag"></i>
                Pedidos Recientes
              </div>
            </h3>
            {stats.recentOrders.length > 0 ? (
              <ul className={styles.ordersList}>
                {stats.recentOrders.map(order => (
                  <li
                    key={order.id}
                    className={`${styles.orderItem} ${order.status === 'PAID' || order.status === 'paid' ? styles.paid :
                      order.status === 'processing' ? styles.processing :
                        order.status === 'delivered' ? styles.delivered :
                          order.status === 'cancelled' ? styles.cancelled : ''
                      }`}
                  >
                    <div className={`${styles.orderStatus} ${order.status === 'PAID' || order.status === 'paid' ? styles.paid :
                      order.status === 'processing' ? styles.processing :
                        order.status === 'delivered' ? styles.delivered :
                          order.status === 'cancelled' ? styles.cancelled : ''
                      }`}></div>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderTopRow}>
                        <span className={styles.orderId}>{order.id}</span>
                        <span className={styles.orderDate}>
                          {format(order.createdAt, 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <div className={styles.orderBottomRow}>
                        <span className={styles.orderCustomer}>
                          <i className="fas fa-user"></i>
                          {order.shipping?.firstName || 'Cliente'}
                        </span>
                        <span className={styles.orderPrice}>S/. {Number(order.total).toFixed(2)}</span>
                      </div>
                    </div>
                    <Link to={`/admin/orders/${order.id}`} className={styles.viewOrder}>
                      <i className="fas fa-eye"></i>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.noOrdersMessage}>
                <i className="fas fa-inbox"></i>
                <p>No hay pedidos recientes</p>
              </div>
            )}
          </motion.div>

          <motion.div className={styles.lowStock} variants={itemVariants}>
            <h3>
              <div className={styles.sectionTitle}>
                <i className="fas fa-exclamation-triangle"></i>
                Stock Bajo
              </div>
            </h3>
            {stats.lowStockProducts.length > 0 ? (
              <ul className={styles.productsList}>
                {stats.lowStockProducts.map(product => (
                  <li key={product.id} className={styles.productItem}>
                    <div className={styles.productThumb}>
                      {product.images && product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} />
                      ) : (
                        <div className={styles.noImage}>
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                    <div className={styles.productInfo}>
                      <h4 className={styles.productName}>{product.name}</h4>
                      {product.hasSizes ? (
                        <div className={styles.sizeStock}>
                          {Object.entries(product.sizes || {}).map(([size, stock]) => (
                            <span key={size} className={`${styles.sizeTag} ${stock <= 2 ? styles.critical : ''}`}>
                              {size}: {stock}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className={`${styles.stockCount} ${product.stock <= 2 ? styles.critical : ''}`}>
                          Stock: {product.stock}
                        </p>
                      )}
                    </div>
                    <Link to={`/admin/products/edit/${product.id}`} className={styles.editProduct}>
                      <i className="fas fa-edit"></i>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <i className="fas fa-check-circle"></i>
                <p>Todos los productos tienen stock suficiente</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;