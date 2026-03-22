import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ReservationForm({
  selectedSlots,
  plan,
  people,
  personas_electroshock,  // ✅ Nuevo prop
  holdId,
  onSuccess
}) {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [menorEdad, setMenorEdad] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name || !email) {
      setError("Nombre y email son obligatorios");
      return;
    }

    if (!selectedSlots || selectedSlots.length === 0) {
      setError("Debes seleccionar al menos un horario");
      return;
    }

    if (!plan) {
      setError("Debes seleccionar un plan");
      return;
    }

    // ✅ Validar que personas_electroshock no sea mayor que people
    if (personas_electroshock > people) {
      setError("El número de personas para electroshock no puede ser mayor que el total de jugadores");
      return;
    }

    // ✅ Validar que personas_electroshock sea al menos 1
    if (personas_electroshock < 1) {
      setError("Debe haber al menos 1 persona para electroshock");
      return;
    }

    /* --------------------------
       Reglas negocio
    -------------------------- */

    const basePeople = Math.max(people, 10);
    const precio_total = basePeople * plan.price;
    const num_horas = selectedSlots.length;

    setLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action:"create",
          slot_ids: selectedSlots.map(s => s.id),
          plan_id: plan.id,
          name,
          email,
          phone,
          people,
          hold_id: holdId,
          menor_edad: menorEdad,
          precio_total,
          personas_electroshock,  // ✅ Enviar el valor real
          num_horas
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error creando reserva");
      }

      if (onSuccess) {
        onSuccess(data);
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6" id="reservation-form">
      <h2 className="text-xl font-bold mb-6">
        Datos de la reserva
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Teléfono</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>

        {/* ✅ Mostrar información de electroshock */}
        {personas_electroshock < people && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            💡 {people - personas_electroshock} persona(s) no participarán en Electroshock
          </div>
        )}

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={menorEdad}
            onChange={(e) => setMenorEdad(e.target.checked)}
            className="mt-1"
          />
          <label className="text-sm text-gray-700">
            Marque si algún participante es menor de 15 años.  
            Será necesario firmar un consentimiento en el recinto.
          </label>
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading
            ? "Procesando reserva..."
            : "Confirmar reserva"}
        </Button>
      </form>
    </div>
  );
}