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

    /* --------------------------
       1️⃣ Hora actual (robusta)
    -------------------------- */

    const now = new Date();

    // YYYY-MM-DD en UTC (consistente)
    const todayStr = now.toISOString().split("T")[0];

    // HH:mm actual
    const currentTime = now.toTimeString().slice(0, 5);

    /* --------------------------
       2️⃣ Obtener slots con información de reservas
    -------------------------- */

    const { data: slots, error } = await supabaseAdmin
      .from("time_slots")
      .select(`
        id, 
        start_time, 
        end_time, 
        status, 
        max_capacity,
        reserved
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

    /* --------------------------
       3️⃣ Construcción resultado con reglas de negocio
    -------------------------- */

    const result = slots.map(slot => {

      const capacity = slot.max_capacity ?? 0;
      const reservedCount = slot.reserved ?? 0;

      // 🔥 Detectar si el slot ya pasó
      const isPast =
        date < todayStr ||
        (date === todayStr && slot.start_time <= currentTime);

      // 🚫 REGLA DE NEGOCIO: Un slot está disponible SOLO si:
      // 1. Está activo
      // 2. No ha pasado
      // 3. NO tiene ninguna reserva (reserved = 0)
      const isAvailable = 
        slot.status === "active" && 
        !isPast && 
        reservedCount === 0;

      // Si tiene reservas, está bloqueado (incluso si está activo)
      const isBlocked = reservedCount > 0;
      
      // Para mostrar al usuario si está bloqueado por reserva
      let statusMessage = "";
      if (isBlocked) {
        statusMessage = "Completamente reservado";
      } else if (isPast) {
        statusMessage = "Horario pasado";
      } else if (slot.status !== "active") {
        statusMessage = "No disponible";
      }

      return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        
        // Capacidad total del slot
        capacity: capacity,
        
        // Número real de reservas en este slot
        reserved: reservedCount,
        
        // Plazas restantes según reglas de negocio
        // Si ya tiene reserva, 0 plazas disponibles
        remaining: isAvailable ? capacity : 0,
        
        // Flag para saber si está bloqueado por reserva
        isBlocked: isBlocked,
        
        // Flag para saber si está completamente lleno (según reglas)
        isFull: !isAvailable,
        
        // Estado real del slot en BD
        status: slot.status,
        
        // Disponibilidad para el usuario
        isAvailable: isAvailable,
        
        // Mensaje de estado para el frontend
        statusMessage: statusMessage
      };

    });

    /* --------------------------
       4️⃣ Respuesta
    -------------------------- */

    return res.status(200).json({
      slots: result,
      date: date,
      timestamp: now.toISOString()
    });

  } catch (err) {

    console.error("Error in getSlotsByDate:", err);

    return res.status(500).json({
      error: "Error loading slots"
    });

  }

}