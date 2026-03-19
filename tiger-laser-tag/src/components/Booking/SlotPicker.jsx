import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SlotPicker({
  date,
  people = 1,
  onSelectSlots,
  initialSlots = []
}) {

  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState(initialSlots);
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
     Realtime updates
  -------------------------- */

  function refreshSlots() {

    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }

    refreshTimeout.current = setTimeout(loadSlots, 200);

  }

  function isFutureSlot(slot) {
    const now = new Date();
    const slotDateTime = new Date(`${date}T${slot.start_time}`);
    return slotDateTime > now;
  }

  useEffect(() => {
    if (date) loadSlots();
  }, [date]);

  useEffect(() => {
    setSelectedSlots(initialSlots || []);
  }, [initialSlots]);

  useEffect(() => {

    if (!date) return;

    const channel = supabase
      .channel("slots-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, refreshSlots)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservation_holds" }, refreshSlots)
      .on("postgres_changes", { event: "*", schema: "public", table: "time_slots" }, refreshSlots)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };

  }, [date]);

  /* --------------------------
     Helpers
  -------------------------- */

  function getRemaining(slot) {

    if (slot.remaining !== undefined) return slot.remaining;

    if (slot.capacity !== undefined && slot.reserved !== undefined) {
      return slot.capacity - slot.reserved;
    }

    return 0;

  }

  function formatTime(time) {
    return time?.slice(0, 5);
  }

  function areConsecutive(a, b) {
    return a.end_time === b.start_time;
  }

  /* --------------------------
     Selección inteligente
  -------------------------- */

  function handleSelect(slot) {

    const remaining = getRemaining(slot);

    if (remaining < people) return;

    let newSelection = [];

    if (selectedSlots.length === 0) {

      newSelection = [slot];

    } else if (selectedSlots.length === 1) {

      const first = selectedSlots[0];

      if (first.id === slot.id) {
        newSelection = [];
      } else if (areConsecutive(first, slot) || areConsecutive(slot, first)) {

        const sorted = [first, slot].sort(
          (a, b) => a.start_time.localeCompare(b.start_time)
        );

        newSelection = sorted;

      } else {

        // reset si no son consecutivos
        newSelection = [slot];

      }

    } else {

      // ya hay 2 → reset
      newSelection = [slot];

    }

    setSelectedSlots(newSelection);

    if (onSelectSlots) {
      onSelectSlots(newSelection);
    }

  }

  /* --------------------------
     UI logic
  -------------------------- */

  function isSelected(slot) {
    return selectedSlots.some(s => s.id === slot.id);
  }

  function isDisabled(slot) {

    const remaining = getRemaining(slot);

    if (!isFutureSlot(slot)) return true;

    if (remaining < people || slot.isFull) return true;

    if (selectedSlots.length === 1) {

      const first = selectedSlots[0];

      if (
        slot.id !== first.id &&
        !areConsecutive(first, slot) &&
        !areConsecutive(slot, first)
      ) {
        return true;
      }

    }

    return false;

  }

  /* --------------------------
     Render
  -------------------------- */

  return (

    <div className="mt-8">

      <h3 className="font-semibold mb-4">
        Selecciona 1 o 2 horas consecutivas
      </h3>

      {loading && (
        <div className="text-sm text-gray-500">
          Cargando horarios...
        </div>
      )}

      {!loading && slots.length === 0 && (
        <div className="text-sm text-gray-500">
          No hay horarios disponibles
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

        {slots.map((slot) => {

          const remaining = getRemaining(slot);
          const disabled = isDisabled(slot);
          const selected = isSelected(slot);

          return (

            <button
              key={slot.id}
              onClick={() => handleSelect(slot)}
              disabled={disabled}
              className={`
                p-4 rounded-xl border text-sm transition
                flex flex-col items-center justify-center

                ${selected
                  ? "bg-tiger-orange text-white border-tiger-orange"
                  : disabled
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white hover:bg-gray-50"}
              `}
            >

              <span className="font-semibold">
                {formatTime(slot.start_time)}
              </span>

              <span className="text-xs">
                {remaining} plazas
              </span>

            </button>

          );

        })}

      </div>

    </div>
  );
}