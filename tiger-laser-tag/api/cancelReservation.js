import { supabaseAdmin } from "./supabaseAdmin";

export default async function handler(req, res) {
  const { code } = req.body;

  const { data: reservation } = await supabaseAdmin
    .from("reservations")
    .select("*")
    .eq("unique_code", code)
    .single();

  if (!reservation) {
    return res.status(404).json({ error: "Reserva no encontrada" });
  }

  await supabaseAdmin
    .from("time_slots")
    .update({
      reserved_spots: reservation.people * -1
    })
    .eq("id", reservation.slot_id);

  await supabaseAdmin
    .from("reservations")
    .delete()
    .eq("id", reservation.id);

  res.status(200).json({ message: "Reserva cancelada" });
}