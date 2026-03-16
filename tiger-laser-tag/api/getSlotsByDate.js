import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      error: "Missing date"
    });
  }

  try {

    // 1️⃣ Obtener slots del día
    const { data: slots, error: slotsError } = await supabaseAdmin
      .from("time_slots")
      .select("*")
      .eq("date", date)
      .order("start_time");

    if (slotsError) {
      return res.status(500).json({ error: slotsError.message });
    }

    if (!slots || slots.length === 0) {
      return res.status(200).json({ slots: [] });
    }

    const slotIds = slots.map(s => s.id);

    // 2️⃣ Obtener holds activos
    const { data: holds } = await supabaseAdmin
      .from("reservation_holds")
      .select("slot_id, people")
      .in("slot_id", slotIds)
      .gt("expires_at", new Date().toISOString());

    // 3️⃣ Obtener reservas confirmadas
    const { data: reservations } = await supabaseAdmin
      .from("reservations")
      .select("slot_id, people")
      .in("slot_id", slotIds)
      .eq("status", "confirmed");

    // 4️⃣ Agrupar holds por slot
    const holdsMap = {};

    holds?.forEach(h => {
      holdsMap[h.slot_id] =
        (holdsMap[h.slot_id] || 0) + (h.people || 0);
    });

    // 5️⃣ Agrupar reservas por slot
    const reservedMap = {};

    reservations?.forEach(r => {
      reservedMap[r.slot_id] =
        (reservedMap[r.slot_id] || 0) + (r.people || 0);
    });

    // 6️⃣ Construir resultado final
    const result = slots.map(slot => {

  const capacity = slot.max_capacity ?? 0;

  const reserved =
    reservedMap[slot.id] ?? slot.reserved_spots ?? 0;

  const holds =
    holdsMap[slot.id] ?? 0;

  const remaining =
    capacity - reserved - holds;

  return {
    id: slot.id,
    start_time: slot.start_time,
    end_time: slot.end_time,
    capacity,
    reserved,
    holds,
    remaining,
    isFull: remaining <= 0,
    plan_id: slot.plan_id
  };

});

    res.status(200).json({
      slots: result
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error loading slots"
    });

  }

}