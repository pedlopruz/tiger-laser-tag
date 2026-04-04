import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SlotPickerEdit({
  date,
  people = 1,
  onSelectSlots,
  maxSlots = 2
}) {

  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshTimeout = useRef(null);
  const selectedSlotsRef = useRef([]);

  useEffect(() => {
    selectedSlotsRef.current = selectedSlots;
  }, [selectedSlots]);

  function formatTime(time) {
    if (!time) return "--:--";
    return time.slice(0, 5);
  }

  function getMinutesFromTime(time) {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  function areConsecutive(a, b) {
    if (!a?.start_time || !b?.start_time) return false;
    const minutesA = getMinutesFromTime(a.start_time);
    const minutesB = getMinutesFromTime(b.start_time);
    const diff = Math.abs(minutesA - minutesB);
    return diff === 60;
  }

  function isFutureSlot(slot) {
    if (!slot?.start_time) return false;
    const now = new Date();
    const slotDateTime = new Date(`${date}T${slot.start_time}`);
    return slotDateTime > now;
  }

  function getRemaining(slot) {
    if (slot.remaining !== undefined && slot.remaining > 0) return slot.remaining;
    if (slot.capacity && !slot.reserved) return slot.capacity;
    return 0;
  }

  function isSlotBlocked(slot) {
    return slot.reserved > 0 || slot.isBlocked === true;
  }

  const loadSlots = useCallback(async () => {
    if (!date) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/getSlotsByDate?date=${date}`);
      if (!res.ok) throw new Error("Error loading slots");

      const data = await res.json();
      if (!data.slots || !Array.isArray(data.slots)) throw new Error("Invalid slots data");

      const validSlots = data.slots.filter(slot =>
        slot.start_time &&
        slot.start_time.length >= 5 &&
        !slot.start_time.includes('undefined')
      );

      setSlots(validSlots);

    } catch (err) {
      console.error("Error loading slots", err);
      setError("Error al cargar los horarios");
      setSlots([]);
    }

    setLoading(false);
  }, [date]);

  useEffect(() => {
    if (date) loadSlots();
  }, [date, loadSlots]);

  useEffect(() => {
    if (!date) return;

    const handleRealtimeChange = () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      refreshTimeout.current = setTimeout(() => {
        loadSlots();
      }, 3000);
    };

    const channel = supabase
      .channel("slots-realtime-edit")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "reservations"
      }, handleRealtimeChange)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "reservation_slots"
      }, handleRealtimeChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, [date, loadSlots]);

  const handleSelect = useCallback((slot) => {
    const currentSelected = selectedSlotsRef.current;

    if (isSlotBlocked(slot)) {
      alert("Este horario ya está reservado");
      return;
    }

    const remaining = getRemaining(slot);
    if (remaining < people) {
      alert(`Solo quedan ${remaining} plazas`);
      return;
    }

    let newSelection = [];

    if (currentSelected.length === 0) {
      newSelection = [slot];
    }
    else if (currentSelected.length === 1) {
      const first = currentSelected[0];
      if (first.id === slot.id) {
        newSelection = [];
      }
      else if (maxSlots > 1 && areConsecutive(first, slot)) {
        newSelection = [first, slot].sort((a, b) =>
          a.start_time.localeCompare(b.start_time)
        );
      }
      else {
        newSelection = [slot];
      }
    }
    else {
      newSelection = [slot];
    }

    setSelectedSlots(newSelection);
    if (onSelectSlots) onSelectSlots(newSelection);
  }, [people, onSelectSlots, maxSlots]);

  function isSelected(slot) {
    return selectedSlots.some(s => s.id === slot.id);
  }

  function isDisabled(slot) {
    if (!isFutureSlot(slot)) return true;
    if (isSlotBlocked(slot)) return true;

    const remaining = getRemaining(slot);
    if (remaining < people) return true;

    if (selectedSlots.length === 1) {
      const first = selectedSlots[0];
      const isSame = slot.id === first.id;
      const isConsecutive = areConsecutive(first, slot);
      return !(isSame || (maxSlots > 1 && isConsecutive));
    }

    if (selectedSlots.length === 2) {
      return !isSelected(slot);
    }

    return false;
  }

  function getSlotStyle(slot) {
    const selected = isSelected(slot);
    const disabled = isDisabled(slot);
    const isConsecutivePossible = selectedSlots.length === 1 &&
                                  !selected &&
                                  areConsecutive(selectedSlots[0], slot);

    if (selected && selectedSlots.length === 2) return "bg-tiger-green text-white border-tiger-green";
    if (selected) return "bg-tiger-orange text-white border-tiger-orange";
    if (disabled) return "bg-gray-100 text-gray-400 cursor-not-allowed";
    if (isConsecutivePossible) return "bg-green-50 text-green-700 border-green-300 hover:bg-green-100";
    return "bg-white hover:bg-gray-50 border-gray-200";
  }

  function getSlotStatusText(slot) {
    if (!isFutureSlot(slot)) return "⏰ Pasado";
    if (isSlotBlocked(slot)) return "🔒 Reservado";
    const remaining = getRemaining(slot);
    if (remaining < people) return `⚠️ ${remaining} plazas`;
    return `✅ ${remaining} plazas`;
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-4">
        {maxSlots === 1 ? "Selecciona 1 hora" : "Selecciona 1 o 2 horas consecutivas"}
        {selectedSlots.length === 1 && maxSlots > 1 && (
          <span className="text-sm text-gray-500 ml-2">
            (Selecciona otra hora consecutiva)
          </span>
        )}
        {selectedSlots.length === 2 && (
          <span className="text-sm text-green-600 ml-2">
            ✓ 2 horas seleccionadas
          </span>
        )}
      </h3>

      {loading && (
        <div className="text-sm text-gray-500 animate-pulse">Cargando horarios...</div>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</div>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded text-center">
          No hay horarios disponibles para este día
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {slots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => handleSelect(slot)}
            disabled={isDisabled(slot)}
            className={`
              p-4 rounded-xl border text-sm transition-all
              flex flex-col items-center justify-center
              ${getSlotStyle(slot)}
            `}
            title={getSlotStatusText(slot)}
          >
            <span className="font-semibold text-base">{formatTime(slot.start_time)}</span>
            <span className="text-xs mt-1">{getSlotStatusText(slot)}</span>
          </button>
        ))}
      </div>

      {selectedSlots.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
          <span className="font-medium">Horario seleccionado: </span>
          {selectedSlots.map((slot, idx) => (
            <span key={slot.id}>
              <span className="font-mono">{formatTime(slot.start_time)}</span>
              {idx < selectedSlots.length - 1 ? " - " : ""}
            </span>
          ))}
          {selectedSlots.length === 1 && maxSlots > 1 && (
            <span className="text-gray-500 ml-2">
              (Haz clic en una hora consecutiva para reservar 2 horas)
            </span>
          )}
        </div>
      )}
    </div>
  );
}