// tiger-laser-tag/api/cron/cancel-reservations/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // 🔒 Verificar clave secreta
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.log('❌ Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🕐 Ejecutando cron job...', new Date().toISOString());

  // ✅ Usar las variables correctas (sin NEXT_PUBLIC_)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno');
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  let cancelledCount = 0;
  const cancelledReservations = [];

  try {
    // Obtener reservas pendientes con sus slots
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        people,
        name,
        email,
        reservation_code,
        reservation_slots (
          slot_id,
          time_slots (date, start_time)
        )
      `)
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    console.log(`📊 Encontradas ${reservations?.length || 0} reservas pendientes`);

    for (const reservation of reservations || []) {
      const slots = reservation.reservation_slots;
      if (!slots?.length) continue;

      // Ordenar slots por hora
      const sortedSlots = [...slots].sort((a, b) => 
        a.time_slots.start_time.localeCompare(b.time_slots.start_time)
      );
      const firstSlot = sortedSlots[0];
      
      const slotDateTime = new Date(`${firstSlot.time_slots.date}T${firstSlot.time_slots.start_time}`);
      const hoursDiff = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Si faltan menos de 48 horas y la reserva sigue pendiente
      if (hoursDiff < 48 && hoursDiff > 0) {
        const slotIds = slots.map(s => s.slot_id);
        
        // Liberar slots (ponerlos como activos)
        const { error: slotsError } = await supabase
          .from('time_slots')
          .update({ status: 'active' })
          .in('id', slotIds);
        
        if (slotsError) throw slotsError;
        
        // Cancelar la reserva
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('id', reservation.id);
        
        if (updateError) throw updateError;
        
        cancelledCount++;
        cancelledReservations.push({
          id: reservation.id,
          code: reservation.reservation_code,
          name: reservation.name
        });
        
        console.log(`✅ Cancelada reserva: ${reservation.reservation_code} - ${reservation.name}`);
      }
    }

    console.log(`📊 Total canceladas: ${cancelledCount}`);

    return NextResponse.json({ 
      success: true, 
      cancelled: cancelledCount,
      details: cancelledReservations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en cron job:', error);
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Opcional: Configuración para edge runtime
export const config = {
  runtime: 'edge',
};