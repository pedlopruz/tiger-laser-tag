import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: "Year and month required" });
    }

    // 1️⃣ Obtener configuración actual
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("business_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError) throw settingsError;

    const {
      slot_duration,
      max_capacity,
      weekday_start,
      weekday_end,
      weekend_start,
      weekend_end
    } = settings;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    let createdSlots = [];

    // 2️⃣ Recorrer días del mes
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const day = d.getDay(); // 0 domingo - 6 sábado

      // 3️⃣ Comprobar si está bloqueado
      const { data: block } = await supabaseAdmin
        .from("slot_blocks")
        .select("*")
        .eq("date", dateStr)
        .single();

      if (block) continue;

      // 4️⃣ Determinar horario según día
      const isWeekend = day === 0 || day === 6;

      const start = isWeekend ? weekend_start : weekday_start;
      const end = isWeekend ? weekend_end : weekday_end;

      let currentTime = new Date(`${dateStr}T${start}`);
      const endTime = new Date(`${dateStr}T${end}`);

      while (currentTime < endTime) {
        const slotStart = currentTime.toTimeString().slice(0, 5);

        const slotEndDate = new Date(currentTime);
        slotEndDate.setMinutes(slotEndDate.getMinutes() + slot_duration);
        const slotEnd = slotEndDate.toTimeString().slice(0, 5);

        // 5️⃣ Evitar duplicados
        const { data: existing } = await supabaseAdmin
          .from("time_slots")
          .select("id")
          .eq("date", dateStr)
          .eq("start_time", slotStart)
          .maybeSingle();

        if (!existing) {
          const { data: newSlot, error } = await supabaseAdmin
            .from("time_slots")
            .insert([
              {
                date: dateStr,
                start_time: slotStart,
                end_time: slotEnd,
                max_capacity,
                reserved_spots: 0,
                status: "active"
              }
            ])
            .select()
            .single();

          if (!error) createdSlots.push(newSlot);
        }

        currentTime.setMinutes(currentTime.getMinutes() + slot_duration);
      }
    }

    res.status(200).json({
      message: "Slots generated successfully",
      created: createdSlots.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}