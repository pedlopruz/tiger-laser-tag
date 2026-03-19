import { useEffect, useState, useMemo } from "react";

export default function CalendarPicker({ onSelectDate, initialDate }) {

  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [availableDays, setAvailableDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(initialDate || null);

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
    if (selectedDate && !availableSet.has(selectedDate)) {
      setSelectedDate(null);
    }
  }, [availableSet]);

  async function loadAvailability() {

    try {
      const y = currentMonth.getFullYear();
      const m = String(currentMonth.getMonth() + 1).padStart(2, "0");

      const month = `${y}-${m}`;

      const res = await fetch(`/api/getAvailability?month=${month}`);

      if (!res.ok) {
        console.error("Error loading availability");
        return;
      }

      const data = await res.json();

      setAvailableDays(data.availableDays || []);

    } catch (err) {
      console.error("Error fetching availability:", err);
    }
  }

  function daysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function startDay(date) {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return (day + 6) % 7; // lunes como primer día
  }

  function changeMonth(offset) {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1
    );

    setCurrentMonth(newDate);
  }

  function formatDate(day) {

    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");

    return `${y}-${m}-${d}`;
  }

  function handleSelect(day) {

    const dateStr = formatDate(day);

    if (!availableSet.has(dateStr) || dateStr < todayStr) return;

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

  return (

    <div className="w-full">

      {/* header */}

      <div className="flex justify-between items-center mb-6">

        <button
          onClick={() => changeMonth(-1)}
          className="px-3 py-1 rounded hover:bg-gray-100"
        >
          ←
        </button>

        <h2 className="font-semibold capitalize">
          {monthName}
        </h2>

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

      {/* calendar grid */}

      <div className="grid grid-cols-7 gap-2">

        {cells.map((day, index) => {

          if (!day) {
            return <div key={index}></div>;
          }

          const dateStr = formatDate(day);

          const todayStr = new Date().toLocaleDateString("sv-SE");

          const isAvailable =
            availableSet.has(dateStr) &&
            dateStr >= todayStr;
          const isSelected = selectedDate === dateStr;

          return (

            <button
              key={index}
              onClick={() => handleSelect(day)}
              disabled={!isAvailable}
              className={`
                h-10 rounded-lg text-sm font-medium
                transition
                ${isSelected
                  ? "bg-tiger-orange text-white"
                  : isAvailable
                    ? "bg-tiger-green text-white hover:opacity-90"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"}
              `}
            >
              {day}
            </button>

          );

        })}

      </div>

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

      </div>

    </div>
  );
}