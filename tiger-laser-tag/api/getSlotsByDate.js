import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      error: "Date required"
    });
  }

  try {

    const { data, error } = await supabaseAdmin
      .from("time_slots")
      .select("*")
      .eq("date", date)
      .eq("status", "active")
      .order("start_time");

    if (error) throw error;

    const slots = data.map(slot => ({
      id: slot.id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      available: slot.max_capacity - slot.reserved_spots,
      capacity: slot.max_capacity,
      reserved: slot.reserved_spots,
      isFull: slot.reserved_spots >= slot.max_capacity
    }));

    return res.status(200).json(slots);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error fetching slots"
    });

  }

}