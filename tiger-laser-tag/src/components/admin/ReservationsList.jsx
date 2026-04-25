// src/components/admin/ReservationsList.jsx
import { useState, useEffect } from 'react';
import { Search, Filter, Calendar as CalendarIcon, X, Eye, Trash2, CheckCircle, Clock, RotateCcw } from 'lucide-react';
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
  const [reactivateLoading, setReactivateLoading] = useState({});

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
          plans(name, price, num_slots, active),
          reservation_slots (
            slot_id,
            time_slots (
              id,
              start_time, 
              end_time,
              date,
              status,
              capacity,
              reserved,
              shared_plan_id
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
              plans(name, price, num_slots, active),
              reservation_slots (
                slot_id,
                time_slots (
                  id,
                  start_time, 
                  end_time,
                  date,
                  status,
                  capacity,
                  reserved,
                  shared_plan_id
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

  // ✅ Cancelar reserva (maneja normal y compartida)
  const cancelReservation = async (id, reservationCode) => {
    if (!confirm(`¿Estás seguro de cancelar la reserva ${reservationCode}?`)) return;

    try {
      // Primero obtener la reserva para saber si es compartida
      const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select(`
          id,
          people,
          plan_id,
          plans(active),
          reservation_slots(slot_id)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const isSharedPlan = reservation.plans?.active === false;
      const slotIds = reservation.reservation_slots?.map(rs => rs.slot_id) || [];

      if (isSharedPlan) {
        // ✅ Cancelar reserva compartida: restar reserved
        for (const slotId of slotIds) {
          const { data: slot, error: slotError } = await supabase
            .from('time_slots')
            .select('reserved')
            .eq('id', slotId)
            .single();

          if (slotError) throw slotError;

          const newReserved = Math.max((slot.reserved || 0) - reservation.people, 0);
          
          const { error: updateError } = await supabase
            .from('time_slots')
            .update({ reserved: newReserved })
            .eq('id', slotId);

          if (updateError) throw updateError;
        }
      } else {
        // ✅ Cancelar reserva normal: liberar slots
        if (slotIds.length > 0) {
          const { error: slotError } = await supabase
            .from('time_slots')
            .update({ status: 'active' })
            .in('id', slotIds);

          if (slotError) throw slotError;
        }
      }

      // Cambiar estado de la reserva a cancelled
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (updateError) throw updateError;

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

  // ✅ Reactivar una reserva cancelada (maneja normal y compartida)
  const reactivateReservation = async (reservation) => {
    const slotIds = reservation.reservation_slots?.map(rs => rs.slot_id) || [];
    
    if (slotIds.length === 0) {
      alert('Esta reserva no tiene slots asociados');
      return;
    }

    if (!confirm(`¿Reactivar la reserva ${reservation.reservation_code}? Se verificará que los horarios estén disponibles.`)) return;

    setReactivateLoading(prev => ({ ...prev, [reservation.id]: true }));

    try {
      // Obtener información de los slots
      const { data: slots, error: slotsError } = await supabase
        .from('time_slots')
        .select('id, status, start_time, date, shared_plan_id, capacity, reserved')
        .in('id', slotIds);

      if (slotsError) throw slotsError;

      const isSharedPlan = reservation.plans?.active === false;
      const people = reservation.people || 1;

      if (isSharedPlan) {
        // ✅ RESERVA COMPARTIDA: Verificar capacidad disponible
        for (const slot of slots) {
          const availableSpots = (slot.capacity || 0) - (slot.reserved || 0);
          
          if (availableSpots < people) {
            alert(`No se puede reactivar la reserva. El horario ${slot.start_time?.slice(0, 5)} solo tiene ${availableSpots} plazas disponibles y necesitas ${people}.`);
            setReactivateLoading(prev => ({ ...prev, [reservation.id]: false }));
            return;
          }
        }

        // Reactivar reserva compartida: cambiar estado a 'confirmed'
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ status: 'confirmed' })
          .eq('id', reservation.id);

        if (updateError) throw updateError;

        // Incrementar reserved en cada slot compartido
        for (const slot of slots) {
          const { error: incrementError } = await supabase
            .from('time_slots')
            .update({ reserved: (slot.reserved || 0) + people })
            .eq('id', slot.id);

          if (incrementError) throw incrementError;
        }

        alert('✅ Reserva compartida reactivada correctamente');

      } else {
        // ✅ RESERVA NORMAL: Verificar slots activos
        const unavailableSlots = slots.filter(slot => slot.status !== 'active');
        
        if (unavailableSlots.length > 0) {
          const unavailableTimes = unavailableSlots.map(slot => 
            `${slot.date} ${slot.start_time?.slice(0, 5)}`
          ).join(', ');
          alert(`No se puede reactivar la reserva porque los siguientes horarios no están disponibles:\n${unavailableTimes}`);
          setReactivateLoading(prev => ({ ...prev, [reservation.id]: false }));
          return;
        }

        // Verificar conflictos con otras reservas activas
        const { data: conflictingReservations, error: conflictError } = await supabase
          .from('reservation_slots')
          .select(`
            reservation_id,
            reservations!inner(status)
          `)
          .in('slot_id', slotIds)
          .neq('reservation_id', reservation.id)
          .eq('reservations.status', 'confirmed');

        if (conflictError) throw conflictError;

        if (conflictingReservations && conflictingReservations.length > 0) {
          alert('No se puede reactivar la reserva porque hay conflictos con otras reservas confirmadas en los mismos horarios.');
          setReactivateLoading(prev => ({ ...prev, [reservation.id]: false }));
          return;
        }

        // Reactivar reserva normal: cambiar estado a 'pending'
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ status: 'pending' })
          .eq('id', reservation.id);

        if (updateError) throw updateError;

        // Bloquear los slots nuevamente
        const { error: blockError } = await supabase
          .from('time_slots')
          .update({ status: 'blocked' })
          .in('id', slotIds);

        if (blockError) throw blockError;

        alert('✅ Reserva reactivada correctamente');
      }

      loadReservations();
    } catch (error) {
      console.error('Error reactivating reservation:', error);
      alert('Error al reactivar la reserva');
    } finally {
      setReactivateLoading(prev => ({ ...prev, [reservation.id]: false }));
    }
  };

  // ✅ MOVER filteredReservations AQUÍ - antes del return
  const filteredReservations = reservations.filter(res => {
    if (!searchTerm) return true;
    return res.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           res.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           res.reservation_code?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Función para obtener todos los slots ordenados
  const getSlotsInfo = (reservation) => {
    const slots = reservation.reservation_slots || [];
    const sortedSlots = [...slots].sort((a, b) => {
      const timeA = a.time_slots?.start_time || '';
      const timeB = b.time_slots?.start_time || '';
      return timeA.localeCompare(timeB);
    });
    
    return sortedSlots.map(slot => ({
      start_time: slot.time_slots?.start_time,
      end_time: slot.time_slots?.end_time,
      date: slot.time_slots?.date
    }));
  };

  // Obtener fecha formateada
  const getSlotDate = (reservation) => {
    const slots = getSlotsInfo(reservation);
    if (slots.length === 0 || !slots[0].date) return 'Fecha no disponible';
    
    const [year, month, day] = slots[0].date.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Obtener rango de hora formateado
  const getSlotTimeRange = (reservation) => {
    const slots = getSlotsInfo(reservation);
    if (slots.length === 0) return 'Hora no disponible';
    
    const startTime = slots[0].start_time?.slice(0, 5) || '--:--';
    const endTime = slots[slots.length - 1].end_time?.slice(0, 5) || '--:--';
    
    return `${startTime} - ${endTime}`;
  };

  // Obtener información detallada de horas (para múltiples slots)
  const getDetailedTimes = (reservation) => {
    const slots = getSlotsInfo(reservation);
    if (slots.length === 0) return null;
    
    if (slots.length === 1) {
      return {
        type: 'single',
        display: `${slots[0].start_time?.slice(0, 5)} - ${slots[0].end_time?.slice(0, 5)}`,
        full: `${slots[0].start_time?.slice(0, 5)} a ${slots[0].end_time?.slice(0, 5)}`
      };
    } else {
      return {
        type: 'multiple',
        slots: slots.map((slot, idx) => ({
          number: idx + 1,
          start: slot.start_time?.slice(0, 5),
          end: slot.end_time?.slice(0, 5),
          range: `${slot.start_time?.slice(0, 5)} - ${slot.end_time?.slice(0, 5)}`
        })),
        display: `${slots[0].start_time?.slice(0, 5)} - ${slots[slots.length - 1].end_time?.slice(0, 5)}`,
        full: slots.map(s => `${s.start_time?.slice(0, 5)}-${s.end_time?.slice(0, 5)}`).join(' y ')
      };
    }
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
              {filteredReservations.map((res) => {
                const slotCount = res.reservation_slots?.length || 1;
                const timeInfo = getDetailedTimes(res);
                const isMultipleSlots = slotCount > 1;
                const isCancelled = res.status === 'cancelled';
                const isSharedPlan = res.plans?.active === false;
                
                return (
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
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{getSlotDate(res)}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {getSlotTimeRange(res)}
                        </span>
                        {isMultipleSlots && (
                          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {slotCount} slots
                          </span>
                        )}
                        {isSharedPlan && (
                          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Compartido
                          </span>
                        )}
                      </div>
                      {isMultipleSlots && timeInfo?.type === 'multiple' && (
                        <div className="text-xs text-gray-500 mt-1">
                          ({timeInfo.slots.map(s => s.range).join(' + ')})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {res.plans?.name || 'No especificado'}
                      </div>
                      {isMultipleSlots && (
                        <div className="text-xs text-gray-500 mt-1">
                          {slotCount} hora{slotCount > 1 ? 's' : ''}
                        </div>
                      )}
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
                        
                        {/* Botón Confirmar - solo para reservas pendientes no compartidas */}
                        {res.status === 'pending' && !isSharedPlan && (
                          <button
                            onClick={() => confirmReservation(res.id)}
                            className="text-green-600 hover:text-green-800 transition"
                            title="Confirmar"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        
                        {/* Botón Cancelar - solo si no está cancelada */}
                        {res.status !== 'cancelled' && (
                          <button
                            onClick={() => cancelReservation(res.id, res.reservation_code)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Cancelar"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                        
                        {/* Botón Reactivar - solo para reservas canceladas */}
                        {isCancelled && (
                          <button
                            onClick={() => reactivateReservation(res)}
                            disabled={reactivateLoading[res.id]}
                            className="text-amber-600 hover:text-amber-800 transition disabled:opacity-50"
                            title="Reactivar reserva (si los horarios están disponibles)"
                          >
                            {reactivateLoading[res.id] ? (
                              <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full" />
                            ) : (
                              <RotateCcw size={18} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
                  <div className="mt-2 space-y-2">
                    <p><span className="text-gray-600">Fecha:</span> {getSlotDate(selectedReservation)}</p>
                    <p><span className="text-gray-600">Horario:</span></p>
                    <div className="ml-4 space-y-1">
                      {getSlotsInfo(selectedReservation).map((slot, idx) => (
                        <p key={idx} className="text-sm">
                          • Slot {idx + 1}: {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                        </p>
                      ))}
                    </div>
                    <p><span className="text-gray-600">Jugadores:</span> {selectedReservation.people}</p>
                    <p><span className="text-gray-600">Participan en Electroshock:</span> {selectedReservation.personas_electroshock || 0}</p>
                    <p><span className="text-gray-600">Plan:</span> {selectedReservation.plans?.name || 'N/A'}</p>
                    <p><span className="text-gray-600">Duración:</span> {selectedReservation.reservation_slots?.length || 1} hora(s)</p>
                    {selectedReservation.plans?.active === false && (
                      <p><span className="text-gray-600">Tipo:</span> <span className="text-blue-600">Horario compartido</span></p>
                    )}
                  </div>
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