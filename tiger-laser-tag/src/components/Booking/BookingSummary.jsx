import { Button } from "@/components/ui/button";

export default function BookingSummary({
  date,
  slot,
  plan,
  people,
  setPeople,
  onConfirm
}) {

  return (

    <div className="bg-white rounded-xl shadow p-6 sticky top-20">

      <h2 className="text-xl font-bold mb-6">
        Tu reserva
      </h2>

      <div className="space-y-3">

        <div>
          <strong>Fecha:</strong> {date || "-"}
        </div>

        <div>
          <strong>Hora:</strong> {slot?.start_time || "-"}
        </div>

        <div>
          <strong>Plan:</strong> {plan?.name || "-"}
        </div>

        <div className="flex items-center gap-3">

          <strong>Jugadores:</strong>

          <input
            type="number"
            min="1"
            max="20"
            value={people}
            onChange={(e)=>setPeople(Number(e.target.value))}
            className="border rounded px-3 py-1 w-20"
          />

        </div>

      </div>

      <Button
        className="w-full mt-6"
        disabled={!date || !slot || !plan}
        onClick={onConfirm}
      >
        Continuar
      </Button>

    </div>

  );
}