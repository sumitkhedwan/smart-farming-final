import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center" role="status">Checking your session…</div>;
  }

  if (!configured) return <Navigate to="/signin" replace state={{ from: location }} />;
  if (!user) return <Navigate to="/signin" replace state={{ from: location }} />;

  return <Outlet />;
}
