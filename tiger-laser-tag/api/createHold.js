import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res){

  if(req.method !== "POST"){
    return res.status(405).json({error:"Method not allowed"});
  }

  const {slot_id, plan_id, people} = req.body;

  if(!slot_id || !plan_id || !people){
    return res.status(400).json({error:"Missing required fields"});
  }

  const players = parseInt(people);

  if(players < 1){
    return res.status(400).json({error:"Invalid number of players"});
  }

  try{

    /* --------------------------
       1️⃣ Obtener slot
    -------------------------- */

    const {data:slot,error:slotError} = await supabaseAdmin
      .from("time_slots")
      .select("*")
      .eq("id",slot_id)
      .single();

    if(slotError || !slot){
      return res.status(404).json({error:"Slot not found"});
    }

    /* --------------------------
       2️⃣ Obtener plan
    -------------------------- */

    const {data:plan,error:planError} = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id",plan_id)
      .single();

    if(planError || !plan){
      return res.status(404).json({error:"Plan not found"});
    }

    /* --------------------------
       3️⃣ Validar plan del slot
    -------------------------- */

    if(slot.plan_id && slot.plan_id !== plan_id){
      return res.status(409).json({
        error:"Este horario ya tiene otro plan reservado"
      });
    }

    /* --------------------------
       4️⃣ Limpiar holds expirados
    -------------------------- */

    await supabaseAdmin
      .from("reservation_holds")
      .delete()
      .lt("expires_at", new Date().toISOString());

    /* --------------------------
       5️⃣ Contar reservas actuales
    -------------------------- */

    const {data:reservations} = await supabaseAdmin
      .from("reservations")
      .select("people")
      .eq("slot_id",slot_id);

    const reserved = reservations?.reduce(
      (sum,r)=>sum + r.people,
      0
    ) || 0;

    /* --------------------------
       6️⃣ Contar holds activos
    -------------------------- */

    const {data:holds} = await supabaseAdmin
      .from("reservation_holds")
      .select("people")
      .eq("slot_id",slot_id)
      .gt("expires_at", new Date().toISOString());

    const held = holds?.reduce(
      (sum,h)=>sum + h.people,
      0
    ) || 0;

    const remaining = plan.max_players - reserved - held;

    if(players > remaining){
      return res.status(409).json({
        error:`Solo quedan ${remaining} plazas`
      });
    }

    /* --------------------------
       7️⃣ Crear hold
    -------------------------- */

    const expires = new Date(Date.now() + 5 * 60 * 1000);

    const {data,error} = await supabaseAdmin
      .from("reservation_holds")
      .insert({
        slot_id,
        plan_id,
        people: players,
        expires_at: expires
      })
      .select()
      .single();

    if(error){
      return res.status(500).json({error:error.message});
    }

    res.status(200).json(data);

  }catch(err){

    console.error(err);

    res.status(500).json({
      error:"Error creating reservation hold"
    });

  }

}