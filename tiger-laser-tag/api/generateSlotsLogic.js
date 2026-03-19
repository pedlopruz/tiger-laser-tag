import { supabaseAdmin } from "./supabaseAdmin.js";

export async function generateSlotsForRange(startDate, endDate) {

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

  for (
    let d = new Date(startDate);
    d <= endDate;
    d.setDate(d.getDate() + 1)
  ) {

    const dateStr = d.toLocaleDateString("sv-SE");
    const day = d.getDay();
    const month = d.getMonth() + 1;

    /* --------------------------
       BLOQUEOS
    -------------------------- */

    const { data: block } = await supabaseAdmin
      .from("slot_blocks")
      .select("id")
      .eq("date", dateStr)
      .maybeSingle();

    if (block) continue;

    /* --------------------------
       LÓGICA HORARIOS
    -------------------------- */

    const isWeekend = day === 0 || day === 6;

    // 🔥 JULIO Y AGOSTO → SIEMPRE horario fin de semana
    const isSummer = month === 7 || month === 8;

    const start =
      isWeekend || isSummer ? weekend_start : weekday_start;

    const end =
      isWeekend || isSummer ? weekend_end : weekday_end;

    let currentTime = new Date(`${dateStr}T${start}`);
    const endTime = new Date(`${dateStr}T${end}`);

    while (currentTime < endTime) {

      const slotStart = currentTime.toTimeString().slice(0, 5);

      const slotEndDate = new Date(currentTime);
      slotEndDate.setMinutes(
        slotEndDate.getMinutes() + slot_duration
      );

      const slotEnd = slotEndDate.toTimeString().slice(0, 5);

      const { data: existing } = await supabaseAdmin
        .from("time_slots")
        .select("id")
        .eq("date", dateStr)
        .eq("start_time", slotStart)
        .maybeSingle();

      if (!existing) {

        await supabaseAdmin
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
          ]);

      }

      currentTime.setMinutes(
        currentTime.getMinutes() + slot_duration
      );

    }

  }

}