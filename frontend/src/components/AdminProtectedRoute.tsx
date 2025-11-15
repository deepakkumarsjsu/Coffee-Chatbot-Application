import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { currentUser, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;

