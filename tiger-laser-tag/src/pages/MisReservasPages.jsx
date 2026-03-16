import { useState, useEffect } from "react";

export default function MisReservas() {

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");

  const [reservation, setReservation] = useState(null);

  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  const [newPeople, setNewPeople] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  /* ---------------------------------
     CONSULTAR RESERVA
  --------------------------------- */

  async function handleSearch(e) {

    e.preventDefault();

    setError("");
    setReservation(null);
    setLoading(true);

    try {

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

    } catch(err){

      console.error(err);
      setError("Error de conexión");

    }

    setLoading(false);

  }

  /* ---------------------------------
     CARGAR SLOTS POR FECHA
  --------------------------------- */

  async function loadSlots(date){

    setSelectedDate(date);

    try{

      const res = await fetch(`/api/slots?action=byDate&date=${date}`);
      const data = await res.json();

      setSlots(data);

    }catch(err){
      console.error(err);
    }

  }

  /* ---------------------------------
     CANCELAR RESERVA
  --------------------------------- */

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

      setReservation({
        ...reservation,
        status:"cancelled"
      });

      setMessage("Reserva cancelada correctamente");

    }catch(err){

      console.error(err);
      setMessage("Error cancelando reserva");

    }

    setCancelLoading(false);

  }

  /* ---------------------------------
     CAMBIAR JUGADORES
  --------------------------------- */

  async function updatePlayers(){

    if(!newPeople) return;

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

      if(data.extra_payment > 0){
        setMessage(`Debes pagar €${data.extra_payment} por jugadores extra`);
      }else{
        setMessage("Reserva actualizada");
      }

    }catch(err){

      console.error(err);
      setMessage("Error actualizando");

    }

    setUpdateLoading(false);

  }

  /* ---------------------------------
     CAMBIAR HORARIO
  --------------------------------- */

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
          newSlotId:selectedSlot
        })
      });

      const data = await res.json();

      if(!res.ok){
        setMessage(data.error);
        setUpdateLoading(false);
        return;
      }

      setReservation(data.reservation);

      setMessage("Horario actualizado correctamente");

    }catch(err){

      console.error(err);
      setMessage("Error cambiando horario");

    }

    setUpdateLoading(false);

  }

  function formatDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("es-ES", {
      weekday:"long",
      day:"numeric",
      month:"long"
    });
  }

  function formatTime(time) {
    return time?.slice(0,5);
  }

  return (

<section className="py-20 bg-tiger-cream min-h-screen">

<div className="container mx-auto px-4 max-w-2xl">

{/* BUSCAR RESERVA */}

<form onSubmit={handleSearch}
className="bg-white p-8 rounded-2xl shadow-lg space-y-6 border">

<input
value={code}
onChange={(e)=>setCode(e.target.value)}
placeholder="Código de reserva"
className="w-full border rounded-lg p-3"
/>

<input
type="email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
placeholder="Email"
className="w-full border rounded-lg p-3"
/>

<button
className="w-full bg-tiger-orange text-white py-3 rounded-lg">

{loading ? "Buscando..." : "Consultar reserva"}

</button>

</form>

{/* RESULTADO */}

{reservation && (

<div className="mt-12 bg-white rounded-2xl shadow-xl p-8">

<h2 className="text-2xl font-bold mb-6">
Tu reserva
</h2>

<p><b>Nombre:</b> {reservation.name}</p>
<p><b>Jugadores:</b> {reservation.people}</p>
<p><b>Fecha:</b> {formatDate(reservation.time_slots?.date)}</p>
<p><b>Hora:</b> {formatTime(reservation.time_slots?.start_time)}</p>

{/* CAMBIAR JUGADORES */}

<div className="mt-8">

<h3 className="font-semibold mb-2">
Añadir jugadores
</h3>

<input
type="number"
min={reservation.people}
value={newPeople}
onChange={(e)=>setNewPeople(e.target.value)}
className="border p-2 rounded mr-2"
/>

<button
onClick={updatePlayers}
className="bg-tiger-green text-white px-4 py-2 rounded">

Actualizar

</button>

</div>

{/* CAMBIAR FECHA */}

<div className="mt-8">

<h3 className="font-semibold mb-2">
Cambiar día
</h3>

<input
type="date"
onChange={(e)=>loadSlots(e.target.value)}
className="border p-2 rounded"
/>

</div>

{/* HORARIOS */}

{slots.length > 0 && (

<div className="mt-6">

<h3 className="font-semibold mb-2">
Elegir horario
</h3>

<div className="grid grid-cols-3 gap-3">

{slots.map(slot=>(
<button
key={slot.id}
onClick={()=>setSelectedSlot(slot.id)}
className={`p-2 rounded border ${
selectedSlot === slot.id
? "bg-tiger-green text-white"
: ""
}`}
>

{slot.start_time.slice(0,5)}

</button>
))}

</div>

<button
onClick={updateSlot}
className="mt-4 bg-tiger-green text-white px-4 py-2 rounded">

Cambiar horario

</button>

</div>

)}

{/* CANCELAR */}

<div className="mt-10">

<button
onClick={cancelReservation}
className="bg-red-500 text-white px-6 py-2 rounded">

{cancelLoading ? "Cancelando..." : "Cancelar reserva"}

</button>

</div>

</div>

)}

{message && (
<p className="mt-6 text-center">{message}</p>
)}

</div>

</section>

  );

}