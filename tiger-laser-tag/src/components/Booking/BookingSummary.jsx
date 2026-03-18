import { Button } from "@/components/ui/button";

export default function BookingSummary({
  date,
  slots = [],
  plan,
  people,
  setPeople,
  onConfirm,
  showForm
}) {

  const pricePerPerson = plan?.price || 0;

  const basePeople = Math.max(people, 10);
  const total = pricePerPerson * basePeople;

  /* --------------------------
     Helpers
  -------------------------- */

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

  /* --------------------------
     Rango de horas
  -------------------------- */

  function getTimeRange() {

    if (!slots.length) return "-";

    if (slots.length === 1) {
      return formatTime(slots[0].start_time);
    }

    const sorted = [...slots].sort(
      (a, b) => a.start_time.localeCompare(b.start_time)
    );

    return `${formatTime(sorted[0].start_time)} - ${formatTime(sorted[sorted.length - 1].end_time)}`;
  }

  /* --------------------------
     Disponibilidad real
  -------------------------- */

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
            {getTimeRange()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Duración</span>
          <span className="font-medium">
            {slots.length || 0} hora(s)
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

        {/* aviso mínimo */}

        {people < 10 && plan && (
          <div className="text-xs text-orange-600">
            ⚠️ El precio mínimo es equivalente a 10 jugadores
          </div>
        )}

        {/* disponibilidad */}

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
              {pricePerPerson}€ × {basePeople} jugadores
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

      {/* botón */}

      {!showForm && (

        <Button
          className="w-full mt-4 bg-tiger-orange hover:bg-tiger-orange/90 text-white py-6 text-lg font-bold"
          disabled={!date || !slots.length || !plan}
          onClick={onConfirm}
        >
          Continuar
        </Button>

      )}

    </div>

  );
}