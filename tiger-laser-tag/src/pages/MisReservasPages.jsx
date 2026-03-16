import { useState } from "react";
import CalendarPicker from "../components/Booking/CalendarPicker";
import SlotPicker from "../components/Booking/SlotPicker";

export default function MisReservas() {

  const [code,setCode] = useState("");
  const [email,setEmail] = useState("");

  const [reservation,setReservation] = useState(null);

  const [selectedDate,setSelectedDate] = useState(null);
  const [selectedSlot,setSelectedSlot] = useState(null);

  const [newPeople,setNewPeople] = useState("");

  const [error,setError] = useState("");
  const [message,setMessage] = useState("");

  const [loading,setLoading] = useState(false);
  const [cancelLoading,setCancelLoading] = useState(false);
  const [updateLoading,setUpdateLoading] = useState(false);


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

      setReservation(data.reservation);

    }catch(err){

      console.error(err);
      setError("Error de conexión");

    }

    setLoading(false);

  }


  async function updatePlayers(){

    if(!newPeople) return;

    setUpdateLoading(true);
    setMessage("");

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
          people:Number(newPeople)
        })
      });

      const data = await res.json();

      if(!res.ok){
        setMessage(data.error);
        setUpdateLoading(false);
        return;
      }

      setReservation(data.reservation);
      setNewPeople("");

      if(data.extra_payment > 0){

        setMessage(`Debes pagar €${data.extra_payment} por jugadores añadidos`);

      }else{

        setMessage("Reserva actualizada correctamente");

      }

    }catch(err){

      console.error(err);
      setMessage("Error actualizando");

    }

    setUpdateLoading(false);

  }


  async function updateSlot(){

    if(!selectedSlot) return;

    setUpdateLoading(true);
    setMessage("");

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

      setReservation(data.reservation);

      setSelectedDate(null);
      setSelectedSlot(null);

      setMessage("Horario actualizado correctamente");

    }catch(err){

      console.error(err);
      setMessage("Error cambiando horario");

    }

    setUpdateLoading(false);

  }


  async function cancelReservation(){

    if(!confirm("¿Seguro que quieres cancelar la reserva?")) return;

    setCancelLoading(true);
    setMessage("");

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

      setMessage("Reserva cancelada correctamente");

    }catch(err){

      console.error(err);
      setMessage("Error cancelando reserva");

    }

    setCancelLoading(false);

  }


  function formatDate(date){
    if(!date) return "";

    return new Date(date).toLocaleDateString("es-ES",{
      weekday:"long",
      day:"numeric",
      month:"long"
    });
  }

  function formatTime(time){
    return time?.slice(0,5);
  }


  return (

<section className="py-20 bg-tiger-cream min-h-screen">

<div className="container mx-auto px-4 max-w-2xl">


{/* HEADER */}

<div className="text-center mb-12">

<h1 className="text-4xl md:text-5xl font-heading font-bold text-tiger-green mb-3">
Consultar reserva
</h1>

<p className="text-gray-600">
Introduce tu código de reserva y tu email para ver los detalles.
</p>

</div>


{/* FORM */}

<form
onSubmit={handleSearch}
className="bg-white p-8 rounded-2xl shadow-lg space-y-6 border">

<div>

<label className="text-sm font-semibold text-gray-700">
Código de reserva
</label>

<input
value={code}
onChange={(e)=>setCode(e.target.value)}
className="w-full border rounded-lg p-3 mt-2 focus:ring-2 focus:ring-tiger-orange"
placeholder="Ej: Hs72Ks91dLQ"
required
/>

</div>


<div>

<label className="text-sm font-semibold text-gray-700">
Email
</label>

<input
type="email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
className="w-full border rounded-lg p-3 mt-2 focus:ring-2 focus:ring-tiger-orange"
placeholder="tu@email.com"
required
/>

</div>


<button
type="submit"
className="w-full bg-tiger-orange text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
>

{loading ? "Buscando reserva..." : "Consultar reserva"}

</button>


{error && (

<div className="text-red-500 text-sm text-center font-medium">
{error}
</div>

)}

</form>


{/* RESULTADO */}

{reservation && (

<div className="mt-12 bg-white rounded-2xl shadow-xl p-8 border">


<div className="flex justify-between items-center mb-6">

<h2 className="text-2xl font-bold text-tiger-green">
🎮 Tu reserva
</h2>

{reservation.status === "cancelled" ? (

<span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
Cancelada
</span>

) : (

<span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
Confirmada
</span>

)}

</div>


<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">


<div className="space-y-3">

<div>
<span className="font-semibold">👤 Nombre</span>
<p className="text-gray-700">{reservation.name}</p>
</div>

<div>
<span className="font-semibold">🎮 Plan</span>
<p className="text-gray-700">
{reservation.plans?.name}
</p>
</div>

<div>
<span className="font-semibold">👥 Jugadores</span>
<p className="text-gray-700">
{reservation.people}
</p>
</div>

</div>


<div className="space-y-3">

<div>
<span className="font-semibold">📅 Fecha</span>
<p className="text-gray-700">
{formatDate(reservation.time_slots?.date)}
</p>
</div>

<div>
<span className="font-semibold">⏰ Hora</span>
<p className="text-gray-700">
{formatTime(reservation.time_slots?.start_time)}
</p>
</div>

</div>

</div>


<div className="mt-8 bg-tiger-cream rounded-lg p-4 text-sm text-gray-700">
⚡ Llega 15 minutos antes de tu partida para preparar el equipo.
</div>


{reservation.status !== "cancelled" && (

<div className="mt-10 border-t pt-6 space-y-8">


{/* CAMBIAR JUGADORES */}

<div>

<h3 className="font-semibold mb-2">
Añadir jugadores
</h3>

<div className="flex gap-3">

<input
type="number"
min={reservation.people}
value={newPeople}
onChange={(e)=>setNewPeople(e.target.value)}
className="border rounded-lg p-2 w-full"
/>

<button
onClick={updatePlayers}
className="bg-tiger-green text-white px-4 py-2 rounded-lg"
>

{updateLoading ? "Actualizando..." : "Actualizar"}

</button>

</div>

</div>


{/* CAMBIAR FECHA */}

<div>

<h3 className="font-semibold mb-4">
Cambiar día
</h3>

<CalendarPicker
onSelectDate={(date)=>{

setSelectedDate(date);
setSelectedSlot(null);

}}
/>

</div>


{/* SLOT PICKER */}

{selectedDate && (

<SlotPicker
date={selectedDate}
people={reservation.people}
onSelectSlot={(slot)=>{

setSelectedSlot(slot);

}}
/>

)}


{selectedSlot && (

<button
onClick={updateSlot}
className="bg-tiger-green text-white px-6 py-2 rounded-lg"
>

{updateLoading ? "Actualizando..." : "Confirmar nuevo horario"}

</button>

)}


{/* CANCELAR */}

<button
onClick={cancelReservation}
className="bg-red-500 text-white px-6 py-2 rounded-lg hover:opacity-90"
>

{cancelLoading ? "Cancelando..." : "Cancelar reserva"}

</button>


</div>

)}


</div>

)}


{message && (

<div className="mt-6 text-center text-sm font-medium text-tiger-green">
{message}
</div>

)}


</div>

</section>

  );

}