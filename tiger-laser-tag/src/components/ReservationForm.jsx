import { useState } from "react";

export default function ReservationForm({
  slot,
  plan,
  date,
  people,
  onSuccess
}) {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitReservation = async () => {

    if (!name || !email) {
      setError("Nombre y email son obligatorios");
      return;
    }

    setLoading(true);
    setError(null);

    try {

      const res = await fetch("/api/createReservation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          slot_id: slot.id,
          plan_id: plan.id,
          name,
          email,
          phone,
          people
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error creando reserva");
      }

      onSuccess(data);

    } catch (err) {

      console.error(err);
      setError(err.message);

    } finally {

      setLoading(false);

    }

  };

  return (

    <div style={{ maxWidth: 500, margin: "auto" }}>

      <h2>Confirmar reserva</h2>

      {/* resumen */}
      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 20
        }}
      >

        <p><strong>Fecha:</strong> {date}</p>
        <p><strong>Hora:</strong> {slot.start_time}</p>
        <p><strong>Plan:</strong> {plan.name}</p>
        <p><strong>Personas:</strong> {people}</p>
        <p><strong>Precio:</strong> {plan.price} €</p>

      </div>

      {/* formulario */}

      <div style={{ display: "grid", gap: 10 }}>

        <input
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        <button
          onClick={submitReservation}
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 6,
            border: "none",
            background: "#0070f3",
            color: "white",
            cursor: "pointer"
          }}
        >
          {loading ? "Reservando..." : "Confirmar reserva"}
        </button>

      </div>

    </div>

  );

}