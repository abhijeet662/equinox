import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
    <div className="w-full max-w-5xl">
      <Outlet />
      <p className="text-center text-xs text-surface-400 mt-5">
        © 2026 Equinox. <span className="hover:text-primary-600 cursor-pointer">Privacy</span> · <span className="hover:text-primary-600 cursor-pointer">Terms</span>
      </p>
    </div>
  </div>
);

export default AuthLayout;
