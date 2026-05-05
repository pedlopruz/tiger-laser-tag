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

  useEffect(() => {
    selectedSlotsRef.current = selectedSlots;
  }, [selectedSlots]);

  // ✅ Cuando cambia maxSlots, preservar la selección actual si es posible
  useEffect(() => {
    // Si tenemos slots actuales del usuario y no hay selección, preseleccionar
    if (currentSlotIds.length > 0 && selectedSlots.length === 0 && slots.length > 0) {
      const availableCurrentSlots = slots.filter(slot => currentSlotIds.includes(slot.id));
      
      if (availableCurrentSlots.length > 0) {
        // Preseleccionar hasta maxSlots
        const slotsToPreselect = availableCurrentSlots.slice(0, maxSlots);
        if (slotsToPreselect.length > 0) {
          console.log("📌 Preseleccionando slots existentes:", slotsToPreselect.map(s => s.start_time));
          setSelectedSlots(slotsToPreselect);
          if (onSelectSlots) onSelectSlots(slotsToPreselect);
        }
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
    // Los slots del usuario NO están bloqueados para él
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

    // Verificar si el slot está bloqueado (pero permitir si es del usuario)
    if (isSlotBlocked(slot)) {
      alert("Este horario ya está reservado por otro cliente");
      return;
    }

    // Verificar capacidad
    const remaining = getRemaining(slot);
    if (remaining < people && !currentSlotIds.includes(slot.id)) {
      alert(`Solo quedan ${remaining} plazas`);
      return;
    }

    let newSelection = [];

    // Caso 1: No hay slots seleccionados
    if (currentSelected.length === 0) {
      newSelection = [slot];
    }
    // Caso 2: Hay 1 slot seleccionado
    else if (currentSelected.length === 1) {
      const first = currentSelected[0];
      
      // Si es el mismo slot, deseleccionar
      if (first.id === slot.id) {
        newSelection = [];
      }
      // Si queremos 2 slots y son consecutivos
      else if (maxSlots >= 2 && areConsecutive(first, slot)) {
        newSelection = [first, slot].sort((a, b) =>
          a.start_time.localeCompare(b.start_time)
        );
      }
      // Reemplazar el actual por el nuevo
      else {
        newSelection = [slot];
      }
    }
    // Caso 3: Hay 2 slots seleccionados
    else if (currentSelected.length === 2) {
      const first = currentSelected[0];
      const second = currentSelected[1];
      
      // Si es el mismo que el primero, quedarse solo con el segundo
      if (first.id === slot.id) {
        newSelection = [second];
      }
      // Si es el mismo que el segundo, quedarse solo con el primero
      else if (second.id === slot.id) {
        newSelection = [first];
      }
      // Si no, reemplazar toda la selección por el nuevo slot
      else {
        newSelection = [slot];
      }
    }

    setSelectedSlots(newSelection);
    if (onSelectSlots) onSelectSlots(newSelection);
  }, [people, onSelectSlots, maxSlots, currentSlotIds]);

  function isSelected(slot) {
    return selectedSlots.some(s => s.id === slot.id);
  }

  function isDisabled(slot) {
    // No permitir slots pasados
    if (!isFutureSlot(slot)) return true;
    
    // No permitir slots bloqueados (que no sean del usuario)
    if (isSlotBlocked(slot)) return true;
    
    // Verificar capacidad (excepto para slots del usuario)
    const remaining = getRemaining(slot);
    if (remaining < people && !currentSlotIds.includes(slot.id)) return true;

    const currentSelected = selectedSlotsRef.current;
    
    // Si ya tenemos 2 slots seleccionados, deshabilitar todos excepto los seleccionados
    if (currentSelected.length === 2) {
      return !isSelected(slot);
    }
    
    // Si tenemos 1 slot seleccionado y maxSlots es 1, solo permitir el seleccionado o deseleccionar
    if (currentSelected.length === 1 && maxSlots === 1) {
      return !isSelected(slot);
    }
    
    // Si tenemos 1 slot seleccionado y maxSlots es 2, permitir el seleccionado y sus consecutivos
    if (currentSelected.length === 1 && maxSlots >= 2) {
      const first = currentSelected[0];
      const isConsecutive = areConsecutive(first, slot);
      // Permitir: el mismo slot (para deseleccionar) o slots consecutivos
      return !(isSelected(slot) || isConsecutive);
    }
    
    return false;
  }

  function getSlotStyle(slot) {
    const selected = isSelected(slot);
    const disabled = isDisabled(slot);
    const isCurrentSlot = currentSlotIds.includes(slot.id);
    const isConsecutivePossible = selectedSlots.length === 1 &&
                                  maxSlots >= 2 &&
                                  !selected &&
                                  areConsecutive(selectedSlots[0], slot);

    if (selected && selectedSlots.length === 2) return "bg-tiger-green text-white border-tiger-green";
    if (selected) return "bg-tiger-orange text-white border-tiger-orange";
    if (disabled && !isCurrentSlot) return "bg-gray-100 text-gray-400 cursor-not-allowed";
    
    // Estilo especial para slots que el usuario ya tiene reservados (pero no seleccionados)
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
        {selectedSlots.length === 1 && maxSlots >= 2 && minSlots === 2 && (
          <span className="text-sm text-amber-600 ml-2">
            (Selecciona una hora consecutiva)
          </span>
        )}
        {selectedSlots.length === 1 && maxSlots >= 2 && minSlots === 1 && (
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

      {/* Mensaje informativo para usuarios que tienen 2 slots y están cambiando a 1 */}
      {currentSlotIds.length === 2 && maxSlots === 1 && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          💡 Tienes 2 horas reservadas. Puedes quedarte con una de ellas (destacada en azul) o elegir una nueva.
        </div>
      )}

      {/* Mensaje informativo para usuarios que tienen 2 slots y están cambiando a 2 nuevas */}
      {currentSlotIds.length === 2 && maxSlots === 2 && minSlots === 2 && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          💡 Tus horarios actuales aparecen destacados en azul. Puedes mantenerlos o cambiarlos.
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