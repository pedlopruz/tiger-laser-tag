import { useEffect, useState, useMemo } from "react";

export default function PlanPicker({ selectedSlots, onSelectPlan }) {

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const slotCount = selectedSlots?.length || 0;

  /* --------------------------
     Cargar planes
  -------------------------- */
  useEffect(() => {

    if (!slotCount) return;

    loadPlans();
    setSelectedPlan(null);

  }, [slotCount]);

  async function loadPlans() {

    setLoading(true);

    try {

      const res = await fetch("/api/getPlans");

      if (!res.ok) {
        console.error("Error loading plans");
        setPlans([]);
        return;
      }

      const data = await res.json();

      setPlans(Array.isArray(data) ? data : []);

    } catch (err) {

      console.error("Error loading plans", err);
      setPlans([]);

    }

    setLoading(false);

  }

  /* --------------------------
     Filtrar por duración
  -------------------------- */
  const filteredPlans = useMemo(() => {

    if (!plans.length || !slotCount) return [];

    const SLOT_DURATION = 60; // puedes traerlo del backend si quieres

    const requiredDuration = slotCount * SLOT_DURATION;

    return plans.filter(
      plan => plan.duration_minutes === requiredDuration
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
      </h3>

      {loading && (
        <div className="text-sm text-gray-500">
          Cargando planes...
        </div>
      )}

      {!loading && filteredPlans.length === 0 && (
        <div className="text-sm text-gray-500">
          No hay planes disponibles para esta duración
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
                w-full text-left p-5 rounded-xl border transition
                ${isSelected
                  ? "border-tiger-orange bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"}
              `}
            >

              <div className="flex justify-between items-center">

                <div>

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

                <div className="text-right">

                  <div className="font-bold text-lg text-tiger-green">
                    €{plan.price}
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