import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

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
        time_slots(id, date, capacity)
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
       2️⃣ Validar regla 48h
    -------------------------- */

    const now = new Date();
    const reservationDate = new Date(reservation.time_slots.date);

    const diff = reservationDate - now;

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

      if (people <= reservation.people) {
        return res.status(400).json({
          error: "Solo puedes añadir jugadores, no reducirlos"
        });
      }

      const addedPlayers = people - reservation.people;

      if (people > reservation.plans.max_players) {
        return res.status(409).json({
          error: `Este plan admite máximo ${reservation.plans.max_players} jugadores`
        });
      }

      /* contar plazas ocupadas */

      const { data: reservations } = await supabaseAdmin
        .from("reservations")
        .select("people")
        .eq("slot_id", reservation.slot_id);

      const reserved = reservations.reduce((sum, r) => sum + r.people, 0);

      const newTotal = reserved - reservation.people + people;

      if (newTotal > reservation.time_slots.capacity) {
        return res.status(409).json({
          error: "No hay plazas suficientes en este horario"
        });
      }

      /* calcular pago extra */

      extraPayment = addedPlayers * reservation.plans.price;

    }

    /* --------------------------
       4️⃣ Cambiar slot
    -------------------------- */

    if (newSlotId) {

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

      const slotDate = new Date(newSlot.date);

      if (slotDate <= now) {
        return res.status(400).json({
          error: "Debes elegir un horario futuro"
        });
      }

      /* comprobar capacidad nuevo slot */

      const { data: reservations } = await supabaseAdmin
        .from("reservations")
        .select("people")
        .eq("slot_id", newSlotId);

      const reserved = reservations.reduce((sum, r) => sum + r.people, 0);

      if (reserved + reservation.people > newSlot.capacity) {
        return res.status(409).json({
          error: "No hay plazas en el nuevo horario"
        });
      }

    }

    /* --------------------------
       5️⃣ Actualizar reserva
    -------------------------- */

    const updateData = {};

    if (people) updateData.people = people;
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