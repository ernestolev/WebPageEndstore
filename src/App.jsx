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
const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { loading } = useAuth();

  return (
    <div className={styles.app}>
      {!isAdminRoute && <Navbar />}
      {children}
      {!isAdminRoute && <Footer />}
    </div>
  );
};

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SmoothScroll />
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
                <Route path="users" element={<div>Users Page</div>} />
                <Route path="settings" element={<div>Settings Page</div>} />
              </Route>
            </Routes>
          </Layout>
          <CartSlideout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;