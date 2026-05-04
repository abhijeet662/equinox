import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="text-9xl font-extrabold text-surface-200 mb-4">404</div>
      <h1 className="text-2xl font-bold text-surface-800 mb-2">Page not found</h1>
      <p className="text-surface-500 mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary text-sm"><Home size={16} /> Go Home</Link>
    </div>
  </div>
);

export default NotFoundPage;
