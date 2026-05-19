import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import WhatsAppButton from '../components/common/WhatsAppButton';
import ProtectedRoute from '../components/common/ProtectedRoute';
import Loading from '../components/common/Loading';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

// Public pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Shop from '../pages/Shop';
import ProductDetails from '../pages/ProductDetails';
import VirtualTryOn from '../pages/VirtualTryOn';
import Craftsmanship from '../pages/Craftsmanship';

// Protected pages
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Profile from '../pages/Profile';

// Admin pages
import Dashboard from '../pages/Admin/Dashboard';

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const isFullPage = ['/login', '/register'].includes(location.pathname) || 
                     location.pathname.startsWith('/try-on') || 
                     location.pathname.startsWith('/admin');

  useEffect(() => {
    const selector = 'main, section, article, [data-scroll-reveal]';
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    const observeTargets = () => {
      Array.from(document.querySelectorAll(selector)).forEach((el) => {
        if (!el.classList.contains('revealed')) {
          observer.observe(el);
        }
      });
    };

    observeTargets();
    const rafId = window.requestAnimationFrame(observeTargets);
    const timeoutId = window.setTimeout(observeTargets, 200);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [location.pathname]);

  const { settings } = useSettings();

  return (
    <>
      {!isFullPage && <Navbar />}
      {children}
      {!isFullPage && <Footer />}
      {!isFullPage && <WhatsAppButton />}
    </>
  );
};

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <BrowserRouter>
      <LayoutWrapper>
        <Routes>
          {/* Public (but restricted for Admins) */}
          <Route element={<ProtectedRoute customerOnly />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/try-on/:productId?" element={<VirtualTryOn />} />
            <Route path="/about" element={<Craftsmanship />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected (logged-in CUSTOMERS only) */}
          <Route element={<ProtectedRoute customerOnly requireLogin />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<Dashboard />} />
          </Route>
        </Routes>
      </LayoutWrapper>
    </BrowserRouter>
  );
};

export default AppRoutes;
