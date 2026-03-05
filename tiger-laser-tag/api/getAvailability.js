import { supabaseAdmin } from "./supabaseAdmin";

export default async function handler(req, res) {
  const { date, people } = req.query;

  const { data, error } = await supabaseAdmin
    .from("time_slots")
    .select("*")
    .eq("date", date)
    .eq("status", "active");

  if (error) return res.status(400).json({ error });

  const available = data.filter(
    (slot) => slot.reserved_spots + Number(people) <= slot.max_capacity
  );

  res.status(200).json(available);
}