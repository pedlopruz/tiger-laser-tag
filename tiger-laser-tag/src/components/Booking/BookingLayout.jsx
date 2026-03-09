import { useState, useRef } from "react";

import CalendarPicker from "./CalendarPicker";
import SlotPicker from "./SlotPicker";
import PlanPicker from "./PlanPicker";
import BookingSummary from "./BookingSummary";
import ReservationForm from "./ReservationForm";

export default function BookingLayout() {

  const [date,setDate] = useState(null);
  const [slot,setSlot] = useState(null);
  const [plan,setPlan] = useState(null);
  const [people,setPeople] = useState(2);

  const [showForm,setShowForm] = useState(false);

  const formRef = useRef(null);

  function handleConfirm(){

    setShowForm(true);

    setTimeout(()=>{
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    },100);

  }

  return (

    <div className="grid md:grid-cols-2 gap-10">

      {/* columna izquierda */}

      <div className="bg-white p-6 rounded-xl shadow">

        <CalendarPicker onSelectDate={setDate}/>

        {date && (
          <SlotPicker
            date={date}
            people={people}
            onSelectSlot={setSlot}
          />
        )}

        {slot && (
          <PlanPicker onSelectPlan={setPlan}/>
        )}

      </div>


      {/* columna derecha */}

      <div className="space-y-6">

        <div className="sticky top-28">

          <BookingSummary
            date={date}
            slot={slot}
            plan={plan}
            people={people}
            setPeople={setPeople}
            onConfirm={handleConfirm}
          />

        </div>

        {showForm && (

          <div
            ref={formRef}
            className="bg-white p-6 rounded-xl shadow animate-fade-in"
          >

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

  );
}