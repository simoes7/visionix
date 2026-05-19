import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loading from './Loading';

/**
 * ProtectedRoute — wraps routes that require authentication.
 * Pass adminOnly={true} for admin-only routes.
 */
const ProtectedRoute = ({ adminOnly = false, customerOnly = false, requireLogin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return <Loading />;

  // Case 1: Route requires login (e.g., Profile, Checkout, Admin)
  if (requireLogin || adminOnly) {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
  }

  // Case 2: Admin-only route
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Case 3: Customer-only route (Admins are blocked from these)
  if (customerOnly && isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
