import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slotId, name, email, phone, people } = req.body;

  // 1️⃣ Obtener turno actual
  const { data: slot } = await supabase
    .from("time_slots")
    .select("*")
    .eq("id", slotId)
    .single();

  if (!slot) return res.status(404).json({ error: "Slot not found" });

  if (slot.reserved_spots + people > slot.max_capacity) {
    return res.status(400).json({ error: "No capacity available" });
  }

  // 2️⃣ Crear reserva
  const { data: reservation, error } = await supabase
    .from("reservations")
    .insert([
      { slot_id: slotId, name, email, phone, people }
    ])
    .select()
    .single();

  if (error) return res.status(400).json({ error });

  // 3️⃣ Actualizar cupo
  await supabase
    .from("time_slots")
    .update({ reserved_spots: slot.reserved_spots + people })
    .eq("id", slotId);

  res.status(200).json(reservation);
}