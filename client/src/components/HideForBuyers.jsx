import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirects authenticated buyers away from seller-focused pages
// Renders children for guests, sellers, and admins
export default function HideForBuyers({ children, redirectTo = '/marketplace' }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const isBuyer = isAuthenticated && user?.role === 'buyer';

  // Allow buyers through if explicitly arriving with an upgrade intent
  try {
    const params = new URLSearchParams(location.search);
    if (isBuyer && (params.get('upgrade') === 'seller' || params.get('upgrade') === '1' || params.has('upgrade'))) {
      return children;
    }
  } catch {}

  if (isBuyer) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
