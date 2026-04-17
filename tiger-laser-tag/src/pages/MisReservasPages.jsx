import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { Search, Calendar, Clock, Users, CreditCard, AlertCircle, CheckCircle, XCircle, ArrowRight, CheckSquare } from "lucide-react";
import CalendarPicker from "../components/Booking/CalendarPicker";
import SlotPickerEdit from "../components/Booking/SlotPickerEdit";
import { Button } from "@/components/ui/button";

export default function MisReservas() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [reservation, setReservation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [newSlotCount, setNewSlotCount] = useState(null); // null = sin cambio de duración
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
        setError(data.error || "No se encontró la reserva");
        setLoading(false);
        return;
      }

      setReservation(data.reservation);
      setPeople(data.reservation.people);
    } catch (err) {
      console.error(err);
      setError("Error de conexión");
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

  // Función para confirmar la reserva
  async function confirmReservation() {
    if (!confirm("¿Confirmar esta reserva? Una vez confirmada no podrás modificarla.")) return;

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
        setMessage(data.error || "Error al confirmar la reserva");
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
      setMessage("✅ ¡Reserva confirmada correctamente! Se ha enviado un email de confirmación.");
      setTimeout(() => setMessage(""), 5000);

    } catch (err) {
      console.error(err);
      setMessage("Error confirmando la reserva");
    }
    setConfirmLoading(false);
  }

  // ─── Constantes de cálculo ───────────────────────────────────────────────
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

  // Plan compartido: active === false → ocultar sección de cambio de horario
  const isSharedPlan = reservation?.plans?.active === false;

  // Número de slots efectivo: el nuevo elegido o el original
  const effectiveSlotCount = newSlotCount ?? requiredSlots;

  // Cálculo estimado de diferencia de precio al cambiar slots
  const slotCountChanged = newSlotCount !== null && newSlotCount !== requiredSlots;
  const estimatedNewTotal = pricePerPerson * newSlotCount * billablePeople(originalPeople);
  const estimatedCurrentTotal = reservation?.precio_total ?? 0;
  const estimatedDiff = Math.abs(estimatedNewTotal - estimatedCurrentTotal);
  const slotPriceIncreases = newSlotCount > requiredSlots;

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
      setMessage("✅ Jugadores actualizados correctamente");

    } catch (err) {
      console.error(err);
      setMessage("Error actualizando jugadores");
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
            ? `Plan ${effectiveSlotCount} hora${effectiveSlotCount > 1 ? "s" : ""}`
            : reservation.plans?.name,
          people: reservation.people,
          total_price: data.new_total ?? reservation.precio_total,
          extra_payment: data.extra_payment || 0
        })
      });

      window.location.reload();
    } catch (err) {
      console.error(err);
      setMessage("Error cambiando horario");
    }
    setUpdateLoading(false);
  }

  async function cancelReservation() {
    if (!confirm("¿Estás seguro de que quieres cancelar la reserva? Esta acción no se puede deshacer.")) return;
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
      setMessage("Error cancelando reserva");
    }
    setCancelLoading(false);
  }

  function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }

  function formatTime(time) {
    return time?.slice(0, 5) || "-";
  }

  function getStatusBadge(status) {
    const statusConfig = {
      pending: { text: "Pendiente de confirmar", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      confirmed: { text: "Confirmada", color: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { text: "Cancelada", color: "bg-red-100 text-red-800", icon: XCircle }
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
        <title>Mis Reservas - Tiger Laser Tag</title>
        <meta name="description" content="Consulta, modifica o cancela tu reserva de Laser Tag en Marbella." />
      </Helmet>

      <section className="bg-gradient-to-b from-tiger-green to-tiger-green-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-heading font-bold text-tiger-golden mb-4"
          >
            Mis Reservas
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-tiger-cream max-w-2xl mx-auto"
          >
            Consulta, modifica o cancela tu reserva de Laser Tag
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
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Reserva cancelada</h2>
                <p className="text-gray-500 mb-6">
                  Tu reserva ha sido cancelada correctamente. Si tienes alguna duda, contacta con nosotros.
                </p>
                <Button
                  onClick={handleSearchAnother}
                  className="bg-tiger-green hover:bg-tiger-green/90 text-white"
                >
                  Consultar otra reserva
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buscador - SIEMPRE VISIBLE */}
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
                <h2 className="text-2xl font-bold text-tiger-green">Consultar reserva</h2>
                <p className="text-gray-500 mt-2">Ingresa el código y el email con el que reservaste</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código de reserva</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-tiger-orange focus:border-tiger-orange transition-all"
                    placeholder="Ej: ABC123XYZ"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-tiger-orange focus:border-tiger-orange transition-all"
                    placeholder="tu@email.com"
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
                      Buscando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Consultar reserva
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
                        <p className="text-tiger-cream text-sm">Código de reserva</p>
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
                          <p className="text-xs text-gray-500">Fecha</p>
                          <p className="font-medium">{formatDate(reservation.time_slots?.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="text-tiger-green" size={20} />
                        <div>
                          <p className="text-xs text-gray-500">Hora</p>
                          <p className="font-medium">
                            {formatTime(reservation.time_slots?.start_time) + " - " + formatTime(reservation.time_slots?.end_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Users className="text-tiger-green" size={20} />
                        <div>
                          <p className="text-xs text-gray-500">Plan</p>
                          <p className="font-medium">{reservation.plans?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <CreditCard className="text-tiger-green" size={20} />
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-medium text-tiger-orange">€{reservation.precio_total}</p>
                        </div>
                      </div>
                    </div>

                    {/* ============================================ */}
                    {/* SECCIÓN EXCLUSIVA PARA RESERVAS PENDIENTES  */}
                    {/* ============================================ */}
                    {reservation.status === "pending" && (
                      <>
                        {/* Botón CONFIRMAR RESERVA */}
                        <div className="border-t pt-6">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                            <p className="text-amber-800 text-sm flex items-start gap-2">
                              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                              <span>
                                Tu reserva está pendiente de confirmación. Una vez confirmada, no podrás modificar los datos.
                                Te recomendamos confirmarla lo antes posible para asegurar tu plaza.
                              </span>
                            </p>
                          </div>
                          <Button
                            onClick={confirmReservation}
                            disabled={confirmLoading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-bold"
                          >
                            {confirmLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">⏳</span>
                                Confirmando...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <CheckSquare size={18} />
                                ✅ Confirmar reserva
                              </span>
                            )}
                          </Button>
                        </div>

                        {/* Modificar jugadores */}
                        <div className="border-t pt-6">
                          <h3 className="font-semibold text-tiger-green mb-4">Modificar número de jugadores</h3>
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600">Jugadores:</span>
                              <input
                                type="number"
                                min={reservation.people}
                                value={people}
                                onChange={(e) => setPeople(Number(e.target.value))}
                                className="border rounded-lg px-3 py-2 w-24 text-center focus:ring-2 focus:ring-tiger-orange"
                              />
                            </div>
                            <Button
                              onClick={updatePlayers}
                              disabled={updateLoading || people === reservation.people}
                              className="bg-tiger-green hover:bg-tiger-green/90 text-white"
                            >
                              {updateLoading ? "Actualizando..." : "Actualizar jugadores"}
                            </Button>
                          </div>

                          <AnimatePresence>
                            {showExtraWarning && (
                              <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg"
                              >
                                <p className="text-sm text-amber-800">
                                  💡 Al superar los 10 jugadores se generará un pago adicional de <strong>€{extra}</strong>
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                            {message && message.includes("Jugadores") && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center gap-2"
                              >
                                <CheckCircle size={16} />
                                {message}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* ─── Cambiar fecha y horario ─────────────────────── */}
                        {!isSharedPlan ? (
                          <div className="border-t pt-6">
                            <h3 className="font-semibold text-tiger-green mb-4">Cambiar fecha y horario</h3>

                            {/* Selector de duración (1 o 2 horas) */}
                            <div className="mb-5">
                              <p className="text-sm text-gray-600 mb-2">
                                Tu reserva actual es de{" "}
                                <strong>{requiredSlots} hora{requiredSlots > 1 ? "s" : ""}</strong>.
                                ¿Quieres cambiar la duración?
                              </p>
                              <div className="flex gap-3">
                                {[1, 2].map((n) => {
                                  const isSelected = effectiveSlotCount === n;
                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => {
                                        setNewSlotCount(n === requiredSlots ? null : n);
                                        setSelectedSlots([]);
                                      }}
                                      className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                                        isSelected
                                          ? "border-tiger-orange bg-tiger-orange/10 text-tiger-orange"
                                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                                      }`}
                                    >
                                      {n} hora{n > 1 ? "s" : ""}
                                      {n === requiredSlots && (
                                        <span className="ml-1 text-xs opacity-60">(actual)</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Aviso de diferencia de precio al cambiar slots */}
                              <AnimatePresence>
                                {slotCountChanged && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className={`mt-3 p-3 rounded-lg text-sm border ${
                                      slotPriceIncreases
                                        ? "bg-amber-50 border-amber-200 text-amber-800"
                                        : "bg-blue-50 border-blue-200 text-blue-800"
                                    }`}
                                  >
                                    {slotPriceIncreases ? (
                                      <>
                                        ⚠️ Al pasar a <strong>{newSlotCount} horas</strong> se generará un
                                        pago adicional de aproximadamente{" "}
                                        <strong>€{estimatedDiff}</strong>. El precio exacto se
                                        confirmará al guardar.
                                      </>
                                    ) : (
                                      <>
                                        💡 Al reducir a <strong>{newSlotCount} hora</strong>, el precio
                                        bajará aproximadamente <strong>€{estimatedDiff}</strong>. El
                                        ajuste exacto se confirmará al guardar.
                                      </>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
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
                                    ? "⚠️ Tu reserva es de 2 horas, selecciona 2 horas consecutivas"
                                    : "Selecciona 1 hora disponible"}
                                </p>
                                <SlotPickerEdit
                                  key={`${selectedDate}-${effectiveSlotCount}`}
                                  date={selectedDate}
                                  people={people}
                                  maxSlots={effectiveSlotCount}
                                  minSlots={effectiveSlotCount}
                                  onSelectSlots={(slots) => setSelectedSlots(slots)}
                                />
                              </>
                            )}

                            <AnimatePresence>
                              {selectedSlots.length === effectiveSlotCount && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                >
                                  {/* Resumen del cambio de plan antes de confirmar */}
                                  {slotCountChanged && (
                                    <div className={`mt-4 p-3 rounded-lg text-sm border ${
                                      slotPriceIncreases
                                        ? "bg-amber-50 border-amber-200 text-amber-800"
                                        : "bg-blue-50 border-blue-200 text-blue-800"
                                    }`}>
                                      {slotPriceIncreases
                                        ? `⚠️ Se cambiará tu plan a ${newSlotCount} horas. Se generará un cobro adicional al confirmar.`
                                        : `💡 Se cambiará tu plan a ${newSlotCount} hora. Se aplicará una reducción en el precio al confirmar.`
                                      }
                                    </div>
                                  )}

                                  <Button
                                    onClick={updateSlot}
                                    disabled={updateLoading}
                                    className="w-full mt-4 bg-tiger-orange hover:bg-tiger-orange/90 text-white"
                                  >
                                    {updateLoading ? (
                                      <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">⏳</span>
                                        Cambiando...
                                      </span>
                                    ) : "Confirmar cambio de horario"}
                                  </Button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ) : (
                          /* Aviso plan compartido: no se puede cambiar horario */
                          <div className="border-t pt-6">
                            <h3 className="font-semibold text-tiger-green mb-3">Cambiar fecha y horario</h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                              <AlertCircle className="text-gray-400 flex-shrink-0 mt-0.5" size={18} />
                              <p className="text-sm text-gray-600">
                                Este tipo de reserva es de{" "}
                                <strong>horario compartido</strong> y no permite cambiar la fecha ni el
                                horario. Si necesitas modificaciones, por favor{" "}
                                <a href="/contacto" className="text-tiger-orange underline">
                                  contáctanos
                                </a>
                                .
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Cancelar reserva */}
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
                                Cancelando...
                              </span>
                            ) : "Cancelar reserva"}
                          </Button>
                          <p className="text-xs text-gray-500 text-center mt-3">
                            ⚠️ Esta acción no se puede deshacer
                          </p>
                        </div>
                      </>
                    )}

                    {/* ============================================ */}
                    {/* SECCIÓN EXCLUSIVA PARA RESERVAS CONFIRMADAS */}
                    {/* ============================================ */}
                    {reservation.status === "confirmed" && (
                      <div className="border-t pt-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
                          <p className="text-green-800 font-medium">✅ Reserva confirmada</p>
                          <p className="text-green-600 text-sm mt-1">
                            Tu reserva ya está confirmada. Presenta el código de la reserva el día de tu visita.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mensajes generales */}
                    <AnimatePresence>
                      {message && !message.includes("Jugadores") && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`p-4 rounded-lg text-center ${
                            message.includes("✅")
                              ? "bg-green-50 text-green-800 border border-green-200"
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
