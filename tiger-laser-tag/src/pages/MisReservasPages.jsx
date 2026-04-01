import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { Search, Calendar, Clock, Users, CreditCard, AlertCircle, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import CalendarPicker from "../components/Booking/CalendarPicker";
import SlotPicker from "../components/Booking/SlotPicker";
import { Button } from "@/components/ui/button";

export default function MisReservas() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [reservation, setReservation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [people, setPeople] = useState(null);
  const [extraPayment, setExtraPayment] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Buscar reserva
  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setReservation(null);
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

  // Calcular precios
  const pricePerPerson = reservation?.plans?.price || 0;
  const originalPeople = reservation?.people || 0;
  const originalTotal = pricePerPerson * originalPeople;
  const newTotal = pricePerPerson * (people || 0);
  const extra = Math.max(newTotal - originalTotal, 0);

  // Actualizar jugadores
  async function updatePlayers() {
    if (!people) return;
    setUpdateLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change",
          code,
          email,
          people: Number(people)
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
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      setMessage("Error actualizando jugadores");
    }
    setUpdateLoading(false);
  }

  // Cambiar slot
  async function updateSlot() {
    if (!selectedSlot) return;
    setUpdateLoading(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change",
          code,
          email,
          newSlotId: selectedSlot.id
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error);
        setUpdateLoading(false);
        return;
      }

      window.location.reload();
    } catch (err) {
      console.error(err);
      setMessage("Error cambiando horario");
    }
    setUpdateLoading(false);
  }

  // Cancelar reserva
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

      setReservation(data.reservation);
      setMessage("Reserva cancelada correctamente");
    } catch (err) {
      console.error(err);
      setMessage("Error cancelando reserva");
    }
    setCancelLoading(false);
  }

  // Formateadores
  function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function formatTime(time) {
    return time?.slice(0, 5) || "-";
  }

  function getStatusBadge(status) {
    const statusConfig = {
      pending: { text: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
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

      {/* Hero Section */}
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

      {/* Main Content */}
      <section className="py-20 bg-tiger-cream min-h-screen">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Buscador */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
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
            {reservation && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                className="mt-10"
              >
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  {/* Header con estado */}
                  <div className="bg-gradient-to-r from-tiger-green to-tiger-green-dark px-6 py-4">
                    <div className="flex justify-between items-center flex-wrap gap-3">
                      <div>
                        <p className="text-tiger-cream text-sm">Código de reserva</p>
                        <p className="text-tiger-golden font-mono text-xl font-bold">{reservation.reservation_code}</p>
                      </div>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6 space-y-6">
                    {/* Datos principales */}
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
                          <p className="font-medium">{formatTime(reservation.time_slots?.start_time)}</p>
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

                    {/* Modificar jugadores */}
                    {reservation.status !== 'cancelled' && (
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

                        {extra > 0 && (
                          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
                            <p className="text-sm text-amber-800">
                              💡 Al aumentar el número de jugadores, se generará un pago adicional de <strong>€{extra}</strong>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cambiar horario */}
                    {reservation.status !== 'cancelled' && (
                      <div className="border-t pt-6">
                        <h3 className="font-semibold text-tiger-green mb-4">Cambiar fecha y horario</h3>
                        <CalendarPicker
                          initialDate={reservation?.time_slots?.date}
                          onSelectDate={(date) => {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                          }}
                        />

                        {selectedDate && (
                          <div className="mt-4">
                            <SlotPicker
                              date={selectedDate}
                              people={people}
                              reservedSlot={{ id: reservation?.slot_id }}
                              onSelectSlot={(slot) => setSelectedSlot(slot)}
                            />
                          </div>
                        )}

                        {selectedSlot && (
                          <Button
                            onClick={updateSlot}
                            className="w-full mt-4 bg-tiger-orange hover:bg-tiger-orange/90 text-white"
                          >
                            {updateLoading ? "Cambiando..." : "Confirmar cambio de horario"}
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Cancelar reserva */}
                    {reservation.status !== 'cancelled' && (
                      <div className="border-t pt-6">
                        <Button
                          onClick={cancelReservation}
                          disabled={cancelLoading}
                          variant="destructive"
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          {cancelLoading ? "Cancelando..." : "Cancelar reserva"}
                        </Button>
                        <p className="text-xs text-gray-500 text-center mt-3">
                          ⚠️ Esta acción no se puede deshacer
                        </p>
                      </div>
                    )}

                    {/* Mensajes */}
                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg text-center ${
                          message.includes("cancelada") 
                            ? "bg-green-50 text-green-800 border border-green-200" 
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {message.includes("cancelada") ? (
                          <CheckCircle className="inline mr-2" size={18} />
                        ) : null}
                        {message}
                      </motion.div>
                    )}
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