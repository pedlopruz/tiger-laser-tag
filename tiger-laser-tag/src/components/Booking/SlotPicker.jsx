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
    return time?.slice(0, 5);
  }

  // Convertir hora a minutos desde medianoche
  function getMinutesFromTime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Verificar si dos slots son consecutivos (diferencia de 60 minutos)
  function areConsecutive(a, b) {
    const timeA = a.start_time;
    const timeB = b.start_time;
    
    const minutesA = getMinutesFromTime(timeA);
    const minutesB = getMinutesFromTime(timeB);
    
    const diff = Math.abs(minutesA - minutesB);
    return diff === 60;
  }

  // Verificar si el slot es futuro
  function isFutureSlot(slot) {
    const now = new Date();
    const slotDateTime = new Date(`${date}T${slot.start_time}`);
    return slotDateTime > now;
  }

  // Obtener plazas restantes
  function getRemaining(slot) {
    if (slot.remaining !== undefined) return slot.remaining;
    if (slot.capacity !== undefined && slot.reserved !== undefined) {
      return slot.capacity - slot.reserved;
    }
    return slot.capacity || 0;
  }

  // Verificar si un slot está bloqueado por reserva
  function isSlotBlocked(slot) {
    if (slot.isBlocked !== undefined) return slot.isBlocked;
    if (slot.reserved > 0) return true;
    return false;
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
      
      // Procesar y normalizar slots
      const processedSlots = (data.slots || data || []).map(slot => ({
        ...slot,
        isBlocked: slot.isBlocked || slot.reserved > 0,
        isAvailable: slot.isAvailable !== undefined 
          ? slot.isAvailable 
          : (slot.reserved === 0 && slot.status === 'active')
      }));
      
      console.log("Slots cargados:", processedSlots.map(s => ({
        hora: s.start_time,
        disponible: s.isAvailable,
        bloqueado: s.isBlocked,
        plazas: s.remaining || s.capacity
      })));
      
      setSlots(processedSlots);
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

  function refreshSlots() {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current);
    }
    refreshTimeout.current = setTimeout(loadSlots, 200);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "reservation_slots" }, refreshSlots)
      .on("postgres_changes", { event: "*", schema: "public", table: "time_slots" }, refreshSlots)
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
    console.log("=== SELECCIÓN DE SLOT ===");
    console.log("Slot clickeado:", slot.start_time);
    console.log("Slots actuales:", selectedSlots.map(s => s.start_time));
    
    // Verificar disponibilidad básica
    const remaining = getRemaining(slot);
    if (remaining < people) {
      alert(`Solo quedan ${remaining} plazas disponibles para las ${slot.start_time}`);
      return;
    }
    
    // Verificar si está bloqueado
    if (isSlotBlocked(slot)) {
      alert("Este horario ya está completamente reservado");
      return;
    }
    
    let newSelection = [];
    
    // Caso 1: No hay slots seleccionados
    if (selectedSlots.length === 0) {
      console.log("Caso 1: Primer slot seleccionado");
      newSelection = [slot];
    } 
    // Caso 2: Hay 1 slot seleccionado
    else if (selectedSlots.length === 1) {
      const first = selectedSlots[0];
      
      // Si es el mismo slot, deseleccionar
      if (first.id === slot.id) {
        console.log("Caso 2a: Deseleccionando slot");
        newSelection = [];
      }
      // Si son consecutivos, seleccionar ambos
      else if (areConsecutive(first, slot)) {
        console.log("Caso 2b: Slots consecutivos, seleccionando ambos");
        // Ordenar por hora
        newSelection = [first, slot].sort((a, b) => 
          a.start_time.localeCompare(b.start_time)
        );
      } 
      // Si no son consecutivos, reemplazar
      else {
        console.log("Caso 2c: No son consecutivos, reemplazando");
        newSelection = [slot];
      }
    } 
    // Caso 3: Ya hay 2 slots seleccionados
    else {
      console.log("Caso 3: Ya hay 2 slots, reiniciando selección");
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
    // Verificar si el slot ya pasó
    if (!isFutureSlot(slot)) {
      console.log(`${slot.start_time} - ❌ Deshabilitado: horario pasado`);
      return true;
    }
    
    // Verificar disponibilidad
    const remaining = getRemaining(slot);
    if (remaining < people) {
      console.log(`${slot.start_time} - ❌ Deshabilitado: solo ${remaining} plazas`);
      return true;
    }
    
    // Verificar si está bloqueado
    if (isSlotBlocked(slot)) {
      console.log(`${slot.start_time} - ❌ Deshabilitado: bloqueado por reserva`);
      return true;
    }
    
    // Verificar disponibilidad general
    if (!slot.isAvailable && slot.reserved === 0) {
      console.log(`${slot.start_time} - ❌ Deshabilitado: no disponible`);
      return true;
    }
    
    // Si no hay slots seleccionados, todos los disponibles están habilitados
    if (selectedSlots.length === 0) {
      console.log(`${slot.start_time} - ✅ Habilitado: sin selección previa`);
      return false;
    }
    
    // Si hay 1 slot seleccionado
    if (selectedSlots.length === 1) {
      const first = selectedSlots[0];
      const isSame = slot.id === first.id;
      const isNext = areConsecutive(first, slot);
      const isPrev = areConsecutive(slot, first);
      
      // Permitir: el mismo slot (para deseleccionar) o consecutivos
      const enabled = isSame || isNext || isPrev;
      
      if (enabled) {
        if (isSame) {
          console.log(`${slot.start_time} - ✅ Habilitado: mismo slot (para deseleccionar)`);
        } else {
          console.log(`${slot.start_time} - ✅ Habilitado: consecutivo con ${first.start_time}`);
        }
      } else {
        console.log(`${slot.start_time} - ❌ Deshabilitado: no es consecutivo con ${first.start_time}`);
      }
      
      return !enabled;
    }
    
    // Si hay 2 slots, deshabilitar todos excepto los seleccionados (para deseleccionar)
    if (selectedSlots.length === 2) {
      const isSelected = selectedSlots.some(s => s.id === slot.id);
      if (!isSelected) {
        console.log(`${slot.start_time} - ❌ Deshabilitado: ya hay 2 slots seleccionados`);
      }
      return !isSelected;
    }
    
    return false;
  }

  function getSlotStyle(slot) {
    const selected = isSelected(slot);
    const disabled = isDisabled(slot);
    const isConsecutivePossible = selectedSlots.length === 1 && 
                                  !selected && 
                                  areConsecutive(selectedSlots[0], slot);
    
    // Estilo para slots seleccionados (2 slots)
    if (selected && selectedSlots.length === 2) {
      return "bg-tiger-green text-white border-tiger-green shadow-md";
    }
    
    // Estilo para slot seleccionado (1 slot)
    if (selected) {
      return "bg-tiger-orange text-white border-tiger-orange shadow-md";
    }
    
    // Estilo para slots deshabilitados
    if (disabled) {
      return "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200";
    }
    
    // Estilo para slots que pueden ser consecutivos (feedback visual)
    if (isConsecutivePossible) {
      return "bg-green-50 text-green-700 border-green-300 hover:bg-green-100 cursor-pointer transition-all";
    }
    
    // Estilo normal para slots disponibles
    return "bg-white hover:bg-gray-50 border-gray-200 cursor-pointer transition-all";
  }

  function getSlotStatusText(slot) {
    if (!isFutureSlot(slot)) return "⏰ Pasado";
    if (isSlotBlocked(slot)) return "🔒 Reservado";
    if (!slot.isAvailable && slot.reserved === 0) return "❌ No disponible";
    
    const remaining = getRemaining(slot);
    if (remaining < people) return `⚠️ ${remaining} plazas`;
    
    return `✅ ${remaining} plazas`;
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
        {selectedSlots.length === 2 && (
          <span className="text-sm text-green-600 ml-2">
            ✓ 2 horas seleccionadas
          </span>
        )}
      </h3>

      {loading && (
        <div className="text-sm text-gray-500 animate-pulse">
          Cargando horarios...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center">
          No hay horarios disponibles para este día
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {slots.map((slot) => {
          const isConsecutivePossible = selectedSlots.length === 1 && 
                                        !isSelected(slot) && 
                                        areConsecutive(selectedSlots[0], slot);
          
          return (
            <button
              key={slot.id}
              onClick={() => handleSelect(slot)}
              disabled={isDisabled(slot)}
              className={`
                p-4 rounded-xl border text-sm transition-all
                flex flex-col items-center justify-center
                ${getSlotStyle(slot)}
                ${isSelected(slot) ? 'ring-2 ring-offset-2 ring-tiger-orange' : ''}
              `}
              title={getSlotStatusText(slot)}
            >
              <span className="font-semibold text-base">
                {formatTime(slot.start_time)}
              </span>
              <span className="text-xs mt-1">
                {getSlotStatusText(slot)}
              </span>
              {isConsecutivePossible && (
                <span className="text-xs text-green-600 mt-1 animate-pulse">
                  ✓ Consecutivo
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Indicador de selección actual */}
      {selectedSlots.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
          <span className="font-medium">Horario seleccionado: </span>
          {selectedSlots.map((slot, idx) => (
            <span key={slot.id}>
              <span className="font-mono">{formatTime(slot.start_time)}</span>
              {idx < selectedSlots.length - 1 ? ' - ' : ''}
            </span>
          ))}
          {selectedSlots.length === 1 && (
            <span className="text-gray-500 ml-2">
              (Puedes añadir otra hora consecutiva)
            </span>
          )}
          {selectedSlots.length === 2 && (
            <span className="text-green-600 ml-2">
              ✓ 2 horas seleccionadas
            </span>
          )}
        </div>
      )}
    </div>
  );
}