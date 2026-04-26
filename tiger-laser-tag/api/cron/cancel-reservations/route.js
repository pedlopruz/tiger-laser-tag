// app/api/cron/cancel-reservations/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // 🔒 Seguridad: verificar token secreto
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date();
  let cancelled = 0;

  try {
    // Obtener reservas pendientes
    const { data: reservations } = await supabase
      .from('reservations')
      .select(`
        id, people, name, email, reservation_code,
        reservation_slots(slot_id, time_slots(date, start_time))
      `)
      .eq('status', 'pending');

    for (const reservation of reservations || []) {
      const slots = reservation.reservation_slots;
      if (!slots?.length) continue;

      const firstSlot = slots.sort((a, b) => 
        a.time_slots.start_time.localeCompare(b.time_slots.start_time)
      )[0];
      
      const slotDateTime = new Date(`${firstSlot.time_slots.date}T${firstSlot.time_slots.start_time}`);
      const hoursDiff = (slotDateTime - now) / (1000 * 60 * 60);

      if (hoursDiff < 48 && hoursDiff > 0) {
        const slotIds = slots.map(s => s.slot_id);
        
        // Liberar slots
        await supabase.from('time_slots').update({ status: 'active' }).in('id', slotIds);
        
        // Cancelar reserva
        await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', reservation.id);
        
        cancelled++;
      }
    }

    return NextResponse.json({ success: true, cancelled });

  } catch (error) {
    console.error('❌ Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Configuración del cron (opcional, también se puede en vercel.json)
export const config = {
  runtime: 'edge',
  regions: ['auto'],
};