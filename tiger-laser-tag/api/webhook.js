import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log('=== WEBHOOK ===');
  console.log('Method:', req.method);

  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET no configurado');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const rawBody = Buffer.concat(buffers);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log('✅ Evento:', event.type);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const reservationCode = paymentIntent.metadata.reservation_code;
    const reservationDataRaw = paymentIntent.metadata.reservation_data;

    console.log(`✅ Pago exitoso para ${reservationCode}`);

    if (reservationDataRaw) {
      try {
        const reservationData = JSON.parse(reservationDataRaw);
        const { supabaseAdmin } = await import('./supabaseAdmin.js');

        const { error } = await supabaseAdmin.rpc('create_reservation_blocking', {
          p_slot_ids: reservationData.slot_ids,
          p_plan_id: reservationData.plan_id,
          p_name: reservationData.name,
          p_email: reservationData.email,
          p_phone: reservationData.phone || null,
          p_people: parseInt(reservationData.people),
          p_personas_electroshock: parseInt(reservationData.personas_electroshock),
          p_reservation_code: reservationCode,
          p_menor_edad: reservationData.menor_edad ?? false,
          p_payment_intent_id: paymentIntent.id
        });

        if (error) {
          console.error('❌ Error:', error);
        } else {
          console.log(`✅ Reserva ${reservationCode} creada`);
        }
      } catch (err) {
        console.error('❌ Error:', err);
      }
    }
  }

  res.status(200).json({ received: true });
}