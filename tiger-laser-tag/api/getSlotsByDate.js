import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Missing date" });
  }

  try {

    const now = new Date();

    const { data: slots, error } = await supabaseAdmin
      .from("time_slots")
      .select("id, start_time, end_time, status, max_capacity")
      .eq("date", date)
      .order("start_time");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!slots || slots.length === 0) {
      return res.status(200).json({ slots: [] });
    }

    const result = slots.map(slot => {

      const capacity = slot.max_capacity ?? 0;

      const slotDateTime = new Date(`${date}T${slot.start_time}`);
      const isPast = slotDateTime <= now;

      const isAvailable =
        slot.status === "active" && !isPast;

      return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,

        capacity,
        remaining: isAvailable ? capacity : 0,

        status: slot.status,
        isAvailable,
        isFull: !isAvailable
      };

    });

    return res.status(200).json({ slots: result });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      error: "Error loading slots"
    });

  }

}