import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {
  try {
    const { date, people } = req.query;

    if (!date || !people) {
      return res.status(400).json({ error: "Date and people required" });
    }

    const requestedDate = new Date(date);
    const year = requestedDate.getFullYear();
    const month = requestedDate.getMonth() + 1;

    // 1️⃣ Comprobar si existen slots para ese mes
    const monthStart = new Date(year, month - 1, 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(year, month, 0)
      .toISOString()
      .split("T")[0];

    const { count } = await supabaseAdmin
      .from("time_slots")
      .select("*", { count: "exact", head: true })
      .gte("date", monthStart)
      .lte("date", monthEnd);

    // 2️⃣ Si no hay slots → generarlos automáticamente
    if (count === 0) {
      await fetch(
        `${process.env.VERCEL_URL}/api/generateSlots?year=${year}&month=${month}`
      );
    }

    // 3️⃣ Obtener slots del día solicitado
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    let query = supabaseAdmin
      .from("time_slots")
      .select("id,date,start_time,end_time,max_capacity,reserved_spots,status")
      .eq("date", date)
      .eq("status", "active")
      .order("start_time", { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    // 4️⃣ Filtrar disponibilidad real
    const available = data
      .filter((slot) => {
        // Si es hoy, no mostrar horas pasadas
        if (date === today && slot.start_time <= nowTime) {
          return false;
        }

        return (
          slot.reserved_spots + Number(people) <= slot.max_capacity
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