import { supabaseAdmin } from "./supabaseAdmin.js";

export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      error: "Missing date"
    });
  }

  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Usar una consulta SQL más eficiente con Supabase
    const { data: slots, error } = await supabaseAdmin
      .from("time_slots")
      .select(`
        id,
        start_time,
        end_time,
        status,
        max_capacity,
        date
      `)
      .eq("date", date)
      .order("start_time");

    if (error) {
      console.error("Error fetching slots:", error);
      return res.status(500).json({
        error: error.message
      });
    }

    if (!slots || slots.length === 0) {
      return res.status(200).json({
        slots: []
      });
    }

    // Obtener todas las reservas confirmadas para estos slots
    const slotIds = slots.map(s => s.id);
    
    const { data: reservations, error: resError } = await supabaseAdmin
      .from("reservation_slots")
      .select(`
        slot_id,
        reservations!inner (
          people,
          status
        )
      `)
      .in("slot_id", slotIds)
      .eq("reservations.status", "confirmed");

    if (resError) {
      console.error("Error fetching reservations:", resError);
    }

    // Crear un mapa de slot_id -> total de personas reservadas
    const reservedMap = new Map();
    if (reservations) {
      reservations.forEach(rs => {
        const current = reservedMap.get(rs.slot_id) || 0;
        reservedMap.set(rs.slot_id, current + (rs.reservations?.people || 0));
      });
    }

    /* --------------------------
        Procesar slots
    -------------------------- */
    const result = slots.map(slot => {
      const capacity = slot.max_capacity ?? 0;
      const reservedCount = reservedMap.get(slot.id) || 0;
      
      const isPast = date < todayStr || (date === todayStr && slot.start_time <= currentTime);
      
      // REGLA DE NEGOCIO: Disponible solo si no tiene reservas
      const isAvailable = 
        slot.status === "active" && 
        !isPast && 
        reservedCount === 0;

      let statusMessage = "";
      if (reservedCount > 0) {
        statusMessage = "🔒 Reservado";
      } else if (isPast) {
        statusMessage = "Pasado";
      } else if (slot.status !== "active") {
        statusMessage = "No disponible";
      } else if (isAvailable) {
        statusMessage = `${capacity} plazas`;
      }

      return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: capacity,
        reserved: reservedCount,
        remaining: isAvailable ? capacity : 0,
        isAvailable: isAvailable,
        isBlocked: reservedCount > 0,
        isPast: isPast,
        status: slot.status,
        statusMessage: statusMessage
      };
    });

    return res.status(200).json({
      slots: result,
      date: date
    });

  } catch (err) {
    console.error("Error in getSlotsByDate:", err);
    return res.status(500).json({
      error: "Error loading slots"
    });
  }
}