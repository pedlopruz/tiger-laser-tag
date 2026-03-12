import { useState } from "react";

export default function MisReservas() {

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");

  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {

    e.preventDefault();

    setError("");
    setReservation(null);
    setLoading(true);

    try {

      const res = await fetch("/api/reservationAccess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          code,
          email
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error buscando reserva");
        setLoading(false);
        return;
      }

      setReservation(data.reservation);

    } catch (err) {

      console.error(err);
      setError("Error de conexión");

    }

    setLoading(false);

  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }

  function formatTime(time) {
    return time?.slice(0,5);
  }

  return (

    <section className="py-20 bg-tiger-cream min-h-screen">

      <div className="container mx-auto px-4 max-w-xl">

        <h1 className="text-4xl font-heading font-bold text-tiger-green text-center mb-10">
          Consultar reserva
        </h1>

        {/* FORMULARIO */}

        <form
          onSubmit={handleSearch}
          className="bg-white p-8 rounded-xl shadow space-y-5"
        >

          <div>

            <label className="text-sm font-medium">
              Código de reserva
            </label>

            <input
              value={code}
              onChange={(e)=>setCode(e.target.value)}
              className="w-full border rounded-lg p-3 mt-1"
              placeholder="Ej: Hs72Ks91dLQ"
              required
            />

          </div>

          <div>

            <label className="text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              className="w-full border rounded-lg p-3 mt-1"
              placeholder="tu@email.com"
              required
            />

          </div>

          <button
            type="submit"
            className="w-full bg-tiger-orange text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            {loading ? "Buscando..." : "Consultar reserva"}
          </button>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

        </form>

        {/* RESULTADO */}

        {reservation && (

          <div className="mt-10 bg-white p-8 rounded-xl shadow">

            <h2 className="text-xl font-semibold mb-6">
              Tu reserva
            </h2>

            <div className="space-y-3 text-sm">

              <div>
                <strong>Nombre:</strong> {reservation.name}
              </div>

              <div>
                <strong>Plan:</strong> {reservation.plans?.name}
              </div>

              <div>
                <strong>Fecha:</strong> {formatDate(reservation.time_slots?.date)}
              </div>

              <div>
                <strong>Hora:</strong> {formatTime(reservation.time_slots?.start_time)}
              </div>

              <div>
                <strong>Jugadores:</strong> {reservation.people}
              </div>

              <div>
                <strong>Código:</strong> {reservation.unique_code}
              </div>

            </div>

          </div>

        )}

      </div>

    </section>

  );

}