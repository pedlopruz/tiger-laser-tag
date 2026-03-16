import { useState } from "react";
import CalendarPicker from "../components/Booking/CalendarPicker";
import SlotPicker from "../components/Booking/SlotPicker";

export default function MisReservas() {

  const [code,setCode] = useState("");
  const [email,setEmail] = useState("");

  const [reservation,setReservation] = useState(null);

  const [selectedDate,setSelectedDate] = useState(null);
  const [selectedSlot,setSelectedSlot] = useState(null);

  const [people,setPeople] = useState(null);

  const [extraPayment,setExtraPayment] = useState(0);
  const [showPayment,setShowPayment] = useState(false);

  const [error,setError] = useState("");
  const [message,setMessage] = useState("");

  const [loading,setLoading] = useState(false);
  const [updateLoading,setUpdateLoading] = useState(false);
  const [cancelLoading,setCancelLoading] = useState(false);


  /* =========================
     BUSCAR RESERVA
  ========================= */

  async function handleSearch(e){

    e.preventDefault();

    setError("");
    setMessage("");
    setReservation(null);

    setLoading(true);

    try{

      const res = await fetch("/api/reservations",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          action:"access",
          code,
          email
        })
      });

      const data = await res.json();

      if(!res.ok){
        setError(data.error || "No se encontró la reserva");
        setLoading(false);
        return;
      }

      const r = data.reservation;

      setReservation(r);
      setPeople(r.people);

    }catch(err){

      console.error(err);
      setError("Error de conexión");

    }

    setLoading(false);

  }


  /* =========================
     CALCULO PRECIO
  ========================= */

  const pricePerPerson = reservation?.plans?.price || 0;

  const originalPeople = reservation?.people || 0;

  const originalTotal = pricePerPerson * originalPeople;

  const newTotal = pricePerPerson * (people || 0);

  const extra = Math.max(newTotal - originalTotal,0);


  /* =========================
     ACTUALIZAR JUGADORES
  ========================= */

  async function updatePlayers(){

    if(!people) return;

    setUpdateLoading(true);

    try{

      const res = await fetch("/api/reservations",{

        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          action:"change",
          code,
          email,
          people:Number(people)
        })

      });

      const data = await res.json();

      if(!res.ok){

        setMessage(data.error);
        setUpdateLoading(false);
        return;

      }

      if(data.extra_payment > 0){

        setExtraPayment(data.extra_payment);
        setShowPayment(true);

      }else{

        window.location.reload();

      }

    }catch(err){

      console.error(err);
      setMessage("Error actualizando jugadores");

    }

    setUpdateLoading(false);

  }


  /* =========================
     CAMBIAR SLOT
  ========================= */

  async function updateSlot(){

    if(!selectedSlot) return;

    setUpdateLoading(true);

    try{

      const res = await fetch("/api/reservations",{

        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          action:"change",
          code,
          email,
          newSlotId:selectedSlot.id
        })

      });

      const data = await res.json();

      if(!res.ok){

        setMessage(data.error);
        setUpdateLoading(false);
        return;

      }

      window.location.reload();

    }catch(err){

      console.error(err);
      setMessage("Error cambiando horario");

    }

  }


  /* =========================
     CANCELAR
  ========================= */

  async function cancelReservation(){

    if(!confirm("¿Seguro que quieres cancelar la reserva?")) return;

    setCancelLoading(true);

    try{

      const res = await fetch("/api/reservations",{

        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          action:"cancel",
          code,
          email
        })

      });

      const data = await res.json();

      if(!res.ok){

        setMessage(data.error);
        setCancelLoading(false);
        return;

      }

      setReservation(data.reservation);
      setMessage("Reserva cancelada");

    }catch(err){

      console.error(err);
      setMessage("Error cancelando reserva");

    }

    setCancelLoading(false);

  }


  function formatDate(date){

    if(!date) return "-";

    return new Date(date).toLocaleDateString("es-ES",{
      weekday:"long",
      day:"numeric",
      month:"long"
    });

  }

  function formatTime(time){
    return time?.slice(0,5) || "-";
  }


  return (

<section className="py-20 bg-tiger-cream min-h-screen">

<div className="container mx-auto px-4 max-w-2xl">


{/* BUSCADOR */}

<form
onSubmit={handleSearch}
className="bg-white p-8 rounded-2xl shadow-lg space-y-6 border"
>

<h1 className="text-4xl font-bold text-tiger-green text-center">
Consultar reserva
</h1>

<input
value={code}
onChange={(e)=>setCode(e.target.value)}
className="w-full border rounded-lg p-3"
placeholder="Código de reserva"
required
/>

<input
type="email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full border rounded-lg p-3"
placeholder="Email"
required
/>

<button
type="submit"
className="w-full bg-tiger-orange text-white py-3 rounded-lg"
>

{loading ? "Buscando..." : "Consultar reserva"}

</button>

{error && (
<div className="text-red-500 text-sm text-center">
{error}
</div>
)}

</form>


{/* RESERVA */}

{reservation && (

<div className="mt-10 bg-white rounded-2xl shadow-xl p-8 border space-y-8">


{/* RESUMEN */}

<div className="space-y-3 text-sm">

<div className="flex justify-between">
<span>Fecha</span>
<span>{formatDate(reservation.time_slots?.date)}</span>
</div>

<div className="flex justify-between">
<span>Hora</span>
<span>{formatTime(reservation.time_slots?.start_time)}</span>
</div>

<div className="flex justify-between">
<span>Plan</span>
<span>{reservation.plans?.name}</span>
</div>

</div>


{/* JUGADORES */}

<div className="flex items-center justify-between">

<span>Jugadores</span>

<input
type="number"
min={reservation.people}
value={people}
onChange={(e)=>setPeople(Number(e.target.value))}
className="border rounded-lg px-3 py-1 w-20 text-center"
/>

</div>


{/* PRECIO */}

<div className="border-t pt-4 space-y-2">

<div className="flex justify-between text-sm">
<span>Reserva original</span>
<span>{originalTotal}€</span>
</div>

{extra > 0 && (

<div className="flex justify-between text-sm text-tiger-orange">
<span>Jugadores añadidos</span>
<span>+{extra}€</span>
</div>

)}

<div className="flex justify-between font-bold text-lg">

<span>Total a pagar</span>

<span className="text-tiger-orange">
{extra}€
</span>

</div>

</div>


<button
onClick={updatePlayers}
className="bg-tiger-green text-white px-6 py-2 rounded-lg"
>

{updateLoading ? "Actualizando..." : "Actualizar jugadores"}

</button>


{/* CALENDARIO */}

<CalendarPicker
initialDate={reservation?.time_slots?.date}
onSelectDate={(date)=>{

setSelectedDate(date)
setSelectedSlot(null)

}}
/>


{/* SLOT PICKER SOLO SI SE SELECCIONA FECHA */}

{selectedDate && (

<SlotPicker
date={selectedDate}
people={people}
reservedSlot={reservation?.time_slots}
onSelectSlot={(slot)=>{

setSelectedSlot(slot)

}}
/>

)}


{selectedSlot && (

<button
onClick={updateSlot}
className="bg-tiger-green text-white px-6 py-3 rounded-lg w-full"
>

Cambiar horario

</button>

)}


<button
onClick={cancelReservation}
className="bg-red-500 text-white px-6 py-3 rounded-lg w-full"
>

{cancelLoading ? "Cancelando..." : "Cancelar reserva"}

</button>


</div>

)}

{message && (

<div className="text-center mt-6 text-sm text-tiger-green">
{message}
</div>

)}

</div>

</section>

  );

}