// /components/admin/AdminLayout.jsx
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reservations');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminLoginTime');
    navigate('/admin/login');
  };

  const tabs = [
    { id: 'reservations', name: 'Reservas', icon: '📋' },
    { id: 'calendar', name: 'Calendario', icon: '📅' },
    { id: 'stats', name: 'Estadísticas', icon: '📊' },
    { id: 'settings', name: 'Configuración', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-tiger-green text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Panel de Administración</h1>
              <span className="text-sm bg-white/20 px-3 py-1 rounded">Tiger Laser Tag</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Navegación */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-6 py-3 font-medium transition relative
                  ${activeTab === tab.id 
                    ? 'text-tiger-orange border-b-2 border-tiger-orange' 
                    : 'text-gray-600 hover:text-tiger-green'}
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                  {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'reservations' && <ReservationsList />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'stats' && <StatsCards />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}