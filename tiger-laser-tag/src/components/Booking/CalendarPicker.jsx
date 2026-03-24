import { useEffect, useState, useMemo } from "react";

export default function CalendarPicker({ onSelectDate, initialDate }) {

  /* --------------------------
     HOY con zona horaria de España
  -------------------------- */
  function getTodayInSpain() {
    // Obtener fecha actual en zona horaria de España
    const now = new Date();
    // Formatear a YYYY-MM-DD usando la zona horaria local de España
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const todayStr = getTodayInSpain();
  
  // Crear fecha de hoy para comparaciones de mes
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(todayYear, todayMonth, 1)
  );

  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(initialDate || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* --------------------------
     Optimización: Set O(1)
  -------------------------- */
  const availableSet = useMemo(() => {
    return new Set(availableDays);
  }, [availableDays]);

  /* --------------------------
     Cargar disponibilidad
  -------------------------- */
  useEffect(() => {
    loadAvailability();
  }, [currentMonth]);

  /* --------------------------
     Sync initialDate
  -------------------------- */
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  /* --------------------------
     Limpiar selección inválida
  -------------------------- */
  useEffect(() => {
    if (selectedDate && (!availableSet.has(selectedDate) || selectedDate < todayStr)) {
      setSelectedDate(null);
      if (onSelectDate) onSelectDate(null);
    }
  }, [availableSet, selectedDate, onSelectDate, todayStr]);

  async function loadAvailability() {
    try {
      setLoading(true);
      setError(null);
      
      const y = currentMonth.getFullYear();
      const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
      const month = `${y}-${m}`;

      const res = await fetch(`/api/getAvailability?month=${month}`);

      if (!res.ok) {
        console.error("Error loading availability");
        setAvailableDays([]);
        return;
      }

      const data = await res.json();
      setAvailableDays(data.availableDays || []);

    } catch (err) {
      console.error("Error fetching availability:", err);
      setError("Error cargando disponibilidad");
      setAvailableDays([]);
    } finally {
      setLoading(false);
    }
  }

  function daysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function startDay(date) {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Ajustar para que la semana empiece en lunes (0 = domingo, 1 = lunes...)
    return (day + 6) % 7;
  }

  /* --------------------------
     BLOQUEAR meses pasados (usando año y mes local)
  -------------------------- */
  function changeMonth(offset) {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1
    );

    // Comparar año y mes
    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth();
    
    // No permitir ir a meses anteriores al mes actual
    if (newYear < todayYear || (newYear === todayYear && newMonth < todayMonth)) {
      return;
    }

    setCurrentMonth(newDate);
  }

  function formatDate(day) {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // ✅ Función para verificar si un día es pasado (comparación con fecha de hoy en España)
  function isPastDay(day) {
    const dateStr = formatDate(day);
    return dateStr < todayStr;
  }

  // ✅ Función para verificar si un día está disponible
  function isDayAvailable(day) {
    // Días pasados nunca están disponibles
    if (isPastDay(day)) return false;
    // Verificar si está en la lista de disponibles de la API
    return availableSet.has(formatDate(day));
  }

  function handleSelect(day) {
    const dateStr = formatDate(day);
    
    // No permitir seleccionar días pasados
    if (isPastDay(day)) return;
    // No permitir seleccionar días no disponibles
    if (!availableSet.has(dateStr)) return;

    setSelectedDate(dateStr);
    if (onSelectDate) {
      onSelectDate(dateStr);
    }
  }

  const totalDays = daysInMonth(currentMonth);
  const startOffset = startDay(currentMonth);
  const monthName = currentMonth.toLocaleString("es-ES", {
    month: "long",
    year: "numeric"
  });

  const cells = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }

  for (let d = 1; d <= totalDays; d++) {
    cells.push(d);
  }

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 rounded-lg text-red-600 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className={`
            px-3 py-1 rounded transition
            ${currentMonth.getFullYear() === todayYear && 
              currentMonth.getMonth() === todayMonth
              ? "text-gray-400 cursor-not-allowed"
              : "hover:bg-gray-100"}
          `}
          disabled={currentMonth.getFullYear() === todayYear && 
                    currentMonth.getMonth() === todayMonth}
        >
          ←
        </button>
        <h2 className="font-semibold capitalize">{monthName}</h2>
        <button
          onClick={() => changeMonth(1)}
          className="px-3 py-1 rounded hover:bg-gray-100"
        >
          →
        </button>
      </div>

      {/* days header */}
      <div className="grid grid-cols-7 text-center text-sm text-gray-500 mb-2">
        <div>L</div>
        <div>M</div>
        <div>X</div>
        <div>J</div>
        <div>V</div>
        <div>S</div>
        <div>D</div>
      </div>

      {/* calendar */}
      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, index) => {
          if (!day) return <div key={index}></div>;

          const dateStr = formatDate(day);
          const isPast = isPastDay(day);
          const isAvailableDay = isDayAvailable(day);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={index}
              onClick={() => handleSelect(day)}
              disabled={!isAvailableDay}
              title={isPast ? "Día pasado" : (!isAvailableDay ? "No disponible" : "Disponible")}
              className={`
                h-10 rounded-lg text-sm font-medium transition-all duration-200
                ${isSelected
                  ? "bg-tiger-orange text-white ring-2 ring-tiger-orange/50"
                  : isAvailableDay
                    ? "bg-tiger-green text-white hover:opacity-90 hover:scale-105 cursor-pointer"
                    : isPast
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed line-through"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Cargando disponibilidad...
        </div>
      )}

      {/* legend */}
      <div className="flex gap-6 text-xs mt-4 text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-tiger-green rounded"></div>
          Disponible
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          No disponible
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-300 rounded line-through"></div>
          Día pasado
        </div>
      </div>
    </div>
  );
}