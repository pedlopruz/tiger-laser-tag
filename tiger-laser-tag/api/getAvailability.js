import { supabaseAdmin } from "./supabaseAdmin.js";
import { generateSlotsForMonth } from "./utils/generateSlotsLogic.js";

export default async function handler(req, res) {
  try {

    const { date, people } = req.query;

    const peopleCount = parseInt(people);

    if (!date || !peopleCount || peopleCount <= 0) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    const requestedDate = new Date(date);
    const year = requestedDate.getFullYear();
    const month = requestedDate.getMonth() + 1;

    const monthStart = new Date(year, month - 1, 1)
      .toISOString()
      .split("T")[0];

    const monthEnd = new Date(year, month, 0)
      .toISOString()
      .split("T")[0];

    const { count } = await supabaseAdmin
      .from("time_slots")
      .select("id", { count: "exact", head: true })
      .gte("date", monthStart)
      .lte("date", monthEnd);

    if (count === 0) {
      await generateSlotsForMonth(year, month);
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("time_slots")
      .select("id,date,start_time,end_time,max_capacity,reserved_spots,status")
      .eq("date", date)
      .eq("status", "active")
      .order("start_time", { ascending: true });

    if (error) throw error;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const available = data
      .filter((slot) => {

        const slotMinutes =
          parseInt(slot.start_time.split(":")[0]) * 60 +
          parseInt(slot.start_time.split(":")[1]);

        if (date === today && slotMinutes <= nowMinutes) {
          return false;
        }

        return (
          slot.reserved_spots + peopleCount <= slot.max_capacity
        );

      })
      .map((slot) => ({
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        remaining_capacity:
          slot.max_capacity - slot.reserved_spots,
      }));

    res.status(200).json(available);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}