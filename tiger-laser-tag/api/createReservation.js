import { supabase } from "./supabaseAdmin.js";
import { nanoid } from "nanoid";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slot_id, plan_id, name, email, phone, people } = req.body;

  if (!slot_id || !plan_id || !name || !email || !people) {
    return res.status(400).json({
      error: "Missing required fields"
    });
  }

  try {

    const reservation_code = nanoid(10);

    const { data, error } = await supabase.rpc(
      "create_reservation_safe",
      {
        p_slot_id: slot_id,
        p_plan_id: plan_id,
        p_name: name,
        p_email: email,
        p_phone: phone,
        p_people: people,
        p_reservation_code: reservation_code
      }
    );

    if (error) {
      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      reservation: data
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error creating reservation"
    });

  }

}