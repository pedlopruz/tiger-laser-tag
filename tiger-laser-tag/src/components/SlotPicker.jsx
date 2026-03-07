import { useEffect, useState } from "react";

export default function SlotPicker({ date, people, onSelectSlot }) {

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    if (!date) return;

    const fetchSlots = async () => {

      setLoading(true);
      setError(null);

      try {

        const res = await fetch(`/api/getAvailability?date=${date}&people=${people}`);

        if (!res.ok) {
          throw new Error("Error cargando horarios");
        }

        const data = await res.json();

        setSlots(data);

      } catch (err) {

        console.error(err);
        setError("No se pudieron cargar los horarios");

      } finally {

        setLoading(false);

      }

    };

    fetchSlots();

  }, [date, people]);

  if (loading) {
    return <p>Cargando horarios...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (slots.length === 0) {
    return <p>No hay horarios disponibles para este día.</p>;
  }

  return (

    <div style={{ maxWidth: 400, margin: "auto" }}>

      <h2>Horarios disponibles</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: 10
        }}
      >

        {slots.map((slot) => (

          <button
            key={slot.id}
            onClick={() => onSelectSlot(slot)}
            style={{
              padding: 12,
              borderRadius: 6,
              border: "1px solid #ddd",
              cursor: "pointer",
              background: "white"
            }}
          >

            <div>
              <strong>{slot.start_time}</strong>
            </div>

            <div style={{ fontSize: 12, color: "#666" }}>
              {slot.remaining_capacity} plazas libres
            </div>

          </button>

        ))}

      </div>

    </div>

  );
}