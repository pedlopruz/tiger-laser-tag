import { useEffect, useState, useMemo } from "react";
import { useTranslation } from 'react-i18next';

export default function PlanPicker({ selectedSlots, onSelectPlan }) {
  const { t } = useTranslation();
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
      if (!res.ok) throw new Error(t('planPicker.log.errorLoadingPlans'));
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(t('planPicker.log.errorLoading'), err);
      setError(t('planPicker.errorMessage'));
      setPlans([]);
    }
    setLoading(false);
  }

  const filteredPlans = useMemo(() => {
    if (!plans.length || !slotCount) return [];

    // ✅ Slot compartido — siempre mostrar solo el plan compartido
    if (isSharedSlot) {
      if (!sharedPlanId) return []; // no mostrar nada si no hay plan compartido para este nº de slots
      const sharedPlan = plans.find(p => p.id === sharedPlanId);
      return sharedPlan ? [sharedPlan] : [];
    }

    // Slots normales — mostrar planes activos que coincidan
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
        {isSharedSlot ? t('planPicker.title.shared') : t('planPicker.title.select')}
        {slotCount > 0 && !isSharedSlot && (
          <span className="text-sm text-gray-500 ml-2">
            ({slotCount} {t('planPicker.slot', { count: slotCount })} · {requiredDuration} {t('planPicker.minutes')})
          </span>
        )}
      </h3>

      {isSharedSlot && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <div className="flex items-center gap-2 font-semibold mb-1">
            🤝 {t('planPicker.sharedInfo.title')}
          </div>
          <p>
            {t('planPicker.sharedInfo.description')}
          </p>
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500">{t('planPicker.loading')}</div>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</div>
      )}

      {!loading && !error && filteredPlans.length === 0 && slotCount > 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded text-center">
          {isSharedSlot ? (
            <div>
              <p>{t('planPicker.noSharedPlan.title')}</p>
              <p className="text-xs mt-1">{t('planPicker.noSharedPlan.planId')}: {sharedPlanId}</p>
              <p className="text-xs mt-1 text-gray-400">
                {t('planPicker.noSharedPlan.verify')}
              </p>
            </div>
          ) : (
            <div>
              <p>{t('planPicker.noPlans.title', { count: slotCount, duration: singleSlotDuration, totalDuration: requiredDuration })}</p>
              <p className="text-xs mt-1">{t('planPicker.noPlans.selectOther')}</p>
            </div>
          )}
        </div>
      )}

      {!loading && !error && slotCount === 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded text-center">
          {t('planPicker.selectSlotsFirst')}
        </div>
      )}

      {!loading && !error && filteredPlans.length === 0 && slotCount > 0 && (
        <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded text-center">
          {isSharedSlot ? (
            <div>
              <p>{t('planPicker.noSharedPlanForSlots', { count: slotCount })}</p>
              {slotCount === 2 && (
                <p className="text-xs mt-1 text-amber-600">
                  ⚠️ {t('planPicker.sharedPlanTwoSlotsWarning')}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p>{t('planPicker.noPlans.title', { count: slotCount, duration: singleSlotDuration, totalDuration: requiredDuration })}</p>
              <p className="text-xs mt-1">{t('planPicker.noPlans.selectOther')}</p>
            </div>
          )}
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
                        {t('planPicker.sharedBadge')}
                      </span>
                    )}
                    {!isSharedPlan && isSelected && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {t('planPicker.selectedBadge')}
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <div className="text-sm text-gray-600 mt-1">{plan.description}</div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {plan.duration_minutes} {t('planPicker.minutes')} · {t('planPicker.upTo')} {plan.max_players} {t('planPicker.players')}
                    {isSharedPlan && (
                      <span className="ml-2 text-blue-600">· {t('planPicker.noMinimum')}</span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-xl text-tiger-green">
                    €{plan.price}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isSharedPlan ? t('planPicker.perPerson') : t('planPicker.total')}
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