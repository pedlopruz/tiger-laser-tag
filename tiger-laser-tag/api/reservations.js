// /api/reservations.js
import { supabaseAdmin } from "./supabaseAdmin.js";
import { nanoid } from "nanoid";
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
          slot_id,
          time_slots(date, start_time, end_time)
        ),
        plans(name, price, duration_minutes, active, num_slots)
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

    // ✅ Guardar los slot_ids actuales antes de modificar
    const currentSlotIds = reservation.reservation_slots?.map(rs => rs.slot_id) || [];
    
    // ✅ Aplanar time_slots para el frontend (sin eliminar el original)
    reservation.time_slots = reservation.reservation_slots?.[0]?.time_slots || null;
    reservation.num_slots = reservation.reservation_slots?.length || 1;
    
    // ✅ Añadir campo con los IDs de los slots actuales
    reservation.current_slot_ids = currentSlotIds;
    
    // ❌ NO eliminar reservation_slots - mantenerlo para que el frontend pueda acceder
    // delete reservation.reservation_slots;

    console.log("✅ Reserva encontrada:", {
      id: reservation.id,
      reservation_code: reservation.reservation_code,
      name: reservation.name,
      status: reservation.status,
      people: reservation.people,
      time_slots: reservation.time_slots,
      current_slot_ids: reservation.current_slot_ids,
      num_slots: reservation.num_slots
    });

    return res.status(200).json({ reservation });

  } catch (error) {
    console.error("❌ Error en accessReservation:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({ error: "Error al buscar la reserva", details: error.message });
  }
}
// ============================================
// CAMBIAR RESERVA
// ============================================
async function changeReservation(req, res, { code, email, people, newSlotIds }) {
  if (!code || !email) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }

  try {
    console.log("🔍 === INICIO changeReservation ===");
    console.log("📝 newSlotIds recibidos:", newSlotIds);
    console.log("📝 newSlotIds length:", newSlotIds?.length);

    // Obtener la reserva con los datos necesarios
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select(`
        id,
        people,
        status,
        plan_id,
        plans(price, num_slots, related_plan_id)
      `)
      .eq("reservation_code", code)
      .eq("email", email)
      .in("status", ["pending", "confirmed"])
      .single();

    if (fetchError || !reservation) {
      console.log("❌ Reserva no encontrada:", fetchError);
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    console.log("✅ Reserva encontrada:", {
      id: reservation.id,
      status: reservation.status,
      plan_id: reservation.plan_id,
      people: reservation.people
    });

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

    console.log("📦 Slots actuales:", {
      oldSlotIds,
      oldSlotCount
    });

    // Constantes de facturación mínima
    const MINIMUM_BILLED = 10;
    const billable = (n) => Math.max(n, MINIMUM_BILLED);

    // ─── Caso: Cambiar número de jugadores ───────────────────────────────────
    if (people && people !== reservation.people) {
      // ... (código existente)
    }

    // ─── Caso: Cambiar horario ───────────────────────────────────────────────
    if (newSlotIds && newSlotIds.length > 0) {
      console.log("🕐 Procesando cambio de horario...");

      // Verificar si alguno de los slots actuales es compartido
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

      // ✅ IMPORTANTE: Para cambios que mantienen o reducen slots, permitir usar los slots actuales
      // No verificar disponibilidad de slots que ya son del usuario
      const newSlotIdsSet = new Set(newSlotIds);
      const oldSlotIdsSet = new Set(oldSlotIds);
      
      // Slots que son NUEVOS (no estaban en la reserva anterior)
      const trulyNewSlotIds = newSlotIds.filter(id => !oldSlotIdsSet.has(id));
      
      console.log("🔍 Análisis de slots:", {
        newSlotIds,
        oldSlotIds,
        trulyNewSlotIds
      });

      // Solo verificar disponibilidad de los slots NUEVOS (que no pertenecían al usuario)
      if (trulyNewSlotIds.length > 0) {
        const { data: newSlots, error: slotError } = await supabaseAdmin
          .from("time_slots")
          .select("id, status")
          .in("id", trulyNewSlotIds);

        if (slotError || !newSlots || newSlots.length !== trulyNewSlotIds.length) {
          return res.status(400).json({ error: "Uno o más horarios no existen" });
        }

        const unavailable = newSlots.find(s => s.status !== "active");
        if (unavailable) {
          console.log("❌ Slot no disponible:", unavailable);
          return res.status(400).json({ error: `El horario ${unavailable.id} no está disponible` });
        }
        
        console.log("✅ Todos los slots nuevos están disponibles");
      } else {
        console.log("✅ No hay slots nuevos que verificar (solo modificando slots existentes o reduciendo)");
      }

      // Recalcular el plan y precio si cambia la cantidad de slots
      const newSlotCount = newSlotIds.length;

      if (oldSlotCount !== newSlotCount) {
        console.log(`🔄 Cambiando cantidad de slots: ${oldSlotCount} -> ${newSlotCount}`);
        
        let newPlan = null;
        
        // ✅ Usar related_plan_id para encontrar el plan correspondiente
        if (oldSlotCount === 2 && newSlotCount === 1) {
          console.log("🔍 Buscando plan relacionado para reducir de 2 a 1 hora");
          const { data: currentPlan } = await supabaseAdmin
            .from("plans")
            .select("related_plan_id")
            .eq("id", reservation.plan_id)
            .single();
          
          console.log("📊 Plan actual:", currentPlan);
          
          if (currentPlan?.related_plan_id) {
            const { data: relatedPlan } = await supabaseAdmin
              .from("plans")
              .select("id, price, num_slots")
              .eq("id", currentPlan.related_plan_id)
              .eq("active", true)
              .single();
            
            newPlan = relatedPlan;
            console.log("📊 Plan relacionado encontrado:", newPlan);
          }
        } 
        else if (oldSlotCount === 1 && newSlotCount === 2) {
          console.log("🔍 Buscando plan relacionado para aumentar de 1 a 2 horas");
          const { data: currentPlan } = await supabaseAdmin
            .from("plans")
            .select("related_plan_id")
            .eq("id", reservation.plan_id)
            .single();
          
          if (currentPlan?.related_plan_id) {
            const { data: relatedPlan } = await supabaseAdmin
              .from("plans")
              .select("id, price, num_slots")
              .eq("id", currentPlan.related_plan_id)
              .eq("active", true)
              .single();
            
            newPlan = relatedPlan;
          }
        }
        
        // ✅ Fallback: si no se encontró por related_plan_id, buscar por num_slots
        if (!newPlan) {
          console.log("🔍 Buscando plan por num_slots como fallback");
          const { data: planBySlots } = await supabaseAdmin
            .from("plans")
            .select("id, price, num_slots")
            .eq("num_slots", newSlotCount)
            .eq("active", true)
            .maybeSingle();
          
          newPlan = planBySlots;
          console.log("📊 Plan por num_slots:", newPlan);
        }
        
        if (!newPlan) {
          console.log("❌ No se encontró plan para", newSlotCount, "hora(s)");
          return res.status(400).json({
            error: `No se encontró un plan disponible para ${newSlotCount} hora(s)`
          });
        }

        // Calcular el nuevo total
        const newTotal = newPlan.price * billable(reservation.people);
        const oldTotal = reservation.plans.price * billable(reservation.people);
        const extraPayment = Math.max(newTotal - oldTotal, 0);

        console.log("💰 Cálculo de cambio de plan:", {
          oldPlanId: reservation.plan_id,
          oldPlanPrice: reservation.plans.price,
          oldSlotCount,
          newPlanId: newPlan.id,
          newPlanPrice: newPlan.price,
          newSlotCount,
          people: reservation.people,
          billablePeople: billable(reservation.people),
          oldTotal,
          newTotal,
          extraPayment
        });

        // Actualizar plan y precio en la reserva
        const { error: updateError } = await supabaseAdmin
          .from("reservations")
          .update({ plan_id: newPlan.id, precio_total: newTotal })
          .eq("id", reservation.id);

        if (updateError) {
          console.log("❌ Error actualizando plan:", updateError);
          throw updateError;
        }

        // Liberar slots antiguos (solo los que ya no se usan)
        const slotsToRelease = oldSlotIds.filter(id => !newSlotIdsSet.has(id));
        if (slotsToRelease.length > 0) {
          console.log("🔓 Liberando slots:", slotsToRelease);
          await supabaseAdmin
            .from("time_slots")
            .update({ status: "active" })
            .in("id", slotsToRelease);
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

        // Bloquear los nuevos slots (solo los que son realmente nuevos)
        if (trulyNewSlotIds.length > 0) {
          console.log("🔒 Bloqueando nuevos slots:", trulyNewSlotIds);
          await supabaseAdmin
            .from("time_slots")
            .update({ status: "blocked" })
            .in("id", trulyNewSlotIds);
        }

        return res.status(200).json({
          success: true,
          extra_payment: extraPayment,
          new_total: newTotal,
          new_plan_id: newPlan.id,
          message: extraPayment > 0
            ? `Horario y plan actualizados a ${newSlotCount} hora(s). Se requiere pago adicional de €${extraPayment}`
            : `Horario y plan actualizados correctamente a ${newSlotCount} hora(s)`
        });
      }

      // Sin cambio de cantidad de slots: flujo original
      console.log("🔄 Mismo número de slots, solo cambiando horario");
      
      // Liberar slots antiguos que ya no se usan
      const slotsToRelease = oldSlotIds.filter(id => !newSlotIdsSet.has(id));
      if (slotsToRelease.length > 0) {
        console.log("🔓 Liberando slots:", slotsToRelease);
        await supabaseAdmin
          .from("time_slots")
          .update({ status: "active" })
          .in("id", slotsToRelease);
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

      // Bloquear los nuevos slots (solo los que son nuevos)
      if (trulyNewSlotIds.length > 0) {
        console.log("🔒 Bloqueando nuevos slots:", trulyNewSlotIds);
        await supabaseAdmin
          .from("time_slots")
          .update({ status: "blocked" })
          .in("id", trulyNewSlotIds);
      }

      return res.status(200).json({
        success: true,
        message: "Horario actualizado correctamente"
      });
    }

    return res.status(400).json({ error: "No se especificó qué modificar" });

  } catch (error) {
    console.error("❌ Error changing reservation:", error);
    return res.status(500).json({ error: "Error modificando la reserva", details: error.message });
  }
}

// ============================================
// CANCELAR RESERVA
// ============================================
async function cancelReservation(req, res, { code, email }) {
  if (!code || !email) {
    return res.status(400).json({ error: "Campos requeridos faltantes" });
  }

  try {
    // Primero obtener la reserva con el plan para saber si es compartida
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from("reservations")
      .select(`
        id,
        people,
        status,
        plan_id,
        plans(active, name),
        reservation_slots(slot_id)
      `)
      .eq("reservation_code", code)
      .eq("email", email)
      .in("status", ["pending", "confirmed"])  // Permitir ambos estados inicialmente
      .single();

    if (fetchError || !reservation) {
      console.log("❌ Reserva no encontrada:", fetchError);
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const isSharedPlan = reservation.plans?.active === false;
    const currentStatus = reservation.status;

    console.log("📊 Cancelación solicitada:", {
      reservationId: reservation.id,
      currentStatus,
      isSharedPlan,
      planName: reservation.plans?.name
    });

    // ✅ Reglas de cancelación:
    // - Reservas normales (active = true): solo se pueden cancelar si están PENDING
    // - Reservas compartidas (active = false): se pueden cancelar si están PENDING o CONFIRMED
    if (!isSharedPlan && currentStatus !== "pending") {
      return res.status(403).json({ 
        error: "Las reservas normales solo se pueden cancelar mientras están pendientes de confirmación. Una vez confirmadas, contacta con el establecimiento." 
      });
    }

    if (isSharedPlan && currentStatus === "cancelled") {
      return res.status(403).json({ 
        error: "Esta reserva ya está cancelada." 
      });
    }

    const slotIds = reservation.reservation_slots?.map(rs => rs.slot_id) || [];

    // Actualizar estado de la reserva a cancelled
    const { error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", reservation.id);

    if (updateError) throw updateError;

    // Liberar los slots (ponerlos como active)
    if (slotIds.length > 0) {
      console.log("🔓 Liberando slots:", slotIds);
      const { error: slotError } = await supabaseAdmin
        .from("time_slots")
        .update({ status: "active" })
        .in("id", slotIds);

      if (slotError) throw slotError;
    }

    // Obtener la reserva actualizada para devolverla
    const { data: updatedReservation, error: fetchUpdatedError } = await supabaseAdmin
      .from("reservations")
      .select(`
        *,
        reservation_slots(
          slot_id,
          time_slots(date, start_time, end_time)
        ),
        plans(name, price, duration_minutes, active)
      `)
      .eq("id", reservation.id)
      .single();

    if (fetchUpdatedError) {
      console.log("⚠️ No se pudo obtener la reserva actualizada:", fetchUpdatedError);
      // Aún así, la cancelación fue exitosa
      return res.status(200).json({
        success: true,
        message: "Reserva cancelada correctamente",
        reservation: { ...reservation, status: "cancelled" }
      });
    }

    console.log("✅ Reserva cancelada exitosamente:", {
      id: updatedReservation.id,
      status: updatedReservation.status,
      isShared: updatedReservation.plans?.active === false
    });

    return res.status(200).json({
      success: true,
      message: "Reserva cancelada correctamente",
      reservation: updatedReservation
    });

  } catch (error) {
    console.error("❌ Error cancelling reservation:", error);
    return res.status(500).json({ error: "Error cancelando la reserva", details: error.message });
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

  // Validar slots no pasados y detectar si es compartida
  const { data: slotsData, error: slotsError } = await supabaseAdmin
    .from("time_slots")
    .select("date, start_time, shared_plan_id")
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

  // Detectar si es reserva compartida
  const isShared = slotsData.some(s => s.shared_plan_id !== null);

  try {
    const reservation_code = nanoid(12);

    if (isShared) {
      // ── Reserva compartida (sin pago) ──
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
        is_shared: true,
        requires_payment: false
      });

    } else {
      // ── Reserva normal (requiere fianza de 100€) ──

      // 1. Crear PaymentIntent directamente con Stripe
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: 10000, // 100€ en céntimos
          currency: 'eur',
          metadata: {
            reservationCode: reservation_code,
            people: players.toString()
          },
          description: `Fianza reserva Laser Tag - ${reservation_code}`
        });
        console.log(`✅ PaymentIntent creado: ${paymentIntent.id}`);
      } catch (stripeError) {
        console.error("Error creando PaymentIntent:", stripeError);
        return res.status(500).json({ error: "Error al iniciar el proceso de pago" });
      }

      // 2. Crear la reserva en Supabase
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
          p_menor_edad: menor_edad ?? false,
          p_payment_intent_id: paymentIntent.id
        }
      );

      if (error) {
        // Si falla la reserva, cancelar el PaymentIntent para no dejar pagos huérfanos
        console.error("Error en RPC, cancelando PaymentIntent:", error);
        try {
          await stripe.paymentIntents.cancel(paymentIntent.id);
        } catch (cancelError) {
          console.error("Error cancelando PaymentIntent:", cancelError);
        }
        return res.status(409).json({ error: error.message });
      }

      console.log(`✅ Reserva creada: ${data.reservation_id}`);

      return res.status(200).json({
        success: true,
        reservation_id: data.reservation_id,
        code: reservation_code,
        is_shared: false,
        requires_payment: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    }

  } catch (error) {
    console.error("Error creating reservation:", error);
    return res.status(500).json({ error: "Error creating reservation" });
  }
}