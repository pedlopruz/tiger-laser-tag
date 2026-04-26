import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function BookingSummary({
  date,
  slots = [],
  plan,
  people,
  setPeople,
  onConfirm,
  showForm,
  onElectroshockChange
}) {

  // ✅ Detectar si es reserva compartida desde los slots seleccionados
  const isShared = slots.some(s => s.isShared);

  // ✅ Precio según tipo de reserva
  const pricePerPerson = plan?.price || 0;
  const billablePeople = isShared
    ? people                      // compartida: se paga lo que se reserva
    : Math.max(people, 10);       // normal: mínimo 10
  const total = pricePerPerson * billablePeople;

  const [electroshock, setElectroshock] = useState(people);

  useEffect(() => {
    if (people < electroshock) {
      setElectroshock(people);
      if (onElectroshockChange) onElectroshockChange(people);
    } else if (people > electroshock) {
      setElectroshock(people);
      if (onElectroshockChange) onElectroshockChange(people);
    }
  }, [people]);

  useEffect(() => {
    if (onElectroshockChange) {
      onElectroshockChange(electroshock);
    }
  }, [electroshock, onElectroshockChange]);

  function formatTime(time) {
    return time?.slice(0, 5);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }

  function getTimeRange() {
    if (!slots.length) return "-";
    if (slots.length === 1) return formatTime(slots[0].start_time);
    const sorted = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    return `${formatTime(sorted[0].start_time)} - ${formatTime(sorted[sorted.length - 1].end_time)}`;
  }

  function getRemaining() {
    if (!slots.length) return null;
    const remainings = slots.map(slot => {
      if (slot.remaining !== undefined) return slot.remaining;
      if (slot.capacity !== undefined && slot.reserved !== undefined) {
        return slot.capacity - slot.reserved;
      }
      return 0;
    });
    return Math.min(...remainings);
  }

  const remaining = getRemaining();

  const handleElectroshockDecrease = () => {
    if (electroshock > 1) {
      const newValue = electroshock - 1;
      setElectroshock(newValue);
    }
  };

  const handleElectroshockIncrease = () => {
    if (electroshock < people) {
      const newValue = electroshock + 1;
      setElectroshock(newValue);
    }
  };

  const handleElectroshockChange = (e) => {
    let newValue = Number(e.target.value);
    if (newValue < 1) newValue = 1;
    if (newValue > people) newValue = people;
    setElectroshock(newValue);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-tiger-green">
        Tu reserva
        {isShared && (
          <span className="ml-2 text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            🤝 Compartida
          </span>
        )}
      </h2>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Fecha</span>
          <span className="font-medium">{formatDate(date)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Hora</span>
          <span className="font-medium">{getTimeRange()}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Duración</span>
          <span className="font-medium">{slots.length || 0} hora(s)</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Plan</span>
          <span className="font-medium">{plan?.name || "-"}</span>
        </div>

        {/* Jugadores */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Jugadores (total)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => people > 1 && setPeople(people - 1)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              disabled={people <= 1}
              type="button"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max="20"
              value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
              className="border rounded-lg px-3 py-1 w-20 text-center"
            />
            <button
              onClick={() => people < 20 && setPeople(people + 1)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              disabled={people >= 20}
              type="button"
            >
              +
            </button>
          </div>
        </div>

        {/* ✅ Validación de plazas disponibles para reserva compartida */}
        {isShared && remaining !== null && people > remaining && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            ⚠️ Solo quedan {remaining} plazas disponibles en este horario compartido
          </div>
        )}

        {/* Personas Electroshock */}
        <div className="flex items-center justify-between border-t pt-3 mt-2">
          <span className="text-gray-500">
            Personas Electroshock
            <span className="text-xs text-gray-400 ml-1">(puede reducirse)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleElectroshockDecrease}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              disabled={electroshock <= 1}
              type="button"
            >
              -
            </button>
            <input
              type="number"
              min="1"
              max={people}
              value={electroshock}
              onChange={handleElectroshockChange}
              className="border rounded-lg px-3 py-1 w-20 text-center"
            />
            <button
              onClick={handleElectroshockIncrease}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              disabled={electroshock >= people}
              type="button"
            >
              +
            </button>
          </div>
        </div>

        {electroshock < people && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            💡 {people - electroshock} persona(s) no participarán en Electroshock
          </div>
        )}

        {/* ✅ Aviso mínimo solo para reservas normales */}
        {!isShared && people < 10 && plan && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
            ⚠️ El precio mínimo es equivalente a 10 jugadores
          </div>
        )}

        {/* Disponibilidad */}
        {remaining !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Disponibilidad</span>
            {remaining <= 5 ? (
              <span className="text-red-500 font-medium">
                🔥 Solo quedan {remaining} plazas
              </span>
            ) : (
              <span className="text-gray-600">{remaining} plazas libres</span>
            )}
          </div>
        )}
      </div>

      {/* Precio */}
      {plan && (
        <div className="border-t pt-4">
          {isShared ? (
            // ✅ Compartida: precio real por personas reservadas
            <div className="flex justify-between text-sm mb-2">
              <span>{pricePerPerson}€ × {people} jugadores</span>
              <span>{total}€</span>
            </div>
          ) : (
            // ✅ Normal: precio con mínimo de 10
            <>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {pricePerPerson}€ × {billablePeople} jugadores
                  {people < 10 && (
                    <span className="text-xs text-gray-400 ml-1">(mín. 10)</span>
                  )}
                </span>
                <span>{total}€</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-tiger-orange">{total}€</span>
          </div>
        </div>
      )}

      {/* Botón */}
      {!showForm && (
        <Button
          className="w-full mt-4 bg-tiger-orange hover:bg-tiger-orange/90 text-white py-6 text-lg font-bold"
          disabled={
            !date || !slots.length || !plan ||
            // ✅ Para compartidas, bloquear si piden más plazas de las disponibles
            (isShared && remaining !== null && people > remaining)
          }
          onClick={onConfirm}
        >
          Continuar
        </Button>
      )}
    </div>
  );
}