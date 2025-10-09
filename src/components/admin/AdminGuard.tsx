'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/admin/login?redirect=/admin');
        return;
      }

      if (user?.role !== 'ADMIN') {
        router.push('/unauthorized');
        return;
      }

      setIsChecking(false);
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || isChecking) {
    return fallback || <AdminLoadingScreen />;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
};

const AdminLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Admin Access
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your credentials...
          </p>
        </div>
      </Card>
    </div>
  );
};

// Higher-order component for admin route protection
export function withAdminGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactNode;
    redirectTo?: string;
  }
) {
  return function AdminProtectedComponent(props: P) {
    return (
      <AdminGuard fallback={options?.fallback}>
        <Component {...props} />
      </AdminGuard>
    );
  };
}

export default AdminGuard;