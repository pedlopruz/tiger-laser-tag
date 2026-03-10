import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ReservationForm({
  slot,
  plan,
  people,
  holdId,
  onSuccess
}) {

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [phone,setPhone] = useState("");

  const [loading,setLoading] = useState(false);
  const [error,setError] = useState(null);

  async function handleSubmit(e){

    e.preventDefault();

    setError(null);

    if(!name || !email){
      setError("Nombre y email son obligatorios");
      return;
    }

    setLoading(true);

    try{

      const res = await fetch("/api/createReservation",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          slot_id:slot.id,
          plan_id:plan.id,
          name,
          email,
          phone,
          people,
          hold_id:holdId
        })
      });

      const data = await res.json();

      if(!res.ok){
        throw new Error(data.error || "Error creando reserva");
      }

      if(onSuccess){
        onSuccess(data);
      }

    }catch(err){

      console.error(err);
      setError(err.message);

    }

    setLoading(false);

  }

  return (

    <div className="bg-white rounded-xl shadow p-6 mt-6" id="reservation-form">

      <h2 className="text-xl font-bold mb-6">
        Datos de la reserva
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="text-sm font-medium">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Teléfono</label>
          <input
            type="tel"
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading
            ? "Procesando reserva..."
            : "Confirmar reserva"}
        </Button>

      </form>

    </div>
  );
}