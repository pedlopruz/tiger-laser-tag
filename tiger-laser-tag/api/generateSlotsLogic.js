import { supabaseAdmin } from "./supabaseAdmin.js";

export async function generateSlotsForRange(startDate, endDate) {

  /* --------------------------
     1️⃣ Settings
  -------------------------- */

  const { data: settings, error } = await supabaseAdmin
    .from("business_settings")
    .select("*")
    .single();

  if (error || !settings) {
    throw new Error("Missing business_settings");
  }

  const {
    slot_duration,
    max_capacity,
    weekday_start,
    weekday_end,
    weekend_start,
    weekend_end
  } = settings;

  /* --------------------------
     2️⃣ Traer bloqueos (1 query)
  -------------------------- */

  const { data: blocks } = await supabaseAdmin
    .from("slot_blocks")
    .select("date")
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0]);

  const blockedDates = new Set(blocks?.map(b => b.date) || []);

  /* --------------------------
     3️⃣ Traer slots existentes (1 query)
  -------------------------- */

  const { data: existingSlots } = await supabaseAdmin
    .from("time_slots")
    .select("date, start_time")
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0]);

  const existingSet = new Set(
    (existingSlots || []).map(s => `${s.date}-${s.start_time}`)
  );

  /* --------------------------
     4️⃣ Generar slots en memoria
  -------------------------- */

  const inserts = [];

  for (
    let d = new Date(startDate);
    d <= endDate;
    d.setDate(d.getDate() + 1)
  ) {

    const dateStr = d.toLocaleDateString("sv-SE");
    const day = d.getDay();
    const month = d.getMonth() + 1;

    /* --------------------------
       Skip bloqueados
    -------------------------- */

    if (blockedDates.has(dateStr)) continue;

    /* --------------------------
       Horarios
    -------------------------- */

    const isWeekend = day === 0 || day === 6;
    const isSummer = month === 7 || month === 8;

    const start =
      isWeekend || isSummer ? weekend_start : weekday_start;

    const end =
      isWeekend || isSummer ? weekend_end : weekday_end;

    let currentTime = new Date(`${dateStr}T${start}`);
    const endTime = new Date(`${dateStr}T${end}`);

    while (currentTime < endTime) {

      const slotStart = currentTime.toTimeString().slice(0, 5);

      const key = `${dateStr}-${slotStart}`;

      // 🔥 evitar duplicados SIN query
      if (!existingSet.has(key)) {

        const slotEndDate = new Date(currentTime);
        slotEndDate.setMinutes(
          slotEndDate.getMinutes() + slot_duration
        );

        const slotEnd = slotEndDate.toTimeString().slice(0, 5);

        inserts.push({
          date: dateStr,
          start_time: slotStart,
          end_time: slotEnd,
          max_capacity,
          reserved_spots: 0,
          status: "active"
        });

      }

      currentTime.setMinutes(
        currentTime.getMinutes() + slot_duration
      );

    }

  }

  /* --------------------------
     5️⃣ Insert batch (clave)
  -------------------------- */

  if (inserts.length > 0) {

    const chunkSize = 500;

    for (let i = 0; i < inserts.length; i += chunkSize) {

      const chunk = inserts.slice(i, i + chunkSize);

      const { error } = await supabaseAdmin
        .from("time_slots")
        .insert(chunk);

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

    }

  }

  return {
    inserted: inserts.length
  };

}