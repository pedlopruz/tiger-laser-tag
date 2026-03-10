import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req,res){

  const {date} = req.query;

  const {data:slots,error} = await supabaseAdmin
    .from("time_slots")
    .select("*")
    .eq("date",date)
    .order("start_time");

  if(error){
    return res.status(500).json({error:error.message});
  }

  const result = [];

  for(const slot of slots){

    const {data:holds} = await supabaseAdmin
      .from("reservation_holds")
      .select("people")
      .eq("slot_id",slot.id)
      .gt("expires_at", new Date().toISOString());

    const holdPeople = holds?.reduce((s,h)=>s+h.people,0) || 0;

    const remaining =
      slot.capacity - slot.reserved_spots - holdPeople;

    result.push({
      id:slot.id,
      start_time:slot.start_time,
      end_time:slot.end_time,
      capacity:slot.capacity,
      reserved:slot.reserved_spots,
      holds:holdPeople,
      remaining:remaining,
      isFull:remaining <= 0,
      plan_id:slot.plan_id
    });
  }

  res.status(200).json({
    slots:result
  });
}