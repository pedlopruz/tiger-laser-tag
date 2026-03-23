// src/components/admin/StatsCards.jsx
import { useState, useEffect } from 'react';
import { Calendar, Users, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { supabaseAdmin } from '../../../api/supabaseAdmin';

export default function StatsCards() {
  const [stats, setStats] = useState({
    totalReservations: 0,
    totalRevenue: 0,
    averagePeople: 0,
    todayReservations: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate, prevStartDate;
      
      if (period === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        prevStartDate = new Date(now.setDate(now.getDate() - 14)).toISOString();
      } else if (period === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        prevStartDate = new Date(now.setMonth(now.getMonth() - 2)).toISOString();
      } else {
        startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
        prevStartDate = new Date(now.setFullYear(now.getFullYear() - 2)).toISOString();
      }

      // Reservas totales del período
      const { data: reservations, error } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .gte('created_at', startDate)
        .eq('status', 'confirmed');

      if (error) throw error;

      // Reservas del período anterior para crecimiento
      const { data: prevReservations } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .gte('created_at', prevStartDate)
        .lt('created_at', startDate)
        .eq('status', 'confirmed');

      // Reservas de hoy
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRes } = await supabaseAdmin
        .from('reservations')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .eq('status', 'confirmed');

      const totalReservations = reservations?.length || 0;
      const totalRevenue = reservations?.reduce((sum, r) => sum + (r.precio_total || 0), 0) || 0;
      const averagePeople = reservations?.reduce((sum, r) => sum + (r.people || 0), 0) / totalReservations || 0;
      const todayReservations = todayRes?.length || 0;
      
      const prevTotal = prevReservations?.length || 0;
      const monthlyGrowth = prevTotal === 0 ? 100 : ((totalReservations - prevTotal) / prevTotal) * 100;

      setStats({
        totalReservations,
        totalRevenue,
        averagePeople: Math.round(averagePeople),
        todayReservations,
        monthlyGrowth: Math.round(monthlyGrowth)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Reservas Totales',
      value: stats.totalReservations,
      icon: Calendar,
      color: 'bg-blue-500',
      change: stats.monthlyGrowth,
      suffix: 'reservas'
    },
    {
      title: 'Ingresos Totales',
      value: `€${stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'bg-green-500',
      change: stats.monthlyGrowth,
      suffix: '€'
    },
    {
      title: 'Promedio por Reserva',
      value: stats.averagePeople,
      icon: Users,
      color: 'bg-orange-500',
      suffix: 'personas'
    },
    {
      title: 'Reservas Hoy',
      value: stats.todayReservations,
      icon: TrendingUp,
      color: 'bg-purple-500',
      suffix: 'hoy'
    }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tiger-orange"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <div className="flex justify-end">
        <div className="bg-white rounded-lg shadow-sm p-1 flex gap-1">
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === p 
                  ? 'bg-tiger-green text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p === 'week' ? 'Última semana' : p === 'month' ? 'Último mes' : 'Último año'}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg text-white`}>
                <card.icon size={20} />
              </div>
              {card.change !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${
                  card.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {Math.abs(card.change)}%
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.title}</p>
            {card.suffix && (
              <p className="text-xs text-gray-400 mt-2">{card.suffix}</p>
            )}
          </div>
        ))}
      </div>

      {/* Gráfico simple de tendencia */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-tiger-green mb-4">Tendencia de Reservas</h3>
        <div className="h-64 flex items-end gap-2">
          {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 90].map((height, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-tiger-orange/70 hover:bg-tiger-orange transition-all rounded-t"
                style={{ height: `${height}%` }}
              />
              <span className="text-xs text-gray-500 rotate-45 origin-top-left">
                {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i]}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">Datos simulados para demostración</p>
      </div>
    </div>
  );
}