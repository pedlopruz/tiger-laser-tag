import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      error: "Missing date"
    });
  }

  try {

    /* --------------------------
       1️⃣ Obtener slots del día
    -------------------------- */

    const { data: slots, error } = await supabaseAdmin
      .from("time_slots")
      .select("id, start_time, end_time, status")
      .eq("date", date)
      .order("start_time");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!slots || slots.length === 0) {
      return res.status(200).json({ slots: [] });
    }

    /* --------------------------
       2️⃣ Construir respuesta
    -------------------------- */

    const result = slots.map(slot => {

      const isAvailable = slot.status === "active";

      return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: slot.status,
        isAvailable
      };

    });

    return res.status(200).json({
      slots: result
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: "Error loading slots"
    });

  }

}