import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res){

  if(req.method !== "POST"){
    return res.status(405).json({error:"Method not allowed"});
  }

  const {slot_id, plan_id, people} = req.body;

  const expires = new Date(Date.now() + 5 * 60 * 1000);

  const {data,error} = await supabaseAdmin
    .from("reservation_holds")
    .insert({
      slot_id,
      plan_id,
      people,
      expires_at: expires
    })
    .select()
    .single();

  if(error){
    return res.status(500).json({error:error.message});
  }

  res.status(200).json(data);
}