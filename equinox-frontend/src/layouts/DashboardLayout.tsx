import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useAppSelector';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { PageLoader } from '../components/ui/LoadingSpinner';

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAppSelector(s => s.auth);

  // Still restoring session from token — don't redirect yet
  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
