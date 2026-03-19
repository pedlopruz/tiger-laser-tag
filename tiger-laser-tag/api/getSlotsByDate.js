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
      error: "Missing date"
    });
  }

  try {

    /* --------------------------
       1️⃣ Hora actual (robusta)
    -------------------------- */

    const now = new Date();

    // YYYY-MM-DD en UTC (consistente)
    const todayStr = now.toISOString().split("T")[0];

    // HH:mm actual
    const currentTime = now.toTimeString().slice(0, 5);

    /* --------------------------
       2️⃣ Obtener slots
    -------------------------- */

    const { data: slots, error } = await supabaseAdmin
      .from("time_slots")
      .select("id, start_time, end_time, status, max_capacity")
      .eq("date", date)
      .order("start_time");

    if (error) {
      return res.status(500).json({
        error: error.message
      });
    }

    if (!slots || slots.length === 0) {
      return res.status(200).json({
        slots: []
      });
    }

    /* --------------------------
       3️⃣ Construcción resultado
    -------------------------- */

    const result = slots.map(slot => {

      const capacity = slot.max_capacity ?? 0;

      // 🔥 Detectar si el slot ya pasó
      const isPast =
        date < todayStr ||
        (date === todayStr && slot.start_time <= currentTime);

      // Disponible solo si activo y no pasado
      const isAvailable =
        slot.status === "active" && !isPast;

      return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,

        capacity,

        // 👇 preparado para tu SlotPicker
        remaining: isAvailable ? capacity : 0,
        reserved: isAvailable ? 0 : capacity,

        status: slot.status,
        isAvailable,
        isFull: !isAvailable
      };

    });

    /* --------------------------
       4️⃣ Respuesta
    -------------------------- */

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