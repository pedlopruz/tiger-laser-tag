import { useState } from "react";
import { Button } from "@/components/ui/button";
import PaymentForm from "./PaymentForm";

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
  
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [reservationCode, setReservationCode] = useState(null);

  // ✅ Detectar si es reserva compartida desde los slots
  const isShared = selectedSlots?.some(s => s.isShared) ?? false;

  function isValidPhone(phoneNumber) {
    const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    const patterns = [
      /^[679]\d{8}$/,
      /^\+34[679]\d{8}$/,
      /^0034[679]\d{8}$/,
      /^\+[1-9]\d{1,2}\d{6,12}$/,
      /^00[1-9]\d{1,2}\d{6,12}$/
    ];
    return patterns.some(pattern => pattern.test(cleaned));
  }

  function formatPhoneInput(value) {
    let cleaned = value.replace(/[\s\-\(\)\.]/g, '');
    if (!cleaned) return '';
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('00')) return cleaned;
    if (cleaned.length > 0) cleaned = cleaned.replace(/^0+/, '');
    return cleaned;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name || !email || !phone) {
      setError("Todos los campos son obligatorios");
      return;
    }

    if (!isValidPhone(phone)) {
      setError("Por favor, introduce un número de teléfono válido.");
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

    setLoading(true);

    try {
      if (isShared) {
        // ✅ Reserva compartida — va directamente a /api/reservations sin pago
        const res = await fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slot_ids: selectedSlots.map(s => s.id),
            plan_id: plan.id,
            name,
            email,
            phone: phone.trim(),
            people,
            menor_edad: menorEdad,
            personas_electroshock,
            num_horas: selectedSlots.length
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error creando reserva");

        if (onSuccess) {
          onSuccess({
            code: data.code,
            name,
            email,
            phone,
            menor_edad: menorEdad
          });
        }

      } else {
        // ✅ Reserva normal — primero PaymentIntent, luego reserva desde webhook
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create-payment-intent",
            reservationData: {
              slot_ids: selectedSlots.map(s => s.id),
              plan_id: plan.id,
              name,
              email,
              phone: phone.trim(),
              people,
              menor_edad: menorEdad,
              personas_electroshock,
              num_horas: selectedSlots.length
            }
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error iniciando el pago");

        setReservationCode(data.reservationCode);
        setClientSecret(data.clientSecret);
        setRequiresPayment(true);
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    }

    setLoading(false);
  }

  const handlePaymentError = (errorMessage) => {
    setError(`Error de pago: ${errorMessage}`);
    setRequiresPayment(false);
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhoneInput(e.target.value));
  };

  // ✅ Solo mostrar pasarela de pago para reservas normales
  if (!isShared && requiresPayment && clientSecret) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">Completar pago</h2>
        <p className="text-sm text-gray-600 mb-4">
          Para finalizar tu reserva, necesitamos el pago de la fianza de <strong>100€</strong>.
          Este importe se descontará del precio final.
        </p>

        <PaymentForm
          clientSecret={clientSecret}
          reservationCode={reservationCode}
          onError={handlePaymentError}
        />

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded mt-4">
            ❌ {error}
          </div>
        )}
      </div>
    );
  }

  // ✅ Formulario de datos personales
  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6" id="reservation-form">
      <h2 className="text-xl font-bold mb-6">Datos de la reserva</h2>

      {/* ✅ Aviso informativo según tipo de reserva */}
      {isShared ? (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          🤝 <strong>Reserva compartida</strong> — No se requiere pago previo.
          Tu plaza quedará reservada al confirmar.
        </div>
      ) : (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          🔒 Se solicitará una fianza de <strong>100€</strong> al confirmar.
          Este importe se descontará del precio final.
        </div>
      )}

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
            placeholder="612345678 o +34693786919"
          />
          <p className="text-xs text-gray-500 mt-1">
            📱 Ejemplos: 612345678, +34693786919, +441234567890
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
            ? "Procesando..."
            : isShared
              ? "Confirmar reserva"
              : "Continuar al pago →"}
        </Button>
      </form>
    </div>
  );
}