import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { Search, Calendar, Clock, Users, CreditCard, AlertCircle, CheckCircle, XCircle, ArrowRight, CheckSquare } from "lucide-react";
import { useTranslation } from 'react-i18next';
import CalendarPicker from "../components/Booking/CalendarPicker";
import SlotPickerEdit from "../components/Booking/SlotPickerEdit";
import { Button } from "@/components/ui/button";

export default function MisReservas() {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [reservation, setReservation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [newSlotCount, setNewSlotCount] = useState(null);
  const [people, setPeople] = useState(null);
  const [extraPayment, setExtraPayment] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setReservation(null);
    setCancelled(false);
    setNewSlotCount(null);
    setSelectedSlots([]);
    setSelectedDate(null);
    setLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "access", code, email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('misReservas.errors.notFound'));
        setLoading(false);
        return;
      }

      setReservation(data.reservation);
      setPeople(data.reservation.people);
    } catch (err) {
      console.error(err);
      setError(t('misReservas.errors.connection'));
    }
    setLoading(false);
  }

  function handleSearchAnother() {
    setCancelled(false);
    setReservation(null);
    setCode("");
    setEmail("");
    setMessage("");
    setError("");
  }

  async function confirmReservation() {
    if (!confirm(t('misReservas.confirmDialog'))) return;

    setConfirmLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          code,
          email
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || t('misReservas.errors.confirmFailed'));
        setConfirmLoading(false);
        return;
      }

      const timeSlots = reservation.reservation_slots?.[0]?.time_slots || reservation.time_slots;

      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_reservation",
          name: reservation.name,
          email: reservation.email,
          phone: reservation.phone,
          reservation_code: reservation.reservation_code,
          date: timeSlots?.date,
          time_range: timeSlots
            ? `${timeSlots.start_time?.slice(0, 5)} - ${timeSlots.end_time?.slice(0, 5)}`
            : null,
          duration: reservation.num_slots || 1,
          plan_name: reservation.plans?.name,
          plan_price: reservation.plans?.price,
          people: reservation.people,
          personas_electroshock: reservation.personas_electroshock || 0,
          total_price: reservation.precio_total,
          menor_edad: reservation.menor_edad || false
        })
      });

      setReservation(prev => ({ ...prev, status: "confirmed" }));
      setMessage(t('misReservas.messages.confirmSuccess'));
      setTimeout(() => setMessage(""), 5000);

    } catch (err) {
      console.error(err);
      setMessage(t('misReservas.errors.confirmError'));
    }
    setConfirmLoading(false);
  }

  const pricePerPerson = reservation?.plans?.price || 0;
  const originalPeople = reservation?.people || 0;
  const MINIMUM_BILLED = 10;
  const billablePeople = (n) => Math.max(n, MINIMUM_BILLED);
  const extra = Math.max(
    pricePerPerson * billablePeople(people || 0) - pricePerPerson * billablePeople(originalPeople),
    0
  );
  const showExtraWarning = people > MINIMUM_BILLED && people > originalPeople;
  const requiredSlots = reservation?.num_slots ?? 1;
  
  // ✅ Detectar plan compartido (active=false o nombre contiene "Compartido")
  const isSharedPlan = 
    reservation?.plans?.active === false ||
    reservation?.plans?.name?.toLowerCase().includes("compartido");
  
  const effectiveSlotCount = newSlotCount ?? requiredSlots;
  const slotCountChanged = newSlotCount !== null && newSlotCount !== requiredSlots;
  const estimatedNewTotal = pricePerPerson * (newSlotCount || requiredSlots) * billablePeople(originalPeople);
  const estimatedCurrentTotal = reservation?.precio_total ?? 0;
  const estimatedDiff = Math.abs(estimatedNewTotal - estimatedCurrentTotal);
  const slotPriceIncreases = (newSlotCount || 0) > requiredSlots;

  // ✅ Obtener los slots actuales de la reserva
  const currentSlotIds = reservation?.current_slot_ids || [];

  // ✅ Determinar si se debe mostrar el botón de cancelar
  const showCancelButton = 
    reservation?.status === "pending" ||
    (reservation?.status === "confirmed" && isSharedPlan);

  async function updatePlayers() {
    if (!people) return;
    setUpdateLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change", code, email, people: Number(people) })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error);
        setUpdateLoading(false);
        return;
      }

      if (data.extra_payment > 0) {
        setExtraPayment(data.extra_payment);
        setShowPayment(true);
      }

      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_players",
          name: reservation.name,
          email: reservation.email,
          reservation_code: reservation.reservation_code,
          date: reservation.time_slots?.date,
          time_range: reservation.time_slots
            ? `${reservation.time_slots.start_time?.slice(0, 5)} - ${reservation.time_slots.end_time?.slice(0, 5)}`
            : null,
          plan_name: reservation.plans?.name,
          original_people: reservation.people,
          new_people: Number(people),
          new_total: data.new_total,
          extra_payment: data.extra_payment || 0
        })
      });

      setReservation(prev => ({
        ...prev,
        people: Number(people),
        precio_total: data.new_total ?? prev.precio_total
      }));
      setMessage(t('misReservas.messages.playersUpdated'));

    } catch (err) {
      console.error(err);
      setMessage(t('misReservas.errors.updatePlayers'));
    }
    setUpdateLoading(false);
  }

  async function updateSlot() {
    if (selectedSlots.length === 0) return;
    setUpdateLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change",
          code,
          email,
          newSlotIds: selectedSlots.map(s => s.id)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error);
        setUpdateLoading(false);
        return;
      }

      if (data.extra_payment > 0) {
        setExtraPayment(data.extra_payment);
        setShowPayment(true);
      }

      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_date",
          name: reservation.name,
          email: reservation.email,
          reservation_code: reservation.reservation_code,
          old_date: reservation.time_slots?.date,
          old_time_range: reservation.time_slots
            ? `${reservation.time_slots.start_time?.slice(0, 5)} - ${reservation.time_slots.end_time?.slice(0, 5)}`
            : null,
          new_date: selectedSlots[0]?.date ?? selectedDate,
          new_time_range: selectedSlots.length === 2
            ? `${selectedSlots[0].start_time?.slice(0, 5)} - ${selectedSlots[1].end_time?.slice(0, 5)}`
            : `${selectedSlots[0].start_time?.slice(0, 5)} - ${selectedSlots[0].end_time?.slice(0, 5)}`,
          plan_name: data.new_plan_id
            ? t('misReservas.planHours', { count: effectiveSlotCount })
            : reservation.plans?.name,
          people: reservation.people,
          total_price: data.new_total ?? reservation.precio_total,
          extra_payment: data.extra_payment || 0
        })
      });

      window.location.reload();
    } catch (err) {
      console.error(err);
      setMessage(t('misReservas.errors.updateSlot'));
    }
    setUpdateLoading(false);
  }

  async function cancelReservation() {
    if (!confirm(t('misReservas.cancelDialog'))) return;
    setCancelLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", code, email })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error);
        setCancelLoading(false);
        return;
      }

      const r = data.reservation;
      const timeSlots = r.reservation_slots?.[0]?.time_slots || r.time_slots || null;

      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancellation",
          name: r.name,
          email: r.email,
          reservation_code: r.reservation_code,
          date: timeSlots?.date,
          time_range: timeSlots
            ? `${timeSlots.start_time?.slice(0, 5)} - ${timeSlots.end_time?.slice(0, 5)}`
            : null,
          plan_name: r.plans?.name,
          people: r.people,
          total_price: r.precio_total
        })
      });

      setCancelled(true);
      setReservation(null);

    } catch (err) {
      console.error(err);
      setMessage(t('misReservas.errors.cancelError'));
    }
    setCancelLoading(false);
  }

  function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(t('misReservas.locale'), {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }

  function formatTime(time) {
    return time?.slice(0, 5) || "-";
  }

  function getStatusBadge(status) {
    const statusConfig = {
      pending: { text: t('misReservas.status.pending'), color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      confirmed: { text: t('misReservas.status.confirmed'), color: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { text: t('misReservas.status.cancelled'), color: "bg-red-100 text-red-800", icon: XCircle }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon size={14} />
        {config.text}
      </span>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('misReservas.meta.title')}</title>
        <meta name="description" content={t('misReservas.meta.description')} />
      </Helmet>

      <section className="bg-gradient-to-b from-tiger-green to-tiger-green-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-heading font-bold text-tiger-golden mb-4"
          >
            {t('misReservas.heroTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-tiger-cream max-w-2xl mx-auto"
          >
            {t('misReservas.heroSubtitle')}
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-tiger-cream min-h-screen">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Pantalla de cancelación exitosa */}
          <AnimatePresence>
            {cancelled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl p-10 text-center mb-8"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                  <XCircle className="text-red-500" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('misReservas.cancelled.title')}</h2>
                <p className="text-gray-500 mb-6">
                  {t('misReservas.cancelled.description')}
                </p>
                <Button
                  onClick={handleSearchAnother}
                  className="bg-tiger-green hover:bg-tiger-green/90 text-white"
                >
                  {t('misReservas.cancelled.button')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buscador */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-tiger-golden/20 rounded-full mb-4">
                  <Search className="text-tiger-golden" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-tiger-green">{t('misReservas.search.title')}</h2>
                <p className="text-gray-500 mt-2">{t('misReservas.search.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('misReservas.search.codeLabel')}</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-tiger-orange focus:border-tiger-orange transition-all"
                    placeholder={t('misReservas.search.codePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('misReservas.search.emailLabel')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-tiger-orange focus:border-tiger-orange transition-all"
                    placeholder={t('misReservas.search.emailPlaceholder')}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-tiger-orange hover:bg-tiger-orange/90 text-white py-3 text-base font-bold rounded-lg transition-all duration-300"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {t('misReservas.search.searching')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {t('misReservas.search.button')}
                      <ArrowRight size={18} />
                    </span>
                  )}
                </Button>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2"
                  >
                    <AlertCircle size={16} />
                    {error}
                  </motion.div>
                )}
              </div>
            </form>
          </motion.div>

          {/* Detalle de la reserva */}
          <AnimatePresence>
            {reservation && !cancelled && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-tiger-green to-tiger-green-dark px-6 py-4">
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div>
                        <p className="text-tiger-cream text-sm">{t('misReservas.details.reservationCode')}</p>
                        <p className="text-tiger-golden font-mono text-xl font-bold">{reservation.reservation_code}</p>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="text-tiger-green" size={20} />
                        <div>
                          <p className="text-xs text-gray-500">{t('misReservas.details.date')}</p>
                          <p className="font-medium">{formatDate(reservation.time_slots?.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="text-tiger-green" size={20} />
                        <div>
                          <p className="text-xs text-gray-500">{t('misReservas.details.time')}</p>
                          <p className="font-medium">
                            {formatTime(reservation.time_slots?.start_time)} - {formatTime(reservation.time_slots?.end_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Users className="text-tiger-green" size={20} />
                        <div>
                          <p className="text-xs text-gray-500">{t('misReservas.details.plan')}</p>
                          <p className="font-medium">{reservation.plans?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <CreditCard className="text-tiger-green" size={20} />
                        <div>
                          <p className="text-xs text-gray-500">{t('misReservas.details.total')}</p>
                          <p className="font-medium text-tiger-orange">€{reservation.precio_total}</p>
                        </div>
                      </div>
                    </div>

                    {/* Solo para reservas pendientes y NO compartidas */}
                    {reservation.status === "pending" && !isSharedPlan && (
                      <>
                        <div className="border-t pt-6">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                            <p className="text-amber-800 text-sm flex items-start gap-2">
                              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                              <span>{t('misReservas.pendingNotice')}</span>
                            </p>
                          </div>
                          <Button onClick={confirmReservation} disabled={confirmLoading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-bold">
                            {confirmLoading ? t('misReservas.confirming') : t('misReservas.confirmButton')}
                          </Button>
                        </div>

                        {/* Modificar jugadores */}
                        <div className="border-t pt-6">
                          <h3 className="font-semibold text-tiger-green mb-4">{t('misReservas.modifyPlayers.title')}</h3>
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600">{t('misReservas.modifyPlayers.label')}</span>
                              <input
                                type="number"
                                min={reservation.people}
                                value={people}
                                onChange={(e) => setPeople(Number(e.target.value))}
                                className="border rounded-lg px-3 py-2 w-24 text-center focus:ring-2 focus:ring-tiger-orange"
                              />
                            </div>
                            <Button onClick={updatePlayers} disabled={updateLoading || people === reservation.people} className="bg-tiger-green hover:bg-tiger-green/90 text-white">
                              {updateLoading ? t('misReservas.updating') : t('misReservas.updatePlayersButton')}
                            </Button>
                          </div>
                        </div>

                        {/* Cambiar fecha y horario */}
                        <div className="border-t pt-6">
                          <h3 className="font-semibold text-tiger-green mb-4">{t('misReservas.modifyDateTime.title')}</h3>

                          {/* Selector de duración */}
                          <div className="mb-5">
                            <p className="text-sm text-gray-600 mb-2">
                              {t('misReservas.modifyDateTime.currentDuration', { count: requiredSlots })}
                            </p>
                            <div className="flex gap-3">
                              {[1, 2].map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => {
                                    setNewSlotCount(n === requiredSlots ? null : n);
                                    setSelectedSlots([]);
                                  }}
                                  className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                                    effectiveSlotCount === n
                                      ? "border-tiger-orange bg-tiger-orange/10 text-tiger-orange"
                                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                                  }`}
                                >
                                  {n} {t('misReservas.hours', { count: n })}
                                  {n === requiredSlots && <span className="ml-1 text-xs">({t('misReservas.current')})</span>}
                                </button>
                              ))}
                            </div>

                            {/* Aviso de diferencia de precio */}
                            {slotCountChanged && (
                              <div className={`mt-3 p-3 rounded-lg text-sm border ${
                                slotPriceIncreases
                                  ? "bg-amber-50 border-amber-200 text-amber-800"
                                  : "bg-blue-50 border-blue-200 text-blue-800"
                              }`}>
                                {slotPriceIncreases ? (
                                  t('misReservas.modifyDateTime.priceIncrease', { count: newSlotCount, amount: estimatedDiff })
                                ) : (
                                  t('misReservas.modifyDateTime.priceDecrease', { count: newSlotCount, amount: estimatedDiff })
                                )}
                              </div>
                            )}
                          </div>

                          <CalendarPicker
                            initialDate={reservation?.time_slots?.date}
                            onSelectDate={(date) => {
                              setSelectedDate(date);
                              setSelectedSlots([]);
                            }}
                          />

                          {selectedDate && (
                            <>
                              <p className="text-sm text-gray-500 mt-3 mb-2">
                                {effectiveSlotCount === 2
                                  ? t('misReservas.modifyDateTime.selectTwoHours')
                                  : t('misReservas.modifyDateTime.selectOneHour')}
                              </p>
                              <SlotPickerEdit
                                key={`${selectedDate}-${effectiveSlotCount}`}
                                date={selectedDate}
                                people={people}
                                maxSlots={effectiveSlotCount}
                                minSlots={effectiveSlotCount}
                                currentSlotIds={currentSlotIds}
                                onSelectSlots={(slots) => setSelectedSlots(slots)}
                              />
                            </>
                          )}

                          {selectedSlots.length === effectiveSlotCount && (
                            <Button onClick={updateSlot} disabled={updateLoading} className="w-full mt-4 bg-tiger-orange hover:bg-tiger-orange/90 text-white">
                              {updateLoading ? t('misReservas.changing') : t('misReservas.confirmChangeButton')}
                            </Button>
                          )}
                        </div>
                      </>
                    )}

                    {/* Mensaje para planes compartidos pendientes */}
                    {reservation.status === "pending" && isSharedPlan && (
                      <div className="border-t pt-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-800 text-sm flex items-start gap-2">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>
                              {t('misReservas.sharedPlanNotice')}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Reservas confirmadas NO compartidas */}
                    {reservation.status === "confirmed" && !isSharedPlan && (
                      <div className="border-t pt-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
                          <p className="text-green-800 font-medium">{t('misReservas.confirmedNotice.title')}</p>
                          <p className="text-green-600 text-sm mt-1">
                            {t('misReservas.confirmedNotice.description')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Reservas confirmadas compartidas */}
                    {reservation.status === "confirmed" && isSharedPlan && (
                      <div className="border-t pt-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-center">
                          <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
                          <p className="text-green-800 font-medium">{t('misReservas.confirmedSharedNotice.title')}</p>
                          <p className="text-green-600 text-sm mt-1">
                            {t('misReservas.confirmedSharedNotice.description')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Botón de cancelar */}
                    {showCancelButton && (
                      <div className="border-t pt-6">
                        <Button
                          onClick={cancelReservation}
                          disabled={cancelLoading}
                          variant="destructive"
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          {cancelLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="animate-spin">⏳</span>
                              {t('misReservas.cancelling')}
                            </span>
                          ) : t('misReservas.cancelButton')}
                        </Button>
                        <p className="text-xs text-gray-500 text-center mt-3">
                          ⚠️ {t('misReservas.cancelWarning')}
                        </p>
                      </div>
                    )}

                    {/* Mensajes generales */}
                    <AnimatePresence>
                      {message && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`p-4 rounded-lg text-center ${
                            message.includes("✅")
                              ? "bg-green-50 text-green-800 border border-green-200"
                              : message.includes("💡") || message.includes("⚠️")
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {message}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}