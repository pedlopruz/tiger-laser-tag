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

  if (isNaN(players) || players < 1) {
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
       2️⃣ Validar jugadores del plan
    -------------------------- */

    if (players > plan.max_players) {
      return res.status(409).json({
        error: `Este plan admite máximo ${plan.max_players} jugadores`
      });
    }

    /* --------------------------
       3️⃣ Obtener slot
    -------------------------- */

    const { data: slot, error: slotError } = await supabaseAdmin
      .from("slots")
      .select("*")
      .eq("id", slot_id)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({
        error: "Slot not found"
      });
    }

    /* --------------------------
       4️⃣ Comprobar reservas actuales
    -------------------------- */

    const { data: reservations } = await supabaseAdmin
      .from("reservations")
      .select("people, plan_id")
      .eq("slot_id", slot_id);

    const reserved = reservations?.reduce((sum, r) => sum + r.people, 0) || 0;

    /* --------------------------
       5️⃣ Comprobar holds activos
    -------------------------- */

    const now = new Date().toISOString();

    const { data: holds } = await supabaseAdmin
      .from("reservation_holds")
      .select("people")
      .eq("slot_id", slot_id)
      .gt("expires_at", now);

    const held = holds?.reduce((sum, h) => sum + h.people, 0) || 0;

    const capacity = slot.capacity;
    const remaining = capacity - reserved - held;

    if (players > remaining) {
      return res.status(409).json({
        error: `Solo quedan ${remaining} plazas disponibles`
      });
    }

    /* --------------------------
       6️⃣ Validar plan único por slot
    -------------------------- */

    if (reservations && reservations.length > 0) {

      const existingPlan = reservations[0].plan_id;

      if (existingPlan !== plan_id) {
        return res.status(409).json({
          error: "Este horario ya tiene un plan seleccionado por otro grupo"
        });
      }

    }

    /* --------------------------
       7️⃣ crear código reserva
    -------------------------- */

    const reservation_code = nanoid(12);

    /* --------------------------
       8️⃣ crear reserva segura (RPC)
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
       9️⃣ eliminar hold
    -------------------------- */

    if (hold_id) {

      await supabaseAdmin
        .from("reservation_holds")
        .delete()
        .eq("id", hold_id);

    }

    /* --------------------------
       🔟 respuesta final
    -------------------------- */

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