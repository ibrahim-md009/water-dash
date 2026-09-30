import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingState fullscreen label="جارٍ التحقق من الحساب..." />;
  if (status !== 'authed') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
