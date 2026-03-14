import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { code, email } = req.body;

  if (!code || !email) {
    return res.status(400).json({
      error: "Missing required fields"
    });
  }

  try {

    /* --------------------------
       1️⃣ Buscar reserva
    -------------------------- */

    const { data: reservation, error } = await supabaseAdmin
      .from("reservations")
      .select(`
        *,
        time_slots(date)
      `)
      .eq("unique_code", code)
      .eq("email", email)
      .single();

    if (error || !reservation) {
      return res.status(404).json({
        error: "Reserva no encontrada"
      });
    }

    /* --------------------------
       2️⃣ Validar que no esté cancelada
    -------------------------- */

    if (reservation.status === "cancelled") {
      return res.status(400).json({
        error: "La reserva ya está cancelada"
      });
    }

    /* --------------------------
       3️⃣ Regla 48h
    -------------------------- */

    const now = new Date();
    const reservationDate = new Date(reservation.time_slots.date);

    if (reservationDate - now < 48 * 60 * 60 * 1000) {
      return res.status(403).json({
        error: "Las reservas solo se pueden cancelar con 48h de antelación"
      });
    }

    /* --------------------------
       4️⃣ Cancelar reserva
    -------------------------- */

    const { data: updatedReservation, error: updateError } =
      await supabaseAdmin
        .from("reservations")
        .update({
          status: "cancelled"
        })
        .eq("id", reservation.id)
        .select()
        .single();

    if (updateError) {
      return res.status(500).json({
        error: updateError.message
      });
    }

    /* --------------------------
       5️⃣ Respuesta
    -------------------------- */

    return res.status(200).json({
      success: true,
      message: "Reserva cancelada correctamente",
      reservation: updatedReservation
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error cancelando la reserva"
    });

  }

}