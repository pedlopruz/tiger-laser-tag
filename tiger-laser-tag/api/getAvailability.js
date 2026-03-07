import { supabase } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: "Month required" });
  }

  try {

    const start = `${month}-01`;
    const end = `${month}-31`;

    const { data, error } = await supabase
      .from("time_slots")
      .select("date, max_capacity, reserved_spots")
      .gte("date", start)
      .lte("date", end);

    if (error) throw error;

    const availableDates = data
      .filter(slot => slot.reserved_spots < slot.max_capacity)
      .map(slot => slot.date);

    const uniqueDays = [...new Set(availableDates)];

    res.status(200).json({
      availableDays: uniqueDays
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

}