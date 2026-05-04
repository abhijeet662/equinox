import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import Footer from '../components/layout/Footer';

const PublicLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-white">
    <PublicNavbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default PublicLayout;
