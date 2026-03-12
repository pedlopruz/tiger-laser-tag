// api/reservationAccess.js

import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { code, email } = req.body;

  if (!code || code.length !== 12) {
    return res.status(400).json({
      error: "Invalid reservation code"
    });
  }

  if (!email) {
    return res.status(400).json({
      error: "Email required"
    });
  }

  try {

    const { data: reservation, error } = await supabaseAdmin
      .from("reservations")
      .select(`
        *,
        time_slots(date,start_time,end_time),
        plans(name,price,duration_minutes)
      `)
      .eq("reservation_code", code)
      .eq("email", email)
      .eq("status", "confirmed")
      .single();

    if (error || !reservation) {
      return res.status(404).json({
        error: "Reserva no encontrada"
      });
    }

    return res.json({
      reservation
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error fetching reservation"
    });

  }

}