import { supabaseAdmin } from "./supabaseAdmin.js";
import { nanoid } from "nanoid";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { slot_id, plan_id, name, email, phone, people, hold_id } = req.body;

  if (!slot_id || !plan_id || !name || !email || !people) {
    return res.status(400).json({
      error: "Missing required fields"
    });
  }

  const players = parseInt(people);

  if (players < 1) {
    return res.status(400).json({
      error: "Invalid number of players"
    });
  }

  const emailRegex = /\S+@\S+\.\S+/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: "Invalid email"
    });
  }

  try {

    /* --------------------------
       1️⃣ Obtener plan
    -------------------------- */

    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({
        error: "Plan not found"
      });
    }

    /* --------------------------
       2️⃣ validar jugadores del plan
    -------------------------- */

    if (players > plan.max_players) {
      return res.status(409).json({
        error: `Este plan admite máximo ${plan.max_players} jugadores`
      });
    }

    /* --------------------------
       3️⃣ crear código reserva
    -------------------------- */

    const reservation_code = nanoid(12);

    /* --------------------------
       4️⃣ crear reserva segura
    -------------------------- */

    const { data, error } = await supabaseAdmin.rpc(
      "create_reservation_safe",
      {
        p_slot_id: slot_id,
        p_plan_id: plan_id,
        p_name: name,
        p_email: email,
        p_phone: phone,
        p_people: players,
        p_reservation_code: reservation_code
      }
    );

    if (error) {

      console.error(error);

      return res.status(409).json({
        error: error.message
      });

    }

    /* --------------------------
       5️⃣ eliminar hold del usuario
    -------------------------- */

    if (hold_id) {

      await supabaseAdmin
        .from("reservation_holds")
        .delete()
        .eq("id", hold_id);

    }

    return res.status(200).json({
      success: true,
      reservation: data,
      code: reservation_code
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error creating reservation"
    });

  }

}