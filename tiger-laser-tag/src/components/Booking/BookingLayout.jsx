import { useState } from "react";
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
  const [showForm, setShowForm] = useState(false);

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

  function handleReservationSuccess(data){
    navigate(`/reserva-confirmada?code=${data.code}`);
  }

  return (

    <div className="grid lg:grid-cols-2 gap-10">

      {/* LEFT */}

      <div className="bg-white p-6 rounded-xl shadow space-y-8">

        <CalendarPicker onSelectDate={setDate} />

        {date && (
          <SlotPicker
            date={date}
            people={people}
            onSelectSlots={setSelectedSlots}
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
                onSuccess={handleReservationSuccess}
              />

            </div>

          )}

        </div>

      </div>

    </div>

  );

}