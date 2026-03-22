import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ReservationForm({
  selectedSlots,
  plan,
  people,
  personas_electroshock,
  holdId,
  onSuccess
}) {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [menorEdad, setMenorEdad] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Función para validar número de teléfono (español o internacional)
  function isValidPhone(phoneNumber) {
    // Eliminar espacios, guiones y paréntesis
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Patrones válidos:
    // Español: 6, 7, 9 seguido de 8 dígitos (9 en total)
    // Español con prefijo: +34 seguido de 9 dígitos
    // Internacional: + seguido de 1-3 dígitos de prefijo y 6-12 dígitos
    const patterns = [
      /^[679]\d{8}$/,                    // Español sin prefijo: 6XXXXXXXX, 7XXXXXXXX, 9XXXXXXXX
      /^\+34[679]\d{8}$/,                // Español con prefijo +34
      /^\+[1-9]\d{1,2}\d{6,12}$/,       // Internacional: +XX XXXXXX...
      /^00[1-9]\d{1,2}\d{6,12}$/        // Internacional con 00 en lugar de +
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
  }

  // ✅ Función para formatear teléfono mientras escribe (opcional)
  function formatPhoneInput(value) {
    // Eliminar todo lo que no sea número o +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Si empieza con +, mantenerlo
    if (!cleaned.startsWith('+') && cleaned.length > 0 && !cleaned.startsWith('00')) {
      cleaned = cleaned.replace(/^0+/, ''); // Eliminar ceros iniciales
    }
    
    return cleaned;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Validación de campos obligatorios
    if (!name || !email || !phone) {
      setError("Todos los campos son obligatorios");
      return;
    }

    // ✅ Validación de teléfono mejorada
    if (!isValidPhone(phone)) {
      setError("Por favor, introduce un número de teléfono válido (ej: 612345678, +34612345678, +441234567890)");
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

    if (personas_electroshock > people) {
      setError("El número de personas para electroshock no puede ser mayor que el total de jugadores");
      return;
    }

    if (personas_electroshock < 1) {
      setError("Debe haber al menos 1 persona para electroshock");
      return;
    }

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
          action: "create",
          slot_ids: selectedSlots.map(s => s.id),
          plan_id: plan.id,
          name,
          email,
          phone: phone.trim(),
          people,
          hold_id: holdId,
          menor_edad: menorEdad,
          precio_total,
          personas_electroshock,
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

  // ✅ Manejar cambio de teléfono con formato opcional
  const handlePhoneChange = (e) => {
    const rawValue = e.target.value;
    const formattedValue = formatPhoneInput(rawValue);
    setPhone(formattedValue);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6" id="reservation-form">
      <h2 className="text-xl font-bold mb-6">
        Datos de la reserva
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            required
            placeholder="Nombre completo"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            required
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Teléfono *</label>
          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            required
            placeholder="612345678 o +34612345678"
          />
          <p className="text-xs text-gray-500 mt-1">
            📱 Ejemplos válidos: 612345678, +34612345678, +441234567890
          </p>
        </div>

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
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            ❌ {error}
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