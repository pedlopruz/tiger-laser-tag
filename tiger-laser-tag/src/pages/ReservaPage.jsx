import { useState } from "react";

import CalendarPicker from "../components/CalendarPicker";
import SlotPicker from "../components/SlotPicker";
import PlanPicker from "../components/PlanPicker";
import ReservationForm from "../components/ReservationForm";

export default function Reservar() {

  const [step, setStep] = useState(1);

  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [plan, setPlan] = useState(null);
  const [people, setPeople] = useState(2);

  const [reservationResult, setReservationResult] = useState(null);

  // RESET
  const restart = () => {
    setStep(1);
    setDate(null);
    setSlot(null);
    setPlan(null);
    setReservationResult(null);
  };

  // CONFIRMATION SCREEN
  if (reservationResult) {

    return (
      <div style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>

        <h1>Reserva confirmada 🎉</h1>

        <p>
          Tu código de reserva es:
        </p>

        <h2>
          {reservationResult.reservation_code ||
           reservationResult.reservation?.reservation_code}
        </h2>

        <p>Guárdalo para futuras gestiones.</p>

        <button
          onClick={restart}
          style={{
            marginTop: 20,
            padding: 12,
            borderRadius: 6,
            border: "none",
            background: "#0070f3",
            color: "white",
            cursor: "pointer"
          }}
        >
          Nueva reserva
        </button>

      </div>
    );

  }

  return (

    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>

      <h1>Reservar partida</h1>

      {/* selector personas */}
      {step === 1 && (
        <div style={{ marginBottom: 20 }}>
          <label>
            Personas:
          </label>

          <input
            type="number"
            min="1"
            max="20"
            value={people}
            onChange={(e) =>
              setPeople(Number(e.target.value))
            }
            style={{ marginLeft: 10 }}
          />
        </div>
      )}

      {/* STEP 1 CALENDAR */}
      {step === 1 && (

        <CalendarPicker
          onSelectDate={(selectedDate) => {
            setDate(selectedDate);
            setStep(2);
          }}
        />

      )}

      {/* STEP 2 SLOT */}
      {step === 2 && (

        <SlotPicker
          date={date}
          people={people}
          onSelectSlot={(selectedSlot) => {
            setSlot(selectedSlot);
            setStep(3);
          }}
        />

      )}

      {/* STEP 3 PLAN */}
      {step === 3 && (

        <PlanPicker
          onSelectPlan={(selectedPlan) => {
            setPlan(selectedPlan);
            setStep(4);
          }}
        />

      )}

      {/* STEP 4 FORM */}
      {step === 4 && (

        <ReservationForm
          date={date}
          slot={slot}
          plan={plan}
          people={people}
          onSuccess={(result) => {
            setReservationResult(result);
          }}
        />

      )}

    </div>

  );

}