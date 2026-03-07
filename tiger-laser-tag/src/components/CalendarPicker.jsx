import { useState, useEffect } from "react";
import "../assets/calendar.css";

export default function CalendarPicker({ onSelectDate }) {

  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDays, setAvailableDays] = useState([]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }

  const changeMonth = (direction) => {
    setCurrentMonth(
      new Date(year, month + direction, 1)
    );
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const isPastDay = (date) => {
    const todayCopy = new Date();
    todayCopy.setHours(0,0,0,0);
    return date < todayCopy;
  };

  const isAvailable = (date) => {
    const formatted = formatDate(date);
    return availableDays.includes(formatted);
  };

  const handleSelect = (date) => {

    const formatted = formatDate(date);

    setSelectedDate(formatted);

    onSelectDate(formatted);
  };

  // 🔹 cargar disponibilidad del mes
  useEffect(() => {

    const loadAvailability = async () => {

      const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

      try {

        const res = await fetch(
          `/api/getAvailability?month=${monthStr}`
        );

        const data = await res.json();

        setAvailableDays(data.availableDays || []);

      } catch (err) {

        console.error("Error loading availability", err);

      }

    };

    loadAvailability();

  }, [currentMonth]);

  return (

    <div className="calendar-container">

      <h2 className="calendar-title">
        Selecciona una fecha
      </h2>

      <div className="calendar-card">

        <div className="calendar-header">

          <button
            className="month-btn"
            onClick={() => changeMonth(-1)}
          >
            ◀
          </button>

          <h3 className="month-title">
            {currentMonth.toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric"
            })}
          </h3>

          <button
            className="month-btn"
            onClick={() => changeMonth(1)}
          >
            ▶
          </button>

        </div>

        <div className="calendar-grid">

          {["L","M","X","J","V","S","D"].map((d) => (
            <div key={d} className="calendar-day-label">
              {d}
            </div>
          ))}

          {days.map((date, i) => {

            if (!date) return <div key={i}></div>;

            const disabled =
              isPastDay(date) || !isAvailable(date);

            const formatted = formatDate(date);

            return (
              <button
                key={i}
                disabled={disabled}
                className={`calendar-day
                  ${disabled ? "disabled" : ""}
                  ${selectedDate === formatted ? "selected" : ""}
                `}
                onClick={() => handleSelect(date)}
              >
                {date.getDate()}
              </button>
            );

          })}

        </div>

      </div>

    </div>

  );

}