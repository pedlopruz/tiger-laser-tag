import { useEffect, useState } from "react";

export default function PlanPicker({ slot, onSelectPlan }) {

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {

    if (!slot) return;

    loadPlans();

    // reset plan si cambia slot
    setSelectedPlan(null);

  }, [slot]);


  async function loadPlans() {

    setLoading(true);

    try {

      const res = await fetch("/api/getPlans");
      const data = await res.json();

      let availablePlans = Array.isArray(data) ? data : [];

      // 🔒 si el slot ya tiene plan asignado
      if (slot?.plan_id) {
        availablePlans = availablePlans.filter(
          p => p.id === slot.plan_id
        );
      }

      setPlans(availablePlans);

    } catch (err) {

      console.error("Error loading plans", err);
      setPlans([]);

    }

    setLoading(false);

  }


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

      {!loading && plans.length === 0 && (
        <div className="text-sm text-gray-500">
          No hay planes disponibles
        </div>
      )}

      <div className="space-y-4">

        {plans.map((plan) => {

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