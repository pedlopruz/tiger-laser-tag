import { useEffect, useState } from "react";

export default function PlanPicker({ onSelectPlan }) {

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const fetchPlans = async () => {

      try {

        const res = await fetch("/api/getPlans");

        if (!res.ok) {
          throw new Error("Error cargando planes");
        }

        const data = await res.json();

        setPlans(data);

      } catch (err) {

        console.error(err);
        setError("No se pudieron cargar los planes");

      } finally {

        setLoading(false);

      }

    };

    fetchPlans();

  }, []);

  if (loading) {
    return <p>Cargando planes...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (plans.length === 0) {
    return <p>No hay planes disponibles.</p>;
  }

  return (

    <div style={{ maxWidth: 500, margin: "auto" }}>

      <h2>Elige tu plan</h2>

      <div
        style={{
          display: "grid",
          gap: 12
        }}
      >

        {plans.map((plan) => (

          <button
            key={plan.id}
            onClick={() => onSelectPlan(plan)}
            style={{
              padding: 16,
              borderRadius: 8,
              border: "1px solid #ddd",
              cursor: "pointer",
              background: "white",
              textAlign: "left"
            }}
          >

            <div style={{ fontWeight: "bold", fontSize: 16 }}>
              {plan.name}
            </div>

            {plan.description && (
              <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                {plan.description}
              </div>
            )}

            <div style={{ marginTop: 8, fontWeight: "bold" }}>
              {plan.price} €
            </div>

          </button>

        ))}

      </div>

    </div>

  );
}