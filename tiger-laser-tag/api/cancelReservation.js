import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      error: "Reservation code required"
    });
  }

  try {

    const { data: reservation, error } = await supabaseAdmin
      .from("reservations")
      .select("*")
      .eq("unique_code", code)
      .single();

    if (error || !reservation) {
      return res.status(404).json({
        error: "Reserva no encontrada"
      });
    }

    const { data: slot } = await supabaseAdmin
      .from("time_slots")
      .select("date,start_time,reserved_spots")
      .eq("id", reservation.slot_id)
      .single();

    // comprobar regla 48 horas
    const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
    const now = new Date();

    const diffHours = (slotDateTime - now) / (1000 * 60 * 60);

    if (diffHours < 48) {
      return res.status(403).json({
        error: "Las reservas solo pueden cancelarse con 48h de antelación"
      });
    }

    // devolver plazas
    await supabaseAdmin
      .from("time_slots")
      .update({
        reserved_spots: slot.reserved_spots - reservation.people
      })
      .eq("id", reservation.slot_id);

    // eliminar reserva
    await supabaseAdmin
      .from("reservations")
      .delete()
      .eq("id", reservation.id);

    return res.status(200).json({
      success: true,
      message: "Reserva cancelada"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error cancelling reservation"
    });

  }

}