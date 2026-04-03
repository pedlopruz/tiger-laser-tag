// /api/reservations.js
import { supabaseAdmin } from "./supabaseAdmin.js";
import { nanoid } from "nanoid";

export default async function handler(req, res) {
  console.log("=== API RESERVATIONS CALLED ===");
  console.log("Method:", req.method);
  console.log("Body:", req.body);

  // Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, code, email, people, newSlotId, ...rest } = req.body;

  try {
    // Acceder a reserva existente
    if (action === "access") {
      return accessReservation(req, res, { code, email });
    }

    // Modificar reserva (cambiar jugadores o horario)
    if (action === "change") {
      return changeReservation(req, res, { code, email, people, newSlotId });
    }

    // Cancelar reserva
    if (action === "cancel") {
      return cancelReservation(req, res, { code, email });
    }

    // Crear nueva reserva (acción por defecto)
    return createReservation(req, res, rest);

  } catch (error) {
    console.error("Error in reservations handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ============================================
// ACCEDER A RESERVA
// ============================================
async function accessReservation(req, res, { code, email }) {
  console.log("=== ACCESS RESERVATION FUNCTION ===");
  console.log("Código recibido:", code);
  console.log("Email recibido:", email);
  console.log("Longitud del código:", code?.length);

  if (!code) {
    console.log("❌ Código no proporcionado");
    return res.status(400).json({ error: "Código de reserva requerido" });
  }

  if (code.length !== 12) {
    console.log(`❌ Longitud de código incorrecta: ${code.length} (debe ser 12)`);
    return res.status(400).json({ error: "Código de reserva inválido (debe tener 12 caracteres)" });
  }

  if (!email) {
    console.log("❌ Email no proporcionado");
    return res.status(400).json({ error: "Email requerido" });
  }

  try {
    console.log("📡 Consultando Supabase...");
    console.log("Parámetros:", { code, email, status: "pending" });

    const { data: reservation, error } = await supabaseAdmin
      .from("reservations")
      .select(`
        *,
        reservation_slots(
          time_slots(date, start_time, end_time)
        ),
        plans(name, price, duration_minutes)
      `)
      .eq("reservation_code", code)
      .eq("email", email)
      .eq("status", "pending")
      .single();

    console.log("Resultado de la consulta:");
    console.log("- Error:", error);
    console.log("- Reserva encontrada:", !!reservation);

    if (error) {
      console.log("❌ Error de Supabase:", error.message);
      console.log("Código de error:", error.code);
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    if (!reservation) {
      console.log("❌ No se encontró ninguna reserva con esos datos");
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    // Aplanar time_slots para no modificar el frontend
    reservation.time_slots = reservation.reservation_slots?.[0]?.time_slots || null;
    delete reservation.reservation_slots;

    console.log("✅ Reserva encontrada:", {
      id: reservation.id,
      reservation_code: reservation.reservation_code,
      name: reservation.name,
      status: reservation.status,
      people: reservation.people,
      time_slots: reservation.time_slots
    });

    return res.status(200).json({ reservation });

  } catch (error) {
    console.error("❌ Error en accessReservation:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({ error: "Error al buscar la reserva", details: error.message });
  }
}

// ============================================
// MODIFICAR RESERVA (jugadores o horario)
// ============================================
async function changeReservation(req, res, { code, email, people, newSlotId }) {
  if (!code || !email) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }

  try {
    // Obtener la reserva
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select(`
        id,
        people,
        plan_id,
        plans(price),
        reservation_slots(slot_id)
      `)
      .eq("reservation_code", code)
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (fetchError || !reservation) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    // Caso: Cambiar número de jugadores
    if (people && people !== reservation.people) {
      const pricePerPerson = reservation.plans.price;
      const originalTotal = pricePerPerson * reservation.people;
      const newTotal = pricePerPerson * people;
      const extraPayment = Math.max(newTotal - originalTotal, 0);

      // Actualizar jugadores en la base de datos
      const { error: updateError } = await supabaseAdmin
        .from("reservations")
        .update({ 
          people: people,
          precio_total: newTotal  // ✅ Actualizar también el precio total
        })
        .eq("id", reservation.id);

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        extra_payment: extraPayment,
        new_total: newTotal,
        message: extraPayment > 0 ? "Se requiere pago adicional" : "Reserva actualizada"
      });
    }

    // Caso: Cambiar horario
    if (newSlotId) {
      const { data: newSlot, error: slotError } = await supabaseAdmin
        .from("time_slots")
        .select("status, max_capacity")
        .eq("id", newSlotId)
        .single();

      if (slotError || !newSlot || newSlot.status !== "active") {
        return res.status(400).json({ error: "El horario seleccionado no está disponible" });
      }

      // Liberar slots antiguos
      const oldSlotIds = reservation.reservation_slots.map(rs => rs.slot_id);
      if (oldSlotIds.length > 0) {
        await supabaseAdmin
          .from("time_slots")
          .update({ status: "active" })
          .in("id", oldSlotIds);
      }

      // Eliminar relaciones antiguas
      await supabaseAdmin
        .from("reservation_slots")
        .delete()
        .eq("reservation_id", reservation.id);

      // Crear nueva relación
      await supabaseAdmin
        .from("reservation_slots")
        .insert({ reservation_id: reservation.id, slot_id: newSlotId });

      // Bloquear el nuevo slot
      await supabaseAdmin
        .from("time_slots")
        .update({ status: "blocked" })
        .eq("id", newSlotId);

      return res.status(200).json({
        success: true,
        message: "Horario actualizado correctamente"
      });
    }

    return res.status(400).json({ error: "No se especificó qué modificar" });

  } catch (error) {
    console.error("Error changing reservation:", error);
    return res.status(500).json({ error: "Error modificando la reserva" });
  }
}

// ============================================
// CANCELAR RESERVA (solo pendientes)
// ============================================
async function cancelReservation(req, res, { code, email }) {
  if (!code || !email) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }

  try {
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select(`
        id,
        people,
        reservation_slots(slot_id)
      `)
      .eq("reservation_code", code)
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (fetchError || !reservation) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const slotIds = reservation.reservation_slots.map(rs => rs.slot_id);

    const { error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", reservation.id);

    if (updateError) throw updateError;

    if (slotIds.length > 0) {
      const { error: slotError } = await supabaseAdmin
        .from("time_slots")
        .update({ status: "active" })
        .in("id", slotIds);

      if (slotError) throw slotError;
    }

    const { data: updatedReservation } = await supabaseAdmin
      .from("reservations")
      .select(`
        *,
        reservation_slots(
          time_slots(date, start_time, end_time)
        ),
        plans(name, price, duration_minutes)
      `)
      .eq("id", reservation.id)
      .single();

    // Aplanar time_slots igual que en accessReservation
    const timeSlots = updatedReservation.reservation_slots?.[0]?.time_slots || null;

    // Enviar email
    await fetch(`${getBaseUrl()}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "cancellation",
        name: updatedReservation.name,
        email: updatedReservation.email,
        reservation_code: updatedReservation.reservation_code,
        date: timeSlots?.date,
        time_range: timeSlots
          ? `${timeSlots.start_time?.slice(0, 5)} - ${timeSlots.end_time?.slice(0, 5)}`
          : null,
        plan_name: updatedReservation.plans?.name,
        people: updatedReservation.people,
        total_price: updatedReservation.precio_total
      })
    }).catch(err => console.error("Error enviando email de cancelación:", err));

    return res.status(200).json({
      success: true,
      message: "Reserva cancelada correctamente",
      reservation: updatedReservation
    });

  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return res.status(500).json({ error: "Error cancelando la reserva" });
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
    menor_edad,
    personas_electroshock  // ✅ Nuevo campo
  } = req.body;

  // ✅ Validación incluyendo personas_electroshock
  if (
    !slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0 ||
    !plan_id || !name || !email || !people ||
    personas_electroshock === undefined  // ✅ Validar que viene
  ) {
    console.error("Missing fields:", {
      slot_ids,
      plan_id,
      name,
      email,
      people,
      menor_edad,
      personas_electroshock
    });
    return res.status(400).json({
      error: "Missing required fields"
    });
  }

  const players = parseInt(people);
  const electroshock = parseInt(personas_electroshock);

  if (players < 1) {
    return res.status(400).json({
      error: "Invalid number of players"
    });
  }

  // ✅ Validar que electroshock no sea mayor que el total de jugadores
  if (electroshock > players) {
    return res.status(400).json({
      error: "El número de personas para electroshock no puede ser mayor que el total de jugadores"
    });
  }

  // ✅ Validar que electroshock sea al menos 1
  if (electroshock < 1) {
    return res.status(400).json({
      error: "Debe haber al menos 1 persona para electroshock"
    });
  }

  /* --------------------------
     🚫 Validar email y telefono
  -------------------------- */

  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: "Invalid email"
    });
  }



  /* --------------------------
     🚫 Validar slots no pasados
  -------------------------- */
  const { data: slotsData, error: slotsError } = await supabaseAdmin
    .from("time_slots")
    .select("date, start_time")
    .in("id", slot_ids);

  if (slotsError || !slotsData || slotsData.length === 0) {
    return res.status(400).json({
      error: "Slots inválidos"
    });
  }

  const now = new Date();

  for (const s of slotsData) {
    const slotDateTime = new Date(`${s.date}T${s.start_time}`);
    if (slotDateTime <= now) {
      return res.status(409).json({
        error: "No puedes reservar un horario pasado"
      });
    }
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
        p_phone: phone || null,
        p_people: players,
        p_personas_electroshock: electroshock,  // ✅ Enviar a la RPC
        p_reservation_code: reservation_code,
        p_menor_edad: menor_edad ?? false
      }
    );

    if (error) {
      console.error("Error en RPC:", error);
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
    console.error("Error creating reservation:", error);
    return res.status(500).json({
      error: "Error creating reservation"
    });
  }
}