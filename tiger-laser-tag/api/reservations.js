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
        id,
        people,
        plan_id,
        status,
        plans(price, max_players),
        time_slots(date, start_time)
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

    let extraPayment = 0;

    /* --------------------------
       3️⃣ Cambiar jugadores (solo)
    -------------------------- */

    if (people && !newSlotId) {

      const newPeople = Number(people);

      if (newPeople <= reservation.people) {
        return res.status(400).json({
          error: "Solo puedes añadir jugadores"
        });
      }

      if (newPeople > reservation.plans.max_players) {
        return res.status(409).json({
          error: `Máximo ${reservation.plans.max_players} jugadores`
        });
      }

      const addedPlayers = newPeople - reservation.people;
      extraPayment = addedPlayers * reservation.plans.price;

      const { error: updateError } = await supabaseAdmin
        .from("reservations")
        .update({ people: newPeople })
        .eq("id", reservation.id);

      if (updateError) {
        return res.status(500).json({
          error: updateError.message
        });
      }

    }

    /* --------------------------
       4️⃣ Cambiar slot (usar SQL seguro)
    -------------------------- */

    if (newSlotId && !people) {

      const { error: rpcError } = await supabaseAdmin.rpc(
        "change_reservation_safe",
        {
          p_reservation_id: reservation.id,
          p_new_slot_id: newSlotId
        }
      );

      if (rpcError) {
        return res.status(400).json({
          error: rpcError.message
        });
      }

    }

    /* --------------------------
       ❌ No permitir ambos
    -------------------------- */

    if (people && newSlotId) {
      return res.status(400).json({
        error: "No puedes cambiar jugadores y horario al mismo tiempo"
      });
    }

    /* --------------------------
       5️⃣ Obtener reserva actualizada
    -------------------------- */

    const { data: updatedReservation } = await supabaseAdmin
      .from("reservations")
      .select(`
        *,
        plans(price),
        time_slots(date, start_time)
      `)
      .eq("id", reservation.id)
      .single();

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

  const {
    slot_ids,
    plan_id,
    name,
    email,
    phone,
    people,
    menor_edad
  } = req.body;

  if (
    !slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0 ||
    !plan_id || !name || !email || !people
  ) {
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

    const reservation_code = nanoid(12);

    const { data, error } = await supabaseAdmin.rpc(
      "create_reservation_blocking",
      {
        p_slot_ids: slot_ids,
        p_plan_id: plan_id,
        p_name: name,
        p_email: email,
        p_phone: phone,
        p_people: players,
        p_reservation_code: reservation_code,
        p_menor_edad: menor_edad ?? false
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
      reservation_id: data.reservation_id,
      code: reservation_code
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Error creating reservation"
    });

  }

}