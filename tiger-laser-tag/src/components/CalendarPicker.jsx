import { useState } from "react";

export default function CalendarPicker({ onSelectDate }) {

  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];

  // espacios vacíos inicio calendario
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // días del mes
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
    return date < new Date(today.setHours(0,0,0,0));
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>

      <h2>Selecciona una fecha</h2>

      {/* navegación mes */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>

        <button onClick={() => changeMonth(-1)}>
          ◀
        </button>

        <strong>
          {currentMonth.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric"
          })}
        </strong>

        <button onClick={() => changeMonth(1)}>
          ▶
        </button>

      </div>

      {/* grid calendario */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 6
        }}
      >

        {["L","M","X","J","V","S","D"].map((d) => (
          <div key={d} style={{ fontWeight: "bold", textAlign: "center" }}>
            {d}
          </div>
        ))}

        {days.map((date, i) => {

          if (!date) {
            return <div key={i}></div>;
          }

          const disabled = isPastDay(date);

          return (
            <button
              key={i}
              disabled={disabled}
              style={{
                padding: 10,
                borderRadius: 6,
                border: "1px solid #ddd",
                background: disabled ? "#eee" : "white",
                cursor: disabled ? "not-allowed" : "pointer"
              }}
              onClick={() => onSelectDate(formatDate(date))}
            >
              {date.getDate()}
            </button>
          );
        })}

      </div>

    </div>
  );
}