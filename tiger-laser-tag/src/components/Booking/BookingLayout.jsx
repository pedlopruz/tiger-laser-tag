import { useState } from "react";

import CalendarPicker from "./CalendarPicker";
import SlotPicker from "./SlotPicker";
import PlanPicker from "./PlanPicker";
import BookingSummary from "./BookingSummary";
import ReservationForm from "./ReservationForm";

export default function BookingLayout() {

  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [plan, setPlan] = useState(null);
  const [people, setPeople] = useState(2);
  const [showForm, setShowForm] = useState(false);

  function handleConfirm() {
    setShowForm(true);
  }

  return (

    <div className="grid md:grid-cols-2 gap-10">

      {/* COLUMNA IZQUIERDA */}

      <div className="bg-white p-6 rounded-xl shadow space-y-8">

        <CalendarPicker onSelectDate={setDate} />

        {date && (
          <SlotPicker
            date={date}
            people={people}
            onSelectSlot={setSlot}
          />
        )}

        {slot && (
          <PlanPicker onSelectPlan={setPlan} />
        )}

      </div>


      {/* COLUMNA DERECHA */}

      <div className="sticky top-28">

        <div className="bg-white p-6 rounded-xl shadow space-y-6">

          <BookingSummary
            date={date}
            slot={slot}
            plan={plan}
            people={people}
            setPeople={setPeople}
            showForm={showForm}
            onConfirm={handleConfirm}
          />

          {showForm && (
            <div className="pt-4 border-t animate-fade-in">

              <ReservationForm
                date={date}
                slot={slot}
                plan={plan}
                people={people}
              />

            </div>
          )}

        </div>

      </div>

    </div>

  );
}