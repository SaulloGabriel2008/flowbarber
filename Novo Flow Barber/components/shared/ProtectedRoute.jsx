'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/hooks/useAuth';
import { useUser } from '@/lib/firebase/hooks/useUser';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();
  const { role, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading || userLoading) return;

    // Não autenticado
    if (!user) {
      router.push('/login');
      return;
    }

    // Verificar role se necessário
    if (requiredRole && role !== requiredRole && role !== 'admin') {
      router.push('/'); // Redirecionar para home
      return;
    }
  }, [user, role, loading, userLoading, router, requiredRole]);

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && role !== requiredRole && role !== 'admin') return null;

  return children;
};

export default ProtectedRoute;
