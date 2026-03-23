// src/components/admin/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  LogOut,
  BarChart3,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReservationsList from './ReservationsList';
import CalendarView from './CalendarView';
import StatsCards from './StatsCards';
import SettingsPanel from './SettingsPanel';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reservations');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState('Administrador');

  useEffect(() => {
    // Cargar nombre del admin desde localStorage si existe
    const savedName = localStorage.getItem('adminName');
    if (savedName) setAdminName(savedName);
  }, []);

const handleLogout = async () => {
  try {
    // Opcional: Notificar al backend
    await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    });
  } catch (error) {
    console.error("Error en logout:", error);
  } finally {
    // Limpiar localStorage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminName');
    
    // Redirigir al login
    navigate('/admin');
  }
};

  const tabs = [
    { id: 'reservations', name: 'Reservas', icon: LayoutDashboard, color: 'text-tiger-orange' },
    { id: 'calendar', name: 'Calendario', icon: Calendar, color: 'text-tiger-green' },
    { id: 'stats', name: 'Estadísticas', icon: BarChart3, color: 'text-tiger-golden' },
    { id: 'settings', name: 'Configuración', icon: Settings, color: 'text-gray-500' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'reservations':
        return <ReservationsList />;
      case 'calendar':
        return <CalendarView />;
      case 'stats':
        return <StatsCards />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <ReservationsList />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-tiger-green to-tiger-green-dark shadow-lg sticky top-0 z-30">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-white hover:text-tiger-golden transition"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-tiger-golden/20 rounded-full flex items-center justify-center">
                  <span className="text-tiger-golden font-bold text-xl">T</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-tiger-golden">Tiger Laser Tag</h1>
                  <p className="text-xs text-tiger-cream/80">Panel de Administración</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-tiger-cream">Bienvenido,</p>
                <p className="text-sm font-semibold text-tiger-golden">{adminName}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-tiger-cream hover:text-white hover:bg-white/10"
              >
                <LogOut size={18} className="mr-2" />
                <span className="hidden md:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-20
          w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full flex flex-col">
            <nav className="flex-1 px-4 py-6 space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${activeTab === tab.id 
                      ? 'bg-tiger-green text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-tiger-green'}
                  `}
                >
                  <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : tab.color} />
                  <span className="font-medium">{tab.name}</span>
                  {activeTab === tab.id && (
                    <ChevronRight size={16} className="ml-auto" />
                  )}
                </button>
              ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 text-center">
                  Tiger Laser Tag<br />
                  {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay para móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}