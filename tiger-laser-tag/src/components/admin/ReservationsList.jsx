// src/components/admin/ReservationsList.jsx
import { useState, useEffect } from 'react';
import { Search, Filter, Calendar as CalendarIcon, X, Eye, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '@/components/ui/button';

export default function ReservationsList() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadReservations();
  }, [filter]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          plans(name, price),
          reservation_slots (
            slot_id,
            time_slots (
              start_time, 
              date
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let filteredData = data || [];
      
      if (dateFilter) {
        filteredData = filteredData.filter(reservation => {
          return reservation.reservation_slots?.some(slot => {
            const slotDate = slot.time_slots?.date;
            return slotDate === dateFilter;
          });
        });
      }
      
      setReservations(filteredData);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reservations.length > 0 || !loading) {
      const applyDateFilter = async () => {
        setLoading(true);
        try {
          let query = supabase
            .from('reservations')
            .select(`
              *,
              plans(name, price),
              reservation_slots (
                slot_id,
                time_slots (
                  start_time, 
                  date
                )
              )
            `)
            .order('created_at', { ascending: false });

          if (filter !== 'all') {
            query = query.eq('status', filter);
          }

          const { data, error } = await query;
          if (error) throw error;
          
          let filteredData = data || [];
          
          if (dateFilter) {
            filteredData = filteredData.filter(reservation => {
              return reservation.reservation_slots?.some(slot => {
                const slotDate = slot.time_slots?.date;
                return slotDate === dateFilter;
              });
            });
          }
          
          setReservations(filteredData);
        } catch (error) {
          console.error('Error loading reservations:', error);
        } finally {
          setLoading(false);
        }
      };
      
      applyDateFilter();
    }
  }, [dateFilter, filter]);

  const cancelReservation = async (id, reservationCode) => {
    if (!confirm(`¿Estás seguro de cancelar la reserva ${reservationCode}?`)) return;

    try {
      const { data, error } = await supabase
        .rpc('cancel_reservation', {
          p_reservation_id: id
        });

      if (error) throw error;
      alert('Reserva cancelada correctamente');
      loadReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Error al cancelar la reserva');
    }
  };

  const confirmReservation = async (id) => {
    if (!confirm('¿Confirmar esta reserva?')) return;

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (error) throw error;
      alert('Reserva confirmada');
      loadReservations();
    } catch (error) {
      console.error('Error confirming reservation:', error);
      alert('Error al confirmar la reserva');
    }
  };

  const filteredReservations = reservations.filter(res => {
    if (!searchTerm) return true;
    return res.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           res.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           res.reservation_code?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getSlotDate = (reservation) => {
    const slot = reservation.reservation_slots?.[0]?.time_slots;
    if (slot?.date) {
      const [year, month, day] = slot.date.split('-');
      return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
    return 'Fecha no disponible';
  };

  const getSlotTime = (reservation) => {
    const slot = reservation.reservation_slots?.[0]?.time_slots;
    if (slot?.start_time) {
      return slot.start_time.slice(0, 5);
    }
    return 'Hora no disponible';
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    const texts = {
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      pending: 'Pendiente'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${styles[status] || styles.pending}`}>
        {texts[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiger-orange mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-tiger-green mb-2">Gestión de Reservas</h2>
        <p className="text-gray-500">Administra y visualiza todas las reservas del sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, email o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-tiger-orange focus:border-tiger-orange"
              />
            </div>
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-tiger-orange"
          >
            <option value="all">Todas las reservas</option>
            <option value="confirmed">Confirmadas</option>
            <option value="pending">Pendientes</option>
            <option value="cancelled">Canceladas</option>
          </select>
          
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-tiger-orange"
            />
          </div>
          
          {(filter !== 'all' || dateFilter || searchTerm) && (
            <button
              onClick={() => { setFilter('all'); setDateFilter(''); setSearchTerm(''); }}
              className="text-gray-500 hover:text-red-500 transition flex items-center gap-1"
            >
              <X size={16} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla de reservas */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReservations.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-tiger-green">
                      {res.reservation_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{res.name}</div>
                    <div className="text-sm text-gray-500">{res.email}</div>
                    {res.phone && <div className="text-xs text-gray-400">{res.phone}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{getSlotDate(res)}</div>
                    <span className="text-xs text-gray-500">
                      {getSlotTime(res)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {res.plans?.name || 'No especificado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{res.people} personas</td>
                  <td className="px-6 py-4 text-sm font-medium">€{res.precio_total}</td>
                  <td className="px-6 py-4">{getStatusBadge(res.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedReservation(res);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Ver detalles"
                      >
                        <Eye size={18} />
                      </button>
                      {res.status !== 'confirmed' && res.status !== 'cancelled' && (
                        <button
                          onClick={() => confirmReservation(res.id)}
                          className="text-green-600 hover:text-green-800 transition"
                          title="Confirmar"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {res.status !== 'cancelled' && (
                        <button
                          onClick={() => cancelReservation(res.id, res.reservation_code)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Cancelar"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredReservations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay reservas para mostrar</p>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-tiger-green">Detalles de la reserva</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Código</label>
                    <p className="font-mono text-tiger-green">{selectedReservation.reservation_code}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Estado</label>
                    <div>{getStatusBadge(selectedReservation.status)}</div>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500">Cliente</label>
                  <p className="font-medium">{selectedReservation.name}</p>
                  <p className="text-sm">{selectedReservation.email}</p>
                  {selectedReservation.phone && <p className="text-sm">{selectedReservation.phone}</p>}
                </div>
                
                <div>
                  <label className="text-xs text-gray-500">Detalles de la partida</label>
                  <p>Fecha: {getSlotDate(selectedReservation)}</p>
                  <p>Hora: {getSlotTime(selectedReservation)}</p>
                  <p>Jugadores: {selectedReservation.people}</p>
                  <p>Participan en Electroshock: {selectedReservation.personas_electroshock}</p>
                  <p>Plan: {selectedReservation.plans?.name || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500">Total</label>
                  <p className="text-xl font-bold text-tiger-orange">€{selectedReservation.precio_total}</p>
                </div>
                
                {selectedReservation.menor_edad && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">⚠️ Hay menores de 15 años. Consentimiento requerido.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}