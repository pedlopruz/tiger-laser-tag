import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SlotPicker({
  date,
  people = 1,
  onSelectSlot,
  initialSlot,
  reservedSlot
}) {

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(initialSlot || null);
  const [loading, setLoading] = useState(false);

  const refreshTimeout = useRef(null);

  /* --------------------------
     Cargar slots
  -------------------------- */

  async function loadSlots() {

    if (!date) return;

    setLoading(true);

    try {

      const res = await fetch(`/api/getSlotsByDate?date=${date}`);
      const data = await res.json();

      setSlots(data.slots || data || []);

    } catch (err) {

      console.error("Error loading slots", err);
      setSlots([]);

    }

    setLoading(false);

  }

  /* --------------------------
     Debounce refresh
  -------------------------- */

  function refreshSlots() {

    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }

    refreshTimeout.current = setTimeout(() => {
      loadSlots();
    }, 200);

  }

  /* --------------------------
     Primera carga
  -------------------------- */

  useEffect(() => {

    if (date) {
      loadSlots();
    }

  }, [date]);

  useEffect(() => {

    if (initialSlot) {
      setSelectedSlot(initialSlot);
    }

  }, [initialSlot]);

  /* --------------------------
     Realtime updates
  -------------------------- */

  useEffect(() => {

    if (!date) return;

    const channel = supabase
      .channel("slots-realtime")

      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations" },
        refreshSlots
      )

      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reservations" },
        refreshSlots
      )

      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reservations" },
        refreshSlots
      )

      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservation_holds" },
        refreshSlots
      )

      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reservation_holds" },
        refreshSlots
      )

      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "time_slots" },
        refreshSlots
      )

      .subscribe();

    return () => {

      supabase.removeChannel(channel);

      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
      }

    };

  }, [date]);

  /* --------------------------
     Seleccionar slot
  -------------------------- */

  function handleSelect(slot) {

    setSelectedSlot(slot);

    if (onSelectSlot) {
      onSelectSlot(slot);
    }

  }

  /* --------------------------
     Calcular plazas restantes
  -------------------------- */

  function getRemaining(slot) {

    if (slot.remaining !== undefined) return slot.remaining;

    if (slot.available !== undefined) return slot.available;

    if (slot.capacity !== undefined && slot.reserved !== undefined) {
      return slot.capacity - slot.reserved;
    }

    return 0;

  }

  function formatTime(time) {
    return time?.slice(0, 5);
  }

  /* --------------------------
     Render
  -------------------------- */

  return (

    <div className="mt-8">

      <h3 className="font-semibold mb-4">
        Horarios disponibles
      </h3>

      {loading && (
        <div className="text-sm text-gray-500">
          Cargando horarios...
        </div>
      )}

      {!loading && slots.length === 0 && (
        <div className="text-sm text-gray-500">
          No hay horarios disponibles para este día
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

        {slots.map((slot) => {

          const remaining = getRemaining(slot) ?? 0;

          const isReservedSlot =
            reservedSlot && slot.id === reservedSlot.id;

          const isAvailable =
            remaining >= people && !slot.isFull && !isReservedSlot;

          const isSelected =
            selectedSlot?.id === slot.id;

          return (

            <button
              key={slot.id}
              onClick={() => handleSelect(slot)}
              disabled={!isAvailable}
              className={`
                p-4 rounded-xl border text-sm
                transition
                flex flex-col items-center justify-center
                shadow-sm

                ${isReservedSlot
                  ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                  : isSelected
                    ? "bg-tiger-orange text-white border-tiger-orange"
                    : isAvailable
                      ? "bg-white hover:bg-gray-50 border-gray-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                }
              `}
            >

              <span className="font-semibold text-base">
                {formatTime(slot.start_time)}
              </span>

              {isReservedSlot ? (

                <span className="text-xs">
                  Tu reserva actual
                </span>

              ) : slot.isFull ? (

                <span className="text-xs">
                  Completo
                </span>

              ) : remaining <= 5 ? (

                <span className="text-xs text-red-500 font-semibold">
                  🔥 Solo quedan {remaining}
                </span>

              ) : (

                <span className="text-xs opacity-80">
                  {remaining} plazas
                </span>

              )}

            </button>

          );

        })}

      </div>

    </div>

  );

}