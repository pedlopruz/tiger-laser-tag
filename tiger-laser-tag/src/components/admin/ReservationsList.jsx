// /components/admin/ReservationsList.jsx
import { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export default function ReservationsList() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadReservations();
  }, [filter, dateFilter]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      let query = supabaseAdmin
        .from('reservations')
        .select(`
          *,
          reservation_slots (
            slot_id,
            time_slots (start_time, date)
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      if (dateFilter) {
        query = query.eq('reservation_slots.time_slots.date', dateFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (id, reservationCode) => {
    if (!confirm(`¿Estás seguro de cancelar la reserva ${reservationCode}?`)) return;

    try {
      const { error } = await supabaseAdmin
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      
      alert('Reserva cancelada correctamente');
      loadReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Error al cancelar la reserva');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando reservas...</div>;
  }

  return (
    <div>
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 flex-wrap">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="all">Todas</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
          placeholder="Filtrar por fecha"
        />
        
        <button
          onClick={() => { setFilter('all'); setDateFilter(''); }}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Tabla de reservas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reservations.map((res) => (
              <tr key={res.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm">{res.reservation_code}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{res.name}</div>
                  <div className="text-sm text-gray-500">{res.email}</div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {res.reservation_slots?.[0]?.time_slots?.date || 'N/A'}
                  <br />
                  <span className="text-xs text-gray-500">
                    {res.reservation_slots?.[0]?.time_slots?.start_time?.slice(0,5)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{res.people}</td>
                <td className="px-6 py-4 text-sm font-medium">€{res.precio_total}</td>
                <td className="px-6 py-4">
                  <span className={`
                    px-2 py-1 text-xs rounded-full
                    ${res.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                    ${res.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {res.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {res.status === 'confirmed' && (
                    <button
                      onClick={() => cancelReservation(res.id, res.reservation_code)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {reservations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay reservas para mostrar
          </div>
        )}
      </div>
    </div>
  );
}