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

  function areConsecutive(a, b) {
    const startA = a.start_time.slice(0, 5);
    const startB = b.start_time.slice(0, 5);

    const [hA, mA] = startA.split(":").map(Number);
    const [hB, mB] = startB.split(":").map(Number);

    const minutesA = hA * 60 + mA;
    const minutesB = hB * 60 + mB;

    return Math.abs(minutesA - minutesB) === 60;
  }

  function isFutureSlot(slot) {
    const now = new Date();
    const slotDateTime = new Date(`${date}T${slot.start_time}`);
    return slotDateTime > now;
  }

  // ✅ MEJORADO: Obtener plazas restantes según reglas de negocio
  function getRemaining(slot) {
    // Usar el campo remaining que viene del backend
    if (slot.remaining !== undefined) {
      return slot.remaining;
    }
    
    // Si no viene remaining, calcular
    if (slot.capacity !== undefined && slot.reserved !== undefined) {
      return slot.capacity - slot.reserved;
    }
    
    return 0;
  }

  // ✅ NUEVA: Verificar si un slot está bloqueado por reserva
  function isSlotBlocked(slot) {
    // Si el backend nos dice que está bloqueado
    if (slot.isBlocked !== undefined) return slot.isBlocked;
    
    // Si tiene reservas > 0, está bloqueado
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
      
      // Asegurar que los slots tengan los campos necesarios
      const processedSlots = (data.slots || data || []).map(slot => ({
        ...slot,
        // Normalizar campos
        isBlocked: slot.isBlocked || slot.reserved > 0,
        isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : (slot.reserved === 0 && slot.status === 'active')
      }));
      
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
     Selección MEJORADA
  -------------------------- */

  function handleSelect(slot) {
    // Verificar si el slot está disponible
    const remaining = getRemaining(slot);
    if (remaining < people) {
      alert(`Solo quedan ${remaining} plazas disponibles`);
      return;
    }
    
    // Verificar si el slot está bloqueado
    if (isSlotBlocked(slot)) {
      alert("Este horario ya está completamente reservado");
      return;
    }

    let newSelection = [];

    // Caso 1: No hay slots seleccionados
    if (selectedSlots.length === 0) {
      newSelection = [slot];
    } 
    // Caso 2: Hay 1 slot seleccionado
    else if (selectedSlots.length === 1) {
      const first = selectedSlots[0];
      
      // Si es el mismo slot, deseleccionar
      if (first.id === slot.id) {
        newSelection = [];
      }
      // Si son consecutivos, seleccionar ambos
      else if (areConsecutive(first, slot) || areConsecutive(slot, first)) {
        newSelection = [first, slot].sort(
          (a, b) => a.start_time.localeCompare(b.start_time)
        );
      } 
      // Si no son consecutivos, reemplazar
      else {
        newSelection = [slot];
      }
    } 
    // Caso 3: Ya hay 2 slots seleccionados
    else {
      // Si el slot seleccionado es uno de los dos, deseleccionar ese
      if (selectedSlots.some(s => s.id === slot.id)) {
        newSelection = selectedSlots.filter(s => s.id !== slot.id);
      } 
      // Si no, reemplazar la selección con el nuevo slot
      else {
        newSelection = [slot];
      }
    }

    setSelectedSlots(newSelection);
    onSelectSlots?.(newSelection);
  }

  /* --------------------------
     UI logic MEJORADA
  -------------------------- */

  function isSelected(slot) {
    return selectedSlots.some(s => s.id === slot.id);
  }

  // Actualizar isDisabled
function isDisabled(slot) {
  // Verificar si el slot ya pasó
  if (!isFutureSlot(slot)) return true;
  
  // Verificar si está bloqueado por reserva
  if (slot.isBlocked || slot.reserved > 0) return true;
  
  // Verificar disponibilidad
  if (!slot.isAvailable) return true;
  
  // Verificar plazas
  const remaining = getRemaining(slot);
  if (remaining < people) return true;
  
  // Lógica de slots consecutivos
  if (selectedSlots.length === 1) {
    const first = selectedSlots[0];
    const isSame = slot.id === first.id;
    const isNext = areConsecutive(first, slot);
    const isPrev = areConsecutive(slot, first);
    
    if (!isSame && !isNext && !isPrev) {
      return true;
    }
  }
  
  return false;
}

  function getSlotStyle(slot) {
    const selected = isSelected(slot);
    const disabled = isDisabled(slot);
    const blocked = isSlotBlocked(slot);
    
    // Estilo para slots seleccionados (2 slots)
    if (selectedSlots.length === 2 && selected) {
      return "bg-tiger-green text-white border-tiger-green";
    }
    
    // Estilo para slot seleccionado (1 slot)
    if (selected) {
      return "bg-tiger-orange text-white border-tiger-orange";
    }
    
    // Estilo para slots bloqueados por reserva
    if (blocked) {
      return "bg-red-100 text-gray-400 cursor-not-allowed border-red-200";
    }
    
    // Estilo para slots deshabilitados
    if (disabled) {
      return "bg-gray-100 text-gray-400 cursor-not-allowed";
    }
    
    return "bg-white hover:bg-gray-50 border-gray-200";
  }

  function getSlotStatusText(slot) {
    if (!isFutureSlot(slot)) return "Pasado";
    if (isSlotBlocked(slot)) return "🔒 Reservado";
    if (!slot.isAvailable) return "No disponible";
    
    const remaining = getRemaining(slot);
    if (remaining < people) return `Solo ${remaining} plazas`;
    
    return `${remaining} plazas`;
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

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="text-sm text-gray-500">
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
              p-4 rounded-xl border text-sm transition
              flex flex-col items-center justify-center
              ${getSlotStyle(slot)}
            `}
            title={getSlotStatusText(slot)}
          >
            <span className="font-semibold">
              {formatTime(slot.start_time)}
            </span>
            <span className="text-xs mt-1">
              {getSlotStatusText(slot)}
            </span>
          </button>
        ))}
      </div>

      {/* Indicador de selección actual */}
      {selectedSlots.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <span className="font-medium">Seleccionado: </span>
          {selectedSlots.map((slot, idx) => (
            <span key={slot.id}>
              {formatTime(slot.start_time)}
              {idx < selectedSlots.length - 1 ? " - " : ""}
            </span>
          ))}
          {selectedSlots.length === 1 && (
            <span className="text-xs text-gray-500 ml-2">
              (Puedes añadir otra hora consecutiva)
            </span>
          )}
          {selectedSlots.length === 2 && (
            <span className="text-xs text-green-600 ml-2">
              ✓ 2 horas seleccionadas
            </span>
          )}
        </div>
      )}
    </div>
  );
}