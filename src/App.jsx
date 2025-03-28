import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Catalogo from './pages/Catalog';
import Cart from './pages/Cart';
import About from './pages/About';
import styles from './styles/App.module.css';
import Navbar from './components/Navbar';
import SmoothScroll from './components/SmoothScroll';
import Footer from './components/Footer';
import AdminRoute from './components/AdminRoute';
import Admin from './pages/admin/Admin';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import { useAuth } from './context/AuthContext';
import { useState, useEffect } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import ProductDetail from './pages/ProductDetail';
import Categorias from './pages/Admin/Categorias';
import CartSlideout from './components/CartSlideout';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import Orders from './pages/admin/Orders';
import OrderSuccess from './pages/OrderSuccess';
import LibroReclamaciones from './pages/LibroReclamaciones';
import PoliticasCambios from './pages/PoliticasCambios';
import PoliticasPriv from './pages/PoliticasPriv';
import TerminosCondiciones from './pages/T&C';
import Cookies from './pages/Cookies';
import PaymentResponse from './pages/PaymentResponse';
import MisPedidos from './pages/MisPedidos';
import Users from './pages/admin/Users';
import ResetPassword from './pages/ResetPassword';
import SobreNosotros from './pages/SobreNosotros';
import ScrollToTopButton from './components/ScrollToTopButton';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import Contacto from './pages/Contacto';
import MisFavoritos from './pages/MisFavoritos';
import FAQs from './pages/FAQs';
import Codigos from './pages/admin/Codigos';
import Reclamos from './pages/admin/Reclamos';
import Mensajes from './pages/admin/Mensajes';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { loading } = useAuth();

  useEffect(() => {
    // Reset scroll position when route changes
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, [location]);

  return (
    <div className={styles.app}>
      {!isAdminRoute && <Navbar />}
      <main className={styles.mainContent}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Set initial loading timer
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2000);

    // Handle theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);

    // Cleanup function
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Reset any scroll locks when routes change
    const resetScrollBehavior = () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };

    // Clean up any scroll behavior modifications
    window.addEventListener('beforeunload', resetScrollBehavior);
    return () => {
      window.removeEventListener('beforeunload', resetScrollBehavior);
      resetScrollBehavior();
    };
  }, []);

  if (initialLoading) {
    return (
      <ThemeProvider>
        <LoadingSpinner />
      </ThemeProvider>
    );
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <SmoothScroll />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              limit={3}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/about" element={<About />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                <Route path="/payment-response" element={<PaymentResponse />} />
                <Route path="/libro-reclamaciones" element={<LibroReclamaciones />} />
                <Route path="/politicas-cambios" element={<PoliticasCambios />} />
                <Route path="/orders" element={<MisPedidos />} />
                <Route path="/privacy" element={<PoliticasPriv />} />
                <Route path="/terms" element={<TerminosCondiciones />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/sobre-nosotros" element={<SobreNosotros />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/favoritos" element={<MisFavoritos />} />
                <Route path="/faqs" element={<FAQs />} />

                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="categorias" element={<Categorias />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="users" element={<Users />} />
                  <Route path="mensajes" element={<Mensajes />} /> 
                  <Route path="codigos" element={<Codigos />} />
                  <Route path="reclamos" element={<Reclamos />} /> 
                  <Route path="settings" element={<div>Settings Page</div>} />
                </Route>
              </Routes>
            </Layout>
            <ScrollToTopButton />
            <CartSlideout />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;