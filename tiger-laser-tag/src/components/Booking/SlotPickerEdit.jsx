import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SlotPickerEdit({
  date,
  people = 1,
  onSelectSlots,
  maxSlots = 2,
  minSlots = 1,
  currentSlotIds = []  // IDs de slots que el usuario ya tiene reservados
}) {

  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshTimeout = useRef(null);
  const selectedSlotsRef = useRef([]);
  const prevMaxSlotsRef = useRef(maxSlots);
  const prevCurrentSlotIdsRef = useRef(currentSlotIds);

  useEffect(() => {
    selectedSlotsRef.current = selectedSlots;
  }, [selectedSlots]);

  // ✅ Cuando cambia maxSlots de 2 a 1, intentar mantener un slot si es posible
  useEffect(() => {
    const prevMaxSlots = prevMaxSlotsRef.current;
    const prevCurrentSlotIds = prevCurrentSlotIdsRef.current;
    
    // Si estamos reduciendo de 2 slots a 1 slot
    if (prevMaxSlots === 2 && maxSlots === 1 && currentSlotIds.length === 2) {
      console.log("🔄 Reduciendo de 2 slots a 1 slot, intentando mantener selección...");
      
      // Intentar mantener el primer slot (o el que tenga más sentido)
      // Podemos mantener el slot más temprano o el que el usuario tenía seleccionado
      const sortedSlots = [...currentSlotIds].sort();
      const slotToKeep = sortedSlots[0]; // Mantener el más temprano
      
      // Buscar el slot completo en la lista de slots cargados
      const keptSlot = slots.find(slot => slot.id === slotToKeep);
      
      if (keptSlot) {
        console.log(`✅ Manteniendo slot: ${keptSlot.start_time}`);
        setSelectedSlots([keptSlot]);
        if (onSelectSlots) onSelectSlots([keptSlot]);
      }
    }
    
    // Si estamos aumentando de 1 slot a 2 slots
    if (prevMaxSlots === 1 && maxSlots === 2 && currentSlotIds.length === 1) {
      console.log("🔄 Aumentando de 1 slot a 2 slots...");
      // Limpiar selección para que el usuario pueda elegir 2 nuevos
      setSelectedSlots([]);
      if (onSelectSlots) onSelectSlots([]);
    }
    
    prevMaxSlotsRef.current = maxSlots;
    prevCurrentSlotIdsRef.current = currentSlotIds;
  }, [maxSlots, currentSlotIds, slots, onSelectSlots]);

  // ✅ También cuando cambia la fecha, intentar mantener slots si coinciden
  useEffect(() => {
    if (slots.length > 0 && currentSlotIds.length > 0) {
      // Buscar qué slots actuales están disponibles en la nueva fecha
      const availableCurrentSlots = slots.filter(slot => 
        currentSlotIds.includes(slot.id)
      );
      
      if (availableCurrentSlots.length > 0 && selectedSlots.length === 0) {
        // Si hay slots actuales disponibles y no hay selección, preseleccionarlos
        console.log(`✅ Preseleccionando ${availableCurrentSlots.length} slot(s) disponible(s) de la reserva actual`);
        
        // Respetar maxSlots
        const slotsToPreselect = availableCurrentSlots.slice(0, maxSlots);
        setSelectedSlots(slotsToPreselect);
        if (onSelectSlots) onSelectSlots(slotsToPreselect);
      }
    }
  }, [slots, currentSlotIds, maxSlots, onSelectSlots]);

  function formatTime(time) {
    if (!time) return "--:--";
    return time.slice(0, 5);
  }

  function areConsecutive(a, b) {
    if (!a?.start_time || !b?.start_time || !a?.end_time) return false;
    return a.end_time.slice(0, 5) === b.start_time.slice(0, 5) ||
          b.end_time.slice(0, 5) === a.start_time.slice(0, 5);
  }

  function isFutureSlot(slot) {
    if (!slot?.start_time) return false;
    const now = new Date();
    const slotDateTime = new Date(`${date}T${slot.start_time}`);
    return slotDateTime > now;
  }

  function getRemaining(slot) {
    if (currentSlotIds.includes(slot.id)) {
      return slot.capacity || slot.remaining || people;
    }
    
    if (slot.remaining !== undefined && slot.remaining > 0) return slot.remaining;
    if (slot.capacity && !slot.reserved) return slot.capacity;
    return 0;
  }

  function isSlotBlocked(slot) {
    if (currentSlotIds.includes(slot.id)) {
      return false;
    }
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
      alert("Este horario ya está reservado por otro cliente");
      return;
    }

    const remaining = getRemaining(slot);
    if (remaining < people && !currentSlotIds.includes(slot.id)) {
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
  }, [people, onSelectSlots, maxSlots, currentSlotIds]);

  function isSelected(slot) {
    return selectedSlots.some(s => s.id === slot.id);
  }

  function isDisabled(slot) {
    if (!isFutureSlot(slot)) return true;
    if (isSlotBlocked(slot)) return true;

    const remaining = getRemaining(slot);
    if (remaining < people && !currentSlotIds.includes(slot.id)) return true;

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
    const isCurrentSlot = currentSlotIds.includes(slot.id);
    const isConsecutivePossible = selectedSlots.length === 1 &&
                                  !selected &&
                                  areConsecutive(selectedSlots[0], slot);

    if (selected && selectedSlots.length === 2) return "bg-tiger-green text-white border-tiger-green";
    if (selected) return "bg-tiger-orange text-white border-tiger-orange";
    if (disabled && !isCurrentSlot) return "bg-gray-100 text-gray-400 cursor-not-allowed";
    
    if (isCurrentSlot && !selected) {
      return "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 ring-2 ring-blue-300";
    }
    
    if (isConsecutivePossible) return "bg-green-50 text-green-700 border-green-300 hover:bg-green-100";
    return "bg-white hover:bg-gray-50 border-gray-200";
  }

  function getSlotStatusText(slot) {
    if (!isFutureSlot(slot)) return "⏰ Pasado";
    
    if (currentSlotIds.includes(slot.id) && !isSelected(slot)) {
      return "📌 Tu reserva actual";
    }
    
    if (isSlotBlocked(slot)) return "🔒 Reservado";
    const remaining = getRemaining(slot);
    if (remaining < people) return `⚠️ ${remaining} plazas`;
    return `✅ ${remaining} plazas`;
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-4">
        {maxSlots === 1
          ? "Selecciona 1 hora"
          : minSlots === 2
            ? "Selecciona 2 horas consecutivas"
            : "Selecciona 1 o 2 horas consecutivas"}
        {selectedSlots.length === 1 && maxSlots > 1 && minSlots === 2 && (
          <span className="text-sm text-amber-600 ml-2">
            (Selecciona una hora consecutiva)
          </span>
        )}
        {selectedSlots.length === 1 && maxSlots > 1 && minSlots === 1 && (
          <span className="text-sm text-gray-500 ml-2">
            (Puedes seleccionar otra hora consecutiva)
          </span>
        )}
        {selectedSlots.length === 2 && (
          <span className="text-sm text-green-600 ml-2">
            ✓ 2 horas seleccionadas
          </span>
        )}
      </h3>

      {currentSlotIds.length > 0 && maxSlots === 1 && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          💡 Vas a cambiar de 2 horas a 1 hora. Puedes conservar una de tus horas actuales (destacada en azul).
        </div>
      )}

      {currentSlotIds.length > 0 && maxSlots === 2 && minSlots === 2 && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          💡 Tus horarios actuales aparecen destacados en azul. Puedes cambiarlos o mantenerlos.
        </div>
      )}

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
          {selectedSlots.length < minSlots && (
            <p className="text-amber-600 mt-2">
              ⚠️ Debes seleccionar {minSlots} horas consecutivas para continuar
            </p>
          )}
        </div>
      )}
    </div>
  );
}