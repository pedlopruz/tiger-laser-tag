import { supabaseAdmin } from "../supabaseAdmin.js";

export async function generateSlotsForMonth(year, month) {

  const { data: settings } = await supabaseAdmin
    .from("business_settings")
    .select("*")
    .single();

  const {
    slot_duration,
    max_capacity,
    weekday_start,
    weekday_end,
    weekend_start,
    weekend_end
  } = settings;

  if (!slot_duration || slot_duration <= 0) {
    throw new Error("Invalid slot_duration");
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {

    const dateStr = d.toLocaleDateString("sv-SE");
    const day = d.getDay();

    const { data: block } = await supabaseAdmin
      .from("slot_blocks")
      .select("id")
      .eq("date", dateStr)
      .maybeSingle();

    if (block) continue;

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

      currentTime.setMinutes(currentTime.getMinutes() + slot_duration);

    }

  }

}