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
  const [error, setError] = useState(null);

  const refreshTimeout = useRef(null);

  /* --------------------------
     Helpers
  -------------------------- */

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

  /* --------------------------
     Cargar slots
  -------------------------- */

  async function loadSlots() {
    if (!date) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/getSlotsByDate?date=${date}`);
      
      if (!res.ok) {
        throw new Error("Error loading slots");
      }
      
      const data = await res.json();
      
      if (!data.slots || !Array.isArray(data.slots)) {
        throw new Error("Invalid slots data");
      }
      
      // Filtrar slots con horas válidas
      const validSlots = data.slots.filter(slot => {
        return slot.start_time && 
               slot.start_time.length >= 5 && 
               !slot.start_time.includes('undefined');
      });
      
      console.log("Slots válidos:", validSlots.map(s => s.start_time));
      
      setSlots(validSlots);
    } catch (err) {
      console.error("Error loading slots", err);
      setError("Error al cargar los horarios");
      setSlots([]);
    }

    setLoading(false);
  }

  /* --------------------------
     Realtime updates
  -------------------------- */

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
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => loadSlots())
      .on("postgres_changes", { event: "*", schema: "public", table: "reservation_slots" }, () => loadSlots())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, [date]);

  /* --------------------------
     Selección de slots
  -------------------------- */

  function handleSelect(slot) {
    console.log("Click en slot:", slot.start_time);
    console.log("Selección actual:", selectedSlots.map(s => s.start_time));
    
    // Verificar disponibilidad
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
    
    if (selectedSlots.length === 0) {
      // Primer slot
      newSelection = [slot];
    } 
    else if (selectedSlots.length === 1) {
      const first = selectedSlots[0];
      
      if (first.id === slot.id) {
        // Deseleccionar
        newSelection = [];
      }
      else if (areConsecutive(first, slot)) {
        // Seleccionar ambos
        newSelection = [first, slot].sort((a, b) => 
          a.start_time.localeCompare(b.start_time)
        );
      } 
      else {
        // Reemplazar
        newSelection = [slot];
      }
    } 
    else {
      // Reiniciar si hay 2
      newSelection = [slot];
    }
    
    console.log("Nueva selección:", newSelection.map(s => s.start_time));
    setSelectedSlots(newSelection);
    onSelectSlots?.(newSelection);
  }

  /* --------------------------
     UI logic
  -------------------------- */

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
      
      return !(isSame || isConsecutive);
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
    
    if (selected && selectedSlots.length === 2) {
      return "bg-tiger-green text-white border-tiger-green";
    }
    if (selected) {
      return "bg-tiger-orange text-white border-tiger-orange";
    }
    if (disabled) {
      return "bg-gray-100 text-gray-400 cursor-not-allowed";
    }
    if (isConsecutivePossible) {
      return "bg-green-50 text-green-700 border-green-300 hover:bg-green-100";
    }
    return "bg-white hover:bg-gray-50 border-gray-200";
  }

  /* --------------------------
     Render
  -------------------------- */

  return (
    <div className="mt-8">
      <h3 className="font-semibold mb-4">
        Selecciona 1 o 2 horas consecutivas
        {selectedSlots.length === 1 && (
          <span className="text-sm text-gray-500 ml-2">
            (Selecciona otra hora consecutiva)
          </span>
        )}
      </h3>

      {loading && (
        <div className="text-sm text-gray-500">Cargando horarios...</div>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="text-sm text-gray-500">No hay horarios disponibles</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {slots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => handleSelect(slot)}
            disabled={isDisabled(slot)}
            className={`
              p-4 rounded-xl border text-sm transition
              flex flex-col items-center justify-center
              ${getSlotStyle(slot)}
            `}
          >
            <span className="font-semibold">
              {formatTime(slot.start_time)}
            </span>
            <span className="text-xs">
              {slot.reserved > 0 ? "🔒 Reservado" : `${getRemaining(slot)} plazas`}
            </span>
          </button>
        ))}
      </div>

      {selectedSlots.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
          <span className="font-medium">Seleccionado: </span>
          {selectedSlots.map((slot, i) => (
            <span key={slot.id}>
              {formatTime(slot.start_time)}
              {i < selectedSlots.length - 1 ? " - " : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}