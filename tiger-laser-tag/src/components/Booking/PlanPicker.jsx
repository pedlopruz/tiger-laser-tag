import { useEffect, useState, useMemo } from "react";

export default function PlanPicker({ selectedSlots, onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const slotCount = selectedSlots?.length || 0;

  // Detectar si alguno de los slots seleccionados es compartido
  const isSharedSlot = selectedSlots?.some(s => s.isShared) ?? false;
  const sharedPlanId = slotCount === 2
  ? selectedSlots?.find(s => s.isShared)?.shared_plan_id_2slots
  : selectedSlots?.find(s => s.isShared)?.shared_plan_id;

  // Calcular duración real de un slot a partir de start_time y end_time
  const getSlotDurationMinutes = (slot) => {
    if (!slot?.start_time || !slot?.end_time) return 60;
    const [startH, startM] = slot.start_time.split(':').map(Number);
    const [endH, endM] = slot.end_time.split(':').map(Number);
    return (endH * 60 + endM) - (startH * 60 + startM);
  };

  const singleSlotDuration = selectedSlots?.[0]
    ? getSlotDurationMinutes(selectedSlots[0])
    : 60;

  const requiredDuration = slotCount * singleSlotDuration;

  useEffect(() => {
    if (!slotCount) return;
    loadPlans();
    setSelectedPlan(null);
    if (onSelectPlan) onSelectPlan(null);
  }, [slotCount]);

  // Auto-seleccionar plan compartido cuando se detecta slot compartido
  useEffect(() => {
    if (!isSharedSlot || !plans.length) return;
    const sharedPlan = plans.find(p => p.id === sharedPlanId);
    if (sharedPlan) {
      setSelectedPlan(sharedPlan);
      if (onSelectPlan) onSelectPlan(sharedPlan);
    }
  }, [isSharedSlot, plans, sharedPlanId, onSelectPlan]);

  async function loadPlans() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/getPlans");
      if (!res.ok) throw new Error("Error loading plans");
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading plans", err);
      setError("Error al cargar los planes");
      setPlans([]);
    }
    setLoading(false);
  }

  const filteredPlans = useMemo(() => {
    if (!plans.length || !slotCount) return [];

    // Para slots compartidos: mostrar SOLO el plan específico (active=false)
    if (isSharedSlot && sharedPlanId) {
      const sharedPlan = plans.find(p => p.id === sharedPlanId);
      return sharedPlan ? [sharedPlan] : [];
    }

    // Para slots normales: mostrar planes activos (active=true) que coincidan
    return plans.filter(
      plan =>
        plan.num_slots === slotCount &&
        plan.duration_minutes === requiredDuration &&
        plan.active === true
    );
  }, [plans, slotCount, isSharedSlot, sharedPlanId, requiredDuration]);

  function handleSelect(plan) {
    if (isSharedSlot) return;
    setSelectedPlan(plan);
    if (onSelectPlan) onSelectPlan(plan);
  }

  return (
    <div className="mt-10">
      <h3 className="font-semibold mb-5">
        {isSharedSlot ? "Reserva compartida" : "Selecciona tu plan"}
        {slotCount > 0 && !isSharedSlot && (
          <span className="text-sm text-gray-500 ml-2">
            ({slotCount} slot{slotCount > 1 ? 's' : ''} · {requiredDuration} min)
          </span>
        )}
      </h3>

      {isSharedSlot && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <div className="flex items-center gap-2 font-semibold mb-1">
            🤝 Este horario es de reserva compartida
          </div>
          <p>
            Pagarás solo por las personas de tu grupo. Otros grupos pueden unirse
            hasta completar el aforo. El precio es por persona sin mínimo de grupo.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500">Cargando planes...</div>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</div>
      )}

      {!loading && !error && filteredPlans.length === 0 && slotCount > 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded text-center">
          {isSharedSlot ? (
            <div>
              <p>No se encontró el plan compartido para este horario</p>
              <p className="text-xs mt-1">ID del plan: {sharedPlanId}</p>
              <p className="text-xs mt-1 text-gray-400">
                Verifica que el plan exista en la base de datos con active=false
              </p>
            </div>
          ) : (
            <div>
              <p>No hay planes disponibles para {slotCount} slot{slotCount > 1 ? 's' : ''} de {singleSlotDuration} min ({requiredDuration} min en total)</p>
              <p className="text-xs mt-1">Por favor, selecciona otra combinación de horarios</p>
            </div>
          )}
        </div>
      )}

      {!loading && !error && slotCount === 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded text-center">
          Selecciona uno o dos horarios para ver los planes disponibles
        </div>
      )}

      <div className="space-y-4">
        {filteredPlans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          const isSharedPlan = plan.active === false;

          return (
            <button
              key={plan.id}
              onClick={() => handleSelect(plan)}
              disabled={isSharedSlot}
              className={`
                w-full text-left p-5 rounded-xl border transition-all
                ${isSharedSlot
                  ? "border-blue-300 bg-blue-50 cursor-default"
                  : isSelected
                    ? "border-tiger-orange bg-orange-50 ring-2 ring-tiger-orange/20"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}
              `}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{plan.name}</span>
                    {isSharedPlan && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Compartido
                      </span>
                    )}
                    {!isSharedPlan && isSelected && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Seleccionado
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <div className="text-sm text-gray-600 mt-1">{plan.description}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {plan.duration_minutes} min · hasta {plan.max_players} jugadores
                    {isSharedPlan && (
                      <span className="ml-2 text-blue-600">· Sin mínimo de grupo</span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-xl text-tiger-green">
                    €{plan.price}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isSharedPlan ? "por persona" : "total"}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}