// api/cron/cancel-reservations.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔒 Verificar clave secreta
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.log('❌ Unauthorized cron attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🕐 Ejecutando cron job...', new Date().toISOString());

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno');
    return res.status(500).json({ error: 'Missing environment variables' });
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
        
        await supabase.from('time_slots').update({ status: 'active' }).in('id', slotIds);
        await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', reservation.id);
        
        cancelledCount++;
        console.log(`✅ Cancelada: ${reservation.reservation_code}`);
      }
    }

    return res.status(200).json({ 
      success: true, 
      cancelled: cancelledCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: error.message });
  }
}