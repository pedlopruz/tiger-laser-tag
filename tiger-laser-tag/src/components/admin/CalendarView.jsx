// src/components/admin/CalendarView.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { supabaseAdmin } from '../../../api/supabaseAdmin';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

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
      const { data, error } = await supabaseAdmin
        .from('reservations')
        .select(`
          *,
          reservation_slots (
            slot_id,
            time_slots (start_time, date)
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'confirmed');

      if (error) throw error;
      setReservations(data || []);
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
    
    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const firstDayOfWeek = firstDay.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    for (let i = startOffset; i > 0; i--) {
      days.push({
        date: new Date(year, month, -i + 1),
        isCurrentMonth: false
      });
    }
    
    // Días del mes actual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Días del mes siguiente
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

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-tiger-green">Calendario de Reservas</h2>
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
                    min-h-[100px] p-2 rounded-lg border transition-all
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
                      <div key={i} className="text-xs bg-tiger-green/10 rounded px-1 py-0.5 truncate">
                        {res.reservation_slots?.[0]?.time_slots?.start_time?.slice(0,5)} - {res.name}
                      </div>
                    ))}
                    {dayReservations.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayReservations.length - 3} más
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {selectedDate && (
        <div className="mt-6 pt-4 border-t">
          <h3 className="font-semibold text-tiger-green mb-3">
            Reservas para {new Date(selectedDate).toLocaleDateString('es-ES')}
          </h3>
          <div className="space-y-2">
            {getReservationsForDate(new Date(selectedDate)).map(res => (
              <div key={res.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{res.name}</p>
                  <p className="text-sm text-gray-500">
                    {res.reservation_slots?.[0]?.time_slots?.start_time?.slice(0,5)} · {res.people} personas
                  </p>
                </div>
                <span className="text-sm font-medium text-tiger-green">€{res.precio_total}</span>
              </div>
            ))}
            {getReservationsForDate(new Date(selectedDate)).length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay reservas para este día</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}