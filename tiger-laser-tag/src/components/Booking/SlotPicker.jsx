import { useEffect, useState } from "react";

export default function SlotPicker({ date, people, onSelectSlot }) {

  const [slots,setSlots] = useState([]);
  const [selectedSlot,setSelectedSlot] = useState(null);
  const [loading,setLoading] = useState(false);

  useEffect(()=>{
    if(date){
      loadSlots();
    }
  },[date]);

  async function loadSlots(){

    setLoading(true);

    try{

      const res = await fetch(`/api/getSlotsByDate?date=${date}`);
      const data = await res.json();

      setSlots(data.slots || []);

    }catch(err){
      console.error("Error loading slots",err);
    }

    setLoading(false);
  }

  function handleSelect(slot){

    setSelectedSlot(slot);

    if(onSelectSlot){
      onSelectSlot(slot);
    }

  }

  function remainingCapacity(slot){
    return slot.max_capacity - slot.reserved_spots;
  }

  return (

    <div className="mt-8">

      <h3 className="font-semibold mb-4">
        Horarios disponibles
      </h3>

      {loading && (
        <div className="text-sm text-gray-500">
          Cargando horarios...
        </div>
      )}

      {!loading && slots.length === 0 && (
        <div className="text-sm text-gray-500">
          No hay horarios disponibles para este día
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">

        {slots.map((slot)=>{

          const remaining = remainingCapacity(slot);

          const isAvailable = remaining >= people;

          const isSelected = selectedSlot?.id === slot.id;

          return (

            <button
              key={slot.id}
              onClick={()=>handleSelect(slot)}
              disabled={!isAvailable}
              className={`
                p-3 rounded-lg border text-sm
                transition
                flex flex-col items-center
                ${isSelected
                  ? "bg-tiger-orange text-white border-tiger-orange"
                  : isAvailable
                    ? "bg-white hover:bg-gray-50"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"}
              `}
            >

              <span className="font-semibold">
                {slot.start_time}
              </span>

              {isAvailable ? (
                <span className="text-xs opacity-80">
                  {remaining} plazas
                </span>
              ) : (
                <span className="text-xs">
                  Completo
                </span>
              )}

            </button>

          );

        })}

      </div>

    </div>
  );
}