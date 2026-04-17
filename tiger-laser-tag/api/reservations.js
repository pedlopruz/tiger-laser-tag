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

  const { action, code, email, people, newSlotIds, ...rest } = req.body;

  try {
    // Acceder a reserva existente
    if (action === "access") {
      return accessReservation(req, res, { code, email });
    }

    // Modificar reserva (cambiar jugadores o horario)
    if (action === "change") {
      return changeReservation(req, res, { code, email, people, newSlotIds });
    }

    // Cancelar reserva
    if (action === "cancel") {
      return cancelReservation(req, res, { code, email });
    }
    // Confirmar reserva      
    if (action === "confirm") {
      return confirmReservation(req, res, { code, email });
    }

    // Crear nueva reserva (acción por defecto)
    return createReservation(req, res, rest);

  } catch (error) {
    console.error("Error in reservations handler:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL.startsWith("https://")
      ? process.env.VERCEL_URL
      : `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:5173";
};

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
    console.log("Parámetros:", { code, email, status: ["pending", "confirmed"] });

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
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

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
    reservation.num_slots = reservation.reservation_slots?.length || 1; // ← añade esta línea
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

async function changeReservation(req, res, { code, email, people, newSlotIds }) {
  if (!code || !email) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }

  try {
    // Obtener la reserva con los datos necesarios
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select(`
        id,
        people,
        status,
        plan_id,
        plans(price, num_slots)
      `)
      .eq("reservation_code", code)
      .eq("email", email)
      .in("status", ["pending", "confirmed"])
      .single();

    if (fetchError || !reservation) {
      console.log("❌ Reserva no encontrada:", fetchError);
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    // ✅ BLOQUEAR CAMBIOS si la reserva ya está confirmada
    if (reservation.status === "confirmed") {
      return res.status(403).json({ 
        error: "Las reservas confirmadas no pueden modificarse. Contacta con el establecimiento si necesitas hacer cambios." 
      });
    }

    // Obtener los slot_ids actuales de la reserva
    const { data: reservationSlots, error: slotsError } = await supabaseAdmin
      .from("reservation_slots")
      .select("slot_id")
      .eq("reservation_id", reservation.id);

    if (slotsError) throw slotsError;

    const oldSlotIds = reservationSlots?.map(rs => rs.slot_id) || [];
    const oldSlotCount = oldSlotIds.length;

    // ─── Caso: Cambiar número de jugadores ───────────────────────────────────
    if (people && people !== reservation.people) {
      const pricePerPerson = reservation.plans.price;
      const MINIMUM_BILLED = 10;
      const billable = (n) => Math.max(n, MINIMUM_BILLED);

      const originalTotal = pricePerPerson * billable(reservation.people);
      const newTotal = pricePerPerson * billable(people);
      const extraPayment = Math.max(newTotal - originalTotal, 0);

      const { error: updateError } = await supabaseAdmin
        .from("reservations")
        .update({ people, precio_total: newTotal })
        .eq("id", reservation.id);

      if (updateError) throw updateError;

      return res.status(200).json({
        success: true,
        extra_payment: extraPayment,
        new_total: newTotal,
        message: extraPayment > 0 ? "Se requiere pago adicional" : "Reserva actualizada"
      });
    }

    // ─── Caso: Cambiar horario ───────────────────────────────────────────────
    if (newSlotIds && newSlotIds.length > 0) {

      // Verificar si alguno de los slots actuales es compartido (tiene shared_plan_id)
      let hasSharedSlot = false;
      if (oldSlotIds.length > 0) {
        const { data: oldSlotsData } = await supabaseAdmin
          .from("time_slots")
          .select("shared_plan_id")
          .in("id", oldSlotIds);
        
        hasSharedSlot = oldSlotsData?.some(slot => slot.shared_plan_id !== null) || false;
      }

      if (hasSharedSlot) {
        return res.status(400).json({
          error: "Las reservas con slots compartidos no pueden cambiar de horario"
        });
      }

      // Verificar disponibilidad de todos los slots nuevos
      const { data: newSlots, error: slotError } = await supabaseAdmin
        .from("time_slots")
        .select("id, status")
        .in("id", newSlotIds);

      if (slotError || !newSlots || newSlots.length !== newSlotIds.length) {
        return res.status(400).json({ error: "Uno o más horarios no existen" });
      }

      const unavailable = newSlots.find(s => s.status !== "active");
      if (unavailable) {
        return res.status(400).json({ error: "Uno de los horarios seleccionados no está disponible" });
      }

      // Recalcular el plan y precio si cambia la cantidad de slots
      const newSlotCount = newSlotIds.length;

      if (oldSlotCount !== newSlotCount) {
        // Buscar el plan que corresponde al nuevo número de slots
        const { data: newPlan, error: planError } = await supabaseAdmin
          .from("plans")
          .select("id, price")
          .eq("num_slots", newSlotCount)
          .single();

        if (planError || !newPlan) {
          return res.status(400).json({
            error: `No existe un plan disponible para ${newSlotCount} hora(s)`
          });
        }

        const MINIMUM_BILLED = 10;
        const billable = (n) => Math.max(n, MINIMUM_BILLED);
        const newTotal = newPlan.price * billable(reservation.people);

        const oldTotal = reservation.plans.price * billable(reservation.people);
        const extraPayment = Math.max(newTotal - oldTotal, 0);

        // Actualizar plan y precio en la reserva
        const { error: updateError } = await supabaseAdmin
          .from("reservations")
          .update({ plan_id: newPlan.id, precio_total: newTotal })
          .eq("id", reservation.id);

        if (updateError) throw updateError;

        // Liberar slots antiguos
        if (oldSlotIds.length > 0) {
          await supabaseAdmin
            .from("time_slots")
            .update({ status: "active" })
            .in("id", oldSlotIds);
        }

        // Reemplazar relaciones de slots
        await supabaseAdmin
          .from("reservation_slots")
          .delete()
          .eq("reservation_id", reservation.id);

        await supabaseAdmin
          .from("reservation_slots")
          .insert(newSlotIds.map(slotId => ({
            reservation_id: reservation.id,
            slot_id: slotId
          })));

        // Bloquear los nuevos slots
        await supabaseAdmin
          .from("time_slots")
          .update({ status: "blocked" })
          .in("id", newSlotIds);

        return res.status(200).json({
          success: true,
          extra_payment: extraPayment,
          new_total: newTotal,
          new_plan_id: newPlan.id,
          message: extraPayment > 0
            ? "Horario y plan actualizados. Se requiere pago adicional"
            : "Horario y plan actualizados correctamente"
        });
      }

      // Sin cambio de cantidad de slots: flujo original
      // Liberar slots antiguos
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

      // Insertar nuevas relaciones
      await supabaseAdmin
        .from("reservation_slots")
        .insert(newSlotIds.map(slotId => ({
          reservation_id: reservation.id,
          slot_id: slotId
        })));

      // Bloquear los nuevos slots
      await supabaseAdmin
        .from("time_slots")
        .update({ status: "blocked" })
        .in("id", newSlotIds);

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

async function createReservation(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    slot_ids,
    plan_id,
    name,
    email,
    phone,
    people,
    menor_edad,
    personas_electroshock
  } = req.body;

  if (
    !slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0 ||
    !plan_id || !name || !email || !people ||
    personas_electroshock === undefined
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const players = parseInt(people);
  const electroshock = parseInt(personas_electroshock);

  if (players < 1) {
    return res.status(400).json({ error: "Invalid number of players" });
  }

  if (electroshock > players) {
    return res.status(400).json({
      error: "El número de personas para electroshock no puede ser mayor que el total de jugadores"
    });
  }

  if (electroshock < 1) {
    return res.status(400).json({ error: "Debe haber al menos 1 persona para electroshock" });
  }

  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  // Validar slots no pasados
  const { data: slotsData, error: slotsError } = await supabaseAdmin
    .from("time_slots")
    .select("date, start_time, shared_plan_id")  // ← añadir shared_plan_id
    .in("id", slot_ids);

  if (slotsError || !slotsData || slotsData.length === 0) {
    return res.status(400).json({ error: "Slots inválidos" });
  }

  const now = new Date();
  for (const s of slotsData) {
    const slotDateTime = new Date(`${s.date}T${s.start_time}`);
    if (slotDateTime <= now) {
      return res.status(409).json({ error: "No puedes reservar un horario pasado" });
    }
  }

  // ✅ Detectar si es reserva compartida
  const isShared = slotsData.some(s => s.shared_plan_id !== null);

  try {
    const reservation_code = nanoid(12);

    if (isShared) {
      // ── Reserva compartida ──
      const { data, error } = await supabaseAdmin.rpc(
        "create_shared_reservation",
        {
          p_slot_ids: slot_ids,
          p_plan_id: plan_id,
          p_name: name,
          p_email: email,
          p_phone: phone || null,
          p_people: players,
          p_personas_electroshock: electroshock,
          p_reservation_code: reservation_code,
          p_menor_edad: menor_edad ?? false
        }
      );

      if (error) {
        console.error("Error en RPC compartida:", error);
        return res.status(409).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        reservation_id: data.reservation_id,
        code: reservation_code,
        is_shared: true
      });

    } else {
      // ── Reserva normal (existente) ──
      const { data, error } = await supabaseAdmin.rpc(
        "create_reservation_blocking",
        {
          p_slot_ids: slot_ids,
          p_plan_id: plan_id,
          p_name: name,
          p_email: email,
          p_phone: phone || null,
          p_people: players,
          p_personas_electroshock: electroshock,
          p_reservation_code: reservation_code,
          p_menor_edad: menor_edad ?? false
        }
      );

      if (error) {
        console.error("Error en RPC normal:", error);
        return res.status(409).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        reservation_id: data.reservation_id,
        code: reservation_code,
        is_shared: false
      });
    }

  } catch (error) {
    console.error("Error creating reservation:", error);
    return res.status(500).json({ error: "Error creating reservation" });
  }
}