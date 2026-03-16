import { Button } from "@/components/ui/button";

export default function BookingSummary({
  date,
  slot,
  plan,
  people,
  setPeople,
  onConfirm,
  showForm
}) {

  const pricePerPerson = plan?.price || 0;
  const total = pricePerPerson * people;

  const remaining =
    slot && slot.capacity && slot.reserved
      ? slot.capacity - slot.reserved
      : null;

  function formatTime(time) {
    if (!time) return "-";
    return time.slice(0, 5);
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

  return (

    <div className="space-y-6">

      <h2 className="text-xl font-bold text-tiger-green">
        Tu reserva
      </h2>

      <div className="space-y-4 text-sm">

        <div className="flex justify-between">
          <span className="text-gray-500">Fecha</span>
          <span className="font-medium">
            {formatDate(date)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Hora</span>
          <span className="font-medium">
            {formatTime(slot?.start_time)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Plan</span>
          <span className="font-medium">
            {plan?.name || "-"}
          </span>
        </div>

        {/* jugadores */}

        <div className="flex items-center justify-between">

          <span className="text-gray-500">Jugadores</span>

          <input
            type="number"
            min="1"
            max="20"
            value={people}
            onChange={(e) => setPeople(Number(e.target.value))}
            className="border rounded-lg px-3 py-1 w-20 text-center"
          />

        </div>

        {/* plazas restantes */}

        {remaining !== null && (

          <div className="flex justify-between text-sm">

            <span className="text-gray-500">
              Disponibilidad
            </span>

            {remaining <= 5 ? (
              <span className="text-red-500 font-medium">
                🔥 Solo quedan {remaining} plazas
              </span>
            ) : (
              <span className="text-gray-600">
                {remaining} plazas libres
              </span>
            )}

          </div>

        )}

      </div>

      {/* precio */}

      {plan && (

        <div className="border-t pt-4">

          <div className="flex justify-between text-sm mb-2">
            <span>
              {pricePerPerson}€ × {people} jugadores
            </span>

            <span>
              {total}€
            </span>
          </div>

          <div className="flex justify-between font-bold text-lg">

            <span>Total</span>

            <span className="text-tiger-orange">
              {total}€
            </span>

          </div>

        </div>

      )}

      {/* botón continuar */}

      {!showForm && (

        <Button
          className="w-full mt-4 bg-tiger-orange hover:bg-tiger-orange/90 text-white py-6 text-lg font-bold"
          disabled={!date || !slot || !plan}
          onClick={onConfirm}
        >
          Continuar
        </Button>

      )}

    </div>

  );
}