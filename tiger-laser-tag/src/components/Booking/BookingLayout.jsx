import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import CalendarPicker from "./CalendarPicker";
import SlotPicker from "./SlotPicker";
import PlanPicker from "./PlanPicker";
import BookingSummary from "./BookingSummary";
import ReservationForm from "./ReservationForm";

export default function BookingLayout() {

  const navigate = useNavigate();

  const [date, setDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [plan, setPlan] = useState(null);
  const [people, setPeople] = useState(2);
  const [personasElectroshock, setPersonasElectroshock] = useState(2);
  const [showForm, setShowForm] = useState(false);

  const handleSelectSlots = useCallback((slots) => {
    console.log("BookingLayout - slots seleccionados:", slots.map(s => s.start_time));
    setSelectedSlots(slots);
  }, []);

  const handleElectroshockChange = useCallback((value) => {
    setPersonasElectroshock(value);
  }, []);

  function handleConfirm() {
    if (!selectedSlots.length || !plan) return;
    setShowForm(true);

    setTimeout(() => {
      document
        .getElementById("reservation-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    }, 100);
  }

  // ✅ Función auxiliar para obtener el rango de horas
  const getTimeRange = useCallback(() => {
    if (!selectedSlots.length) return "-";
    if (selectedSlots.length === 1) {
      return selectedSlots[0].start_time?.slice(0, 5);
    }
    const sorted = [...selectedSlots].sort(
      (a, b) => a.start_time.localeCompare(b.start_time)
    );
    return `${sorted[0].start_time?.slice(0, 5)} - ${sorted[sorted.length - 1].end_time?.slice(0, 5)}`;
  }, [selectedSlots]);

  // ✅ handleReservationSuccess actualizado
  const handleReservationSuccess = useCallback(async (reservationData) => {
    console.log("Reserva exitosa:", reservationData);
    
    // Primero navegar a la página de confirmación
    navigate(`/reserva-confirmada?code=${reservationData.code}`);
    
    // Luego enviar el correo de confirmación en segundo plano
    try {
      const basePeople = Math.max(people, 10);
      const total_price = basePeople * (plan?.price || 0);
      const timeRange = getTimeRange();
      
      const emailData = {
        name: reservationData.name,
        email: reservationData.email,
        phone: reservationData.phone || "",
        reservation_code: reservationData.code,
        date: date,
        time_range: timeRange,
        duration: selectedSlots.length,
        plan_name: plan?.name || "",
        plan_price: plan?.price || 0,
        people: people,
        personas_electroshock: personasElectroshock,
        total_price: total_price,
        menor_edad: reservationData.menor_edad || false
      };
      
      console.log("Enviando email de confirmación:", emailData);
      
      const emailRes = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({action: "reservation", ...emailData})
      });
      
      if (!emailRes.ok) {
        const errorText = await emailRes.text();
        console.error("Error sending confirmation email:", errorText);
      } else {
        console.log("✅ Email de confirmación enviado exitosamente");
      }
      
    } catch (emailError) {
      console.error("❌ Error sending confirmation email:", emailError);
    }
  }, [navigate, people, plan, date, selectedSlots, personasElectroshock, getTimeRange]);

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      {/* LEFT */}
      <div className="bg-white p-6 rounded-xl shadow space-y-8">
        <CalendarPicker onSelectDate={setDate} />

        {date && (
          <SlotPicker
            key={`slots-${date}`}
            date={date}
            people={people}
            onSelectSlots={handleSelectSlots}
            initialSlots={selectedSlots}
          />
        )}

        {selectedSlots.length > 0 && (
          <PlanPicker 
            selectedSlots={selectedSlots}
            onSelectPlan={setPlan}
          />
        )}
      </div>

      {/* RIGHT */}
      <div className="lg:sticky lg:top-28 h-fit">
        <div className="bg-white p-6 rounded-xl shadow space-y-6">
          <BookingSummary
            date={date}
            slots={selectedSlots}
            plan={plan}
            people={people}
            setPeople={setPeople}
            onConfirm={handleConfirm}
            showForm={showForm}
            onElectroshockChange={handleElectroshockChange}
          />

          {showForm && (
            <div
              id="reservation-form"
              className="pt-6 border-t animate-fade-in"
            >
              <ReservationForm
                selectedSlots={selectedSlots}
                plan={plan}
                people={people}
                personas_electroshock={personasElectroshock}
                onSuccess={handleReservationSuccess}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}