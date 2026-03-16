import { supabaseAdmin } from "./supabaseAdmin.js";
import { nanoid } from "nanoid";

export default async function handler(req,res){

  if(req.method !== "POST"){
    return res.status(405).json({error:"Method not allowed"});
  }

  const { action } = req.body;

  try{

    switch(action){

      case "access":
        return accessReservation(req,res);

      case "create":
        return createReservation(req,res);

      case "cancel":
        return cancelReservation(req,res);

      case "change":
        return changeReservation(req,res);

      default:
        return res.status(400).json({
          error:"Invalid action"
        });

    }

  }catch(err){

    console.error(err);

    return res.status(500).json({
      error:"Internal server error"
    });

  }

}

async function accessReservation(req, res) {

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
async function cancelReservation(req, res) {

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
        time_slots(date,start_time)
      `)
      .eq("reservation_code", code)
      .eq("email", email)
      .single();

    if (error || !reservation) {
      return res.status(404).json({
        error: "Reserva no encontrada"
      });
    }

    /* --------------------------
       2️⃣ Validar estado
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

    const slotDateTime = new Date(
      `${reservation.time_slots.date}T${reservation.time_slots.start_time}`
    );

    const diff = slotDateTime - now;

    if (diff < 48 * 60 * 60 * 1000) {
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
async function changeReservation(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { code, email, newSlotId, people } = req.body;

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
        plans(price, max_players),
        time_slots(id, date, start_time, max_capacity)
      `)
      .eq("reservation_code", code)
      .eq("email", email)
      .single();

    if (error || !reservation) {
      return res.status(404).json({
        error: "Reserva no encontrada"
      });
    }

    if (reservation.status === "cancelled") {
      return res.status(400).json({
        error: "No puedes modificar una reserva cancelada"
      });
    }

    /* --------------------------
       2️⃣ Validar regla 48h
    -------------------------- */

    const now = new Date();

    const slotDateTime = new Date(
      `${reservation.time_slots.date}T${reservation.time_slots.start_time}`
    );

    const diff = slotDateTime - now;

    if (diff < 48 * 60 * 60 * 1000) {
      return res.status(403).json({
        error: "Las reservas solo se pueden modificar con 48h de antelación"
      });
    }

    /* --------------------------
       3️⃣ Cambiar jugadores
    -------------------------- */

    let extraPayment = 0;

    if (people) {

      const newPeople = Number(people);

      if (newPeople <= reservation.people) {
        return res.status(400).json({
          error: "Solo puedes añadir jugadores, no reducirlos"
        });
      }

      if (newPeople > reservation.plans.max_players) {
        return res.status(409).json({
          error: `Este plan admite máximo ${reservation.plans.max_players} jugadores`
        });
      }

      const addedPlayers = newPeople - reservation.people;

      const { data: reservations } = await supabaseAdmin
        .from("reservations")
        .select("people")
        .eq("slot_id", reservation.slot_id)
        .eq("status", "confirmed");

      const reserved = (reservations || []).reduce(
        (sum, r) => sum + (r.people || 0),
        0
      );

      const newTotal = reserved - reservation.people + newPeople;

      if (newTotal > reservation.time_slots.max_capacity) {
        return res.status(409).json({
          error: "No hay plazas suficientes en este horario"
        });
      }

      extraPayment = addedPlayers * reservation.plans.price;

    }

    /* --------------------------
       4️⃣ Cambiar slot
    -------------------------- */

    if (newSlotId) {

      if (people) {
        return res.status(400).json({
          error: "No puedes cambiar jugadores y horario al mismo tiempo"
        });
      }

      const { data: newSlot, error: slotError } = await supabaseAdmin
        .from("time_slots")
        .select("*")
        .eq("id", newSlotId)
        .single();

      if (slotError || !newSlot) {
        return res.status(404).json({
          error: "Nuevo horario no encontrado"
        });
      }

      const newSlotDateTime = new Date(
        `${newSlot.date}T${newSlot.start_time}`
      );

      if (newSlotDateTime <= now) {
        return res.status(400).json({
          error: "Debes elegir un horario futuro"
        });
      }

      const { data: reservations } = await supabaseAdmin
        .from("reservations")
        .select("people")
        .eq("slot_id", newSlotId)
        .eq("status", "confirmed");

      const reserved = (reservations || []).reduce(
        (sum, r) => sum + (r.people || 0),
        0
      );

      if (reserved + reservation.people > newSlot.max_capacity) {
        return res.status(409).json({
          error: "No hay plazas en el nuevo horario"
        });
      }

    }

    /* --------------------------
       5️⃣ Actualizar reserva
    -------------------------- */

    const updateData = {};

    if (people) updateData.people = Number(people);
    if (newSlotId) updateData.slot_id = newSlotId;

    const { data: updatedReservation, error: updateError } =
      await supabaseAdmin
        .from("reservations")
        .update(updateData)
        .eq("id", reservation.id)
        .select()
        .single();

    if (updateError) {
      return res.status(500).json({
        error: updateError.message
      });
    }

    /* --------------------------
       6️⃣ Respuesta final
    -------------------------- */

    return res.status(200).json({
      success: true,
      reservation: updatedReservation,
      extra_payment: extraPayment
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error cambiando la reserva"
    });

  }

}

async function createReservation(req, res) {

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

