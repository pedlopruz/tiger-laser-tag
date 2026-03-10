import { supabaseAdmin } from "./supabaseAdmin.js";
import { nanoid } from "nanoid";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { slot_id, plan_id, name, email, phone, people } = req.body;

  if (!slot_id || !plan_id || !name || !email || !people) {
    return res.status(400).json({
      error: "Missing required fields"
    });
  }
  await supabaseAdmin
  .from("reservation_holds")
  .delete()
  .eq("slot_id", slot_id);

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
       1️⃣ Obtener slot
    -------------------------- */

    const { data: slot, error: slotError } = await supabaseAdmin
      .from("time_slots")
      .select("*")
      .eq("id", slot_id)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({
        error: "Slot not found"
      });
    }

    /* --------------------------
       2️⃣ Obtener plan
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
       3️⃣ Validar plan bloqueado
    -------------------------- */

    if (slot.plan_id && slot.plan_id !== plan_id) {
      return res.status(409).json({
        error: "Este horario ya tiene otro plan reservado"
      });
    }

    /* --------------------------
       4️⃣ Validar capacidad plan
    -------------------------- */

    if (players > plan.max_players) {
      return res.status(409).json({
        error: `Este plan admite máximo ${plan.max_players} jugadores`
      });
    }

    /* --------------------------
       5️⃣ Crear código reserva
    -------------------------- */

    const reservation_code = nanoid(12);

    /* --------------------------
       6️⃣ RPC segura (anti race)
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