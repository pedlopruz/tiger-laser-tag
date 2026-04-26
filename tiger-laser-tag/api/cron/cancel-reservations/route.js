// tiger-laser-tag/api/cron/cancel-reservations/route.js
import { createClient } from '@supabase/supabase-js';

// ❌ Eliminar esta línea (edge runtime config)
// export const config = { runtime: 'edge' };

export async function GET(request) {
  // 🔒 Verificar clave secreta
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.log('❌ Unauthorized cron attempt');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log('🕐 Ejecutando cron job...', new Date().toISOString());

  // Usar las variables correctas
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno');
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  let cancelledCount = 0;

  try {
    // Obtener reservas pendientes
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

      const sortedSlots = [...slots].sort((a, b) => 
        a.time_slots.start_time.localeCompare(b.time_slots.start_time)
      );
      const firstSlot = sortedSlots[0];
      
      const slotDateTime = new Date(`${firstSlot.time_slots.date}T${firstSlot.time_slots.start_time}`);
      const hoursDiff = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 48 && hoursDiff > 0) {
        const slotIds = slots.map(s => s.slot_id);
        
        // Liberar slots
        const { error: slotsError } = await supabase
          .from('time_slots')
          .update({ status: 'active' })
          .in('id', slotIds);
        
        if (slotsError) throw slotsError;
        
        // Cancelar reserva
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('id', reservation.id);
        
        if (updateError) throw updateError;
        
        cancelledCount++;
        console.log(`✅ Cancelada: ${reservation.reservation_code}`);
      }
    }

    console.log(`📊 Total canceladas: ${cancelledCount}`);

    return new Response(JSON.stringify({ 
      success: true, 
      cancelled: cancelledCount,
      timestamp: new Date().toISOString()
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}