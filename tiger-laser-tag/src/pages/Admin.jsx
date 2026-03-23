// src/pages/Admin.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLogin from '../components/admin/AdminLogin';
import AdminLayout from '../components/admin/AdminLayout';
import { Helmet } from 'react-helmet';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const loginTime = localStorage.getItem('adminLoginTime');
    
    if (token && loginTime && (Date.now() - parseInt(loginTime) < 24 * 60 * 60 * 1000)) {
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminLoginTime');
      navigate('/admin/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-tiger-green to-tiger-green-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiger-golden"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <>
      <Helmet>
        <title>Panel de Administración - Tiger Laser Tag</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout />
    </>
  );
}