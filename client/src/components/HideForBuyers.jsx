import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirects authenticated buyers away from seller-focused pages
// Renders children for guests, sellers, and admins
export default function HideForBuyers({ children, redirectTo = '/marketplace' }) {
  const { isAuthenticated, user } = useAuth();
  const isBuyer = isAuthenticated && user?.role === 'buyer';

  if (isBuyer) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
