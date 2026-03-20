import { useEffect, useState, useMemo } from "react";

export default function PlanPicker({ selectedSlots, onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const slotCount = selectedSlots?.length || 0;

  useEffect(() => {
    if (!slotCount) return;
    
    loadPlans();
    setSelectedPlan(null);
    // Notificar que el plan se ha deseleccionado cuando cambian los slots
    if (onSelectPlan) onSelectPlan(null);
  }, [slotCount]);

  async function loadPlans() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/getPlans");

      if (!res.ok) {
        throw new Error("Error loading plans");
      }

      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading plans", err);
      setError("Error al cargar los planes");
      setPlans([]);
    }

    setLoading(false);
  }

  // Filtrar planes por duración
  const filteredPlans = useMemo(() => {
    if (!plans.length || !slotCount) return [];

    const SLOT_DURATION = 60; // minutos por slot
    const requiredDuration = slotCount * SLOT_DURATION;

    return plans.filter(
      plan => plan.duration_minutes === requiredDuration && plan.active !== false
    );
  }, [plans, slotCount]);

  function handleSelect(plan) {
    setSelectedPlan(plan);
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  }

  return (
    <div className="mt-10">
      <h3 className="font-semibold mb-5">
        Selecciona tu plan
        {slotCount > 0 && (
          <span className="text-sm text-gray-500 ml-2">
            ({slotCount} hora{slotCount > 1 ? 's' : ''})
          </span>
        )}
      </h3>

      {loading && (
        <div className="text-sm text-gray-500">
          Cargando planes...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && filteredPlans.length === 0 && slotCount > 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded text-center">
          <p>No hay planes disponibles para {slotCount} hora{slotCount > 1 ? 's' : ''}</p>
          <p className="text-xs mt-1">Por favor, selecciona otra combinación de horarios</p>
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

          return (
            <button
              key={plan.id}
              onClick={() => handleSelect(plan)}
              className={`
                w-full text-left p-5 rounded-xl border transition-all
                ${isSelected
                  ? "border-tiger-orange bg-orange-50 ring-2 ring-tiger-orange/20"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}
              `}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-semibold text-lg">
                    {plan.name}
                  </div>
                  {plan.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {plan.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {plan.duration_minutes} min · hasta {plan.max_players} jugadores
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-xl text-tiger-green">
                    €{plan.price}
                  </div>
                  <div className="text-xs text-gray-500">
                    por persona
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