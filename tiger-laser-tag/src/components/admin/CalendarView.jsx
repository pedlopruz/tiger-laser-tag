// src/components/admin/CalendarView.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Copy, Mail, Phone, User, Users, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    loadReservations();
  }, [currentDate]);

  const loadReservations = async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          reservation_slots (
            slot_id,
            time_slots (
              start_time, 
              date
            )
          )
        `)
        .eq('status', 'confirmed');

      if (error) throw error;

      // Filtrar reservas por fecha del slot
      const filteredReservations = (data || []).filter(reservation => {
        return reservation.reservation_slots?.some(slot => {
          const slotDate = slot.time_slots?.date;
          return slotDate && slotDate >= startDate && slotDate <= endDate;
        });
      });

      setReservations(filteredReservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    for (let i = startOffset; i > 0; i--) {
      days.push({
        date: new Date(year, month, -i + 1),
        isCurrentMonth: false
      });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getReservationsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(r => 
      r.reservation_slots?.some(slot => 
        slot.time_slots?.date === dateStr
      )
    );
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-tiger-green">Calendario de Reservas</h2>
          <p className="text-sm text-gray-500 mt-1">Visualiza y gestiona todas las reservas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-semibold px-4">
            {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tiger-orange"></div>
        </div>
      ) : (
        <>
          {/* Calendario */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const dateStr = day.date.toISOString().split('T')[0];
              const dayReservations = getReservationsForDate(day.date);
              const isToday = day.date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate === dateStr;
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`
                    min-h-[120px] p-2 rounded-lg border transition-all relative
                    ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                    ${isToday ? 'border-tiger-orange ring-2 ring-tiger-orange/20' : 'border-gray-200'}
                    ${isSelected ? 'bg-tiger-green/5 border-tiger-green' : ''}
                    hover:shadow-md hover:border-tiger-green
                  `}
                >
                  <div className="font-medium text-sm mb-2">
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayReservations.slice(0, 3).map((res, i) => (
                      <div key={i} className="text-xs bg-tiger-green/10 rounded px-1 py-0.5 group relative">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium text-tiger-green">
                            {res.reservation_slots?.[0]?.time_slots?.start_time?.slice(0,5)}
                          </span>
                          <span className="text-gray-500 font-mono text-[10px]">
                            {res.reservation_code?.slice(0, 6)}
                          </span>
                        </div>
                        <div className="truncate text-gray-700">{res.name}</div>
                        
                        {/* Tooltip */}
                        <div className="absolute hidden group-hover:block z-20 bg-gray-900 text-white text-xs rounded-lg p-2 bottom-full left-0 mb-1 w-56 shadow-xl">
                          <div className="font-semibold mb-1 text-tiger-golden">{res.name}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Mail size={10} />
                            <span className="truncate">{res.email}</span>
                          </div>
                          {res.phone && (
                            <div className="flex items-center gap-1 mt-1">
                              <Phone size={10} />
                              <span>{res.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <User size={10} />
                            <span>{res.people} personas</span>
                            <span className="mx-1">•</span>
                            <DollarSign size={10} />
                            <span>€{res.precio_total}</span>
                          </div>
                          <div className="text-gray-400 text-[10px] mt-1 font-mono">
                            Código: {res.reservation_code}
                          </div>
                        </div>
                      </div>
                    ))}
                    {dayReservations.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayReservations.length - 3} más
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalle de reservas por día */}
          {selectedDate && (
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-tiger-green">
                  Reservas para {new Date(selectedDate).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  Cerrar
                </button>
              </div>
              
              <div className="space-y-4">
                {getReservationsForDate(new Date(selectedDate)).map(res => (
                  <div key={res.id} className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Información principal */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <h4 className="font-bold text-lg text-tiger-green">{res.name}</h4>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(res.reservation_code)}
                              className="flex items-center gap-1 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded transition"
                            >
                              <Copy size={12} />
                              <span className="font-mono">{res.reservation_code}</span>
                              {copiedCode === res.reservation_code && (
                                <span className="text-green-600 text-[10px]">✓</span>
                              )}
                            </button>
                          </div>
                          {res.menor_edad && (
                            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                              <AlertCircle size={12} />
                              Menores de 15
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={14} />
                            <a href={`mailto:${res.email}`} className="hover:text-tiger-green">
                              {res.email}
                            </a>
                          </div>
                          {res.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone size={14} />
                              <a href={`tel:${res.phone}`} className="hover:text-tiger-green">
                                {res.phone}
                              </a>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={14} />
                            <span>
                              {res.reservation_slots?.[0]?.time_slots?.start_time?.slice(0,5)}
                              {res.reservation_slots?.length > 1 && 
                                ` - ${res.reservation_slots[res.reservation_slots.length - 1]?.time_slots?.end_time?.slice(0,5)}`
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users size={14} />
                            <span>{res.people} jugadores</span>
                            <span className="text-gray-400">•</span>
                            <span>Electroshock: {res.personas_electroshock}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Total y acciones */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-tiger-orange">€{res.precio_total}</div>
                          <div className="text-xs text-gray-500">Total reserva</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {getReservationsForDate(new Date(selectedDate)).length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="text-gray-400 mb-2">📅</div>
                    <p className="text-gray-500">No hay reservas para este día</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}