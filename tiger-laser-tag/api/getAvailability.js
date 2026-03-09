import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { month } = req.query;

  if (!month) {
    return res.status(400).json({
      error: "Month required"
    });
  }

  try {

    const start = `${month}-01`;

    const endDate = new Date(month + "-01");
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    const end = endDate.toLocaleDateString("sv-SE");

    const { data, error } = await supabaseAdmin
      .from("time_slots")
      .select("date,max_capacity,reserved_spots")
      .eq("status", "active")
      .gte("date", start)
      .lte("date", end);

    if (error) throw error;

    const availableDates = data
      .filter(slot => slot.reserved_spots < slot.max_capacity)
      .map(slot => slot.date);

    const uniqueDays = [...new Set(availableDates)];

    return res.status(200).json({
      availableDays: uniqueDays
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error fetching availability"
    });

  }

}