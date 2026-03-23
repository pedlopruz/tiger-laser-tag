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
    
    console.log("Admin.jsx - Verificando token");
    
    if (token && loginTime && (Date.now() - parseInt(loginTime) < 24 * 60 * 60 * 1000)) {
      console.log("Token válido");
      setIsAuthenticated(true);
    } else {
      console.log("Token inválido, limpiando");
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminLoginTime');
      setIsAuthenticated(false);
      // ❌ NO navegues aquí
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    console.log("handleLogin llamado");
    setIsAuthenticated(true);
    // ✅ No navegues, solo cambia el estado
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tiger-cream">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiger-orange"></div>
      </div>
    );
  }

  // ✅ Mostrar login directamente en la misma ruta
  if (!isAuthenticated) {
    console.log("Mostrando AdminLogin con onLogin");
    return <AdminLogin onLogin={handleLogin} />;
  }

  console.log("Mostrando AdminLayout");
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